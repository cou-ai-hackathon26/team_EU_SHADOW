"""Per-class weighted blend of several scratch-trained runs -> one browser ONNX graph.

1. Fit blend weights on VALIDATION logits only: w[m, c] = softmax over models, per class,
   p(c) = sum_m w[m, c] * softmax(z_m / T_m)(c), renormalised (minimise val NLL).
2. Fit one temperature on the blended val log-probs, choose tier thresholds on val.
3. Score internal test and BD5 once (4-class macro-F1 on BD5).
4. Export ONE ONNX graph: input `input`, outputs `logits` (= blended log-probs) and `cam`
   (per-class weighted sum of each model's min-max normalised CAM). Weights are stored as
   FP16 with a Cast to FP32 in front, so every op still runs in FP32 in ORT-Web.
5. Gates: FP32-graph vs PyTorch parity (atol 1e-4), FP16-storage vs FP32 graph on real
   photos (max prob diff <= 2e-3, 100% top-1 agreement), size <= 30 MB.
Writes agroleaf.onnx, model_meta.json, report.json, blend_results.json into --out.

    python blend_export.py --ml-dir ../.. --out out_dir --photos <real photos> \
        P1=<run dir> P2=<run dir> P3=<run dir>
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import time
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument("--ml-dir", required=True)
ap.add_argument("--out", required=True)
ap.add_argument("--photos", required=True, help="folder of real leaf photos for parity checks")
ap.add_argument("--split-sizes", default="8863,1902,1901")
ap.add_argument("runs", nargs="+", help="PIPE=run_dir (run_dir holds best.pt, logits.npz, results.json)")
a = ap.parse_args()
os.environ["AGROLEAF_ML_DIR"] = str(Path(a.ml_dir).resolve())
spec = importlib.util.spec_from_file_location("tt", Path(__file__).resolve().parent / "top3_train.py")
tt = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tt)
np, torch, nn, F = tt.np, tt.torch, tt.nn, tt.F
import onnx  # noqa: E402
import onnxruntime as ort  # noqa: E402
from onnx import TensorProto, helper, numpy_helper  # noqa: E402
from PIL import Image  # noqa: E402

out = Path(a.out)
out.mkdir(parents=True, exist_ok=True)
runs = dict(r.split("=", 1) for r in a.runs)
names = list(runs)
L = {k: np.load(Path(d) / "logits.npz") for k, d in runs.items()}
Ts = {k: json.loads((Path(d) / "results.json").read_text(encoding="utf-8"))["temperature"] for k, d in runs.items()}
splits = ("val", "test", "external_test")
y = {s: L[names[0]][f"{s}_y"] for s in splits}
for k in names:
    assert all((L[k][f"{s}_y"] == y[s]).all() for s in splits), f"{k}: label order differs"


def blend_logp(s: str, W: torch.Tensor) -> torch.Tensor:
    w = torch.softmax(W, 0)
    P = sum(w[i][None] * torch.softmax(torch.tensor(L[k][f"{s}_logits"], dtype=torch.float64) / Ts[k], 1)
            for i, k in enumerate(names))
    return torch.log(P / P.sum(1, keepdim=True))


W = torch.zeros(len(names), tt.K, dtype=torch.float64, requires_grad=True)
opt = torch.optim.Adam([W], lr=0.05)
yv = torch.tensor(y["val"])
for _ in range(500):
    opt.zero_grad()
    loss = F.nll_loss(blend_logp("val", W), yv) + 1e-3 * (W ** 2).sum()
    loss.backward()
    opt.step()
W = W.detach()
wts = torch.softmax(W, 0).float()
zb = {s: blend_logp(s, W).numpy() for s in splits}
T = tt.fit_temperature(zb["val"], y["val"])
th = tt.choose_thresholds(zb["val"], y["val"], T)
bd5 = sorted(set(y["external_test"].tolist()))
res = {"members": names, "weights": {k: [round(float(v), 4) for v in wts[i]] for i, k in enumerate(names)},
       "member_temperatures": Ts, "temperature": T, "thresholds": th}
for s, key in (("val", "val"), ("test", "internal_test"), ("external_test", "external_bd5")):
    lab = bd5 if s == "external_test" else None
    res[key] = {"uncalibrated": tt.full_metrics(zb[s], y[s], 1.0, lab), "calibrated": tt.full_metrics(zb[s], y[s], T, lab),
                "tiers": tt.tier_table(zb[s], y[s], T, th)}

# ---------------------------------------------------------------- one combined graph
nets = []
for k, d in runs.items():
    m = tt.build_model(k, tt.PIPELINES[k])
    m.load_state_dict(torch.load(Path(d) / "best.pt", map_location="cpu", weights_only=False)["state"])
    nets.append(m.eval())


class Blend(nn.Module):
    def __init__(self):
        super().__init__()
        self.nets = nn.ModuleList(nets)
        self.register_buffer("W", wts)
        self.register_buffer("T", torch.tensor([Ts[k] for k in names], dtype=torch.float32))

    def forward(self, x):
        P, C = 0, 0
        for i, n in enumerate(self.nets):
            lg, cam = n.forward_with_cam(x)
            P = P + self.W[i][None] * torch.softmax(lg / self.T[i], 1)
            mn, mx = cam.amin((2, 3), keepdim=True), cam.amax((2, 3), keepdim=True)
            C = C + self.W[i][None, :, None, None] * (cam - mn) / (mx - mn + 1e-6)
        return torch.log(P / P.sum(1, keepdim=True)), C


blend = Blend().eval()
fp32 = out / "blend_fp32.onnx"
torch.onnx.export(blend, (torch.zeros(1, 3, 224, 224),), str(fp32), input_names=["input"], output_names=["logits", "cam"],
                  opset_version=17, dynamo=False, dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}, "cam": {0: "batch"}})
g = onnx.load(str(fp32))
inits, casts = [], []
for init in list(g.graph.initializer):
    if init.data_type == TensorProto.FLOAT and int(np.prod(init.dims)) >= 16:
        n16 = init.name + "__fp16"
        inits.append(numpy_helper.from_array(numpy_helper.to_array(init).astype(np.float16), n16))
        casts.append(helper.make_node("Cast", [n16], [init.name], to=TensorProto.FLOAT))
    else:
        inits.append(init)
del g.graph.initializer[:]
g.graph.initializer.extend(inits)
nodes = list(g.graph.node)
del g.graph.node[:]
g.graph.node.extend(casts + nodes)
onnx.checker.check_model(g)
final = out / "agroleaf.onnx"
onnx.save(g, str(final))

# ---------------------------------------------------------------- gates on real photos
files = sorted(p for p in Path(a.photos).rglob("*") if p.suffix.lower() in {".jpg", ".jpeg", ".png"})
rng = np.random.RandomState(0)
xs = []
for i in rng.permutation(len(files)):
    try:
        with Image.open(files[i]) as im:
            xs.append(tt.eval_transform(im))
    except Exception:
        continue
    if len(xs) == 200:
        break
s32 = ort.InferenceSession(str(fp32), providers=["CPUExecutionProvider"])
s16 = ort.InferenceSession(str(final), providers=["CPUExecutionProvider"])
d_pt, d_prob, agree, cam_ok = 0.0, 0.0, 0, True
with torch.no_grad():
    for x in xs:
        xb = x[None]
        rl, rc = blend(xb)
        l32, c32 = s32.run(None, {"input": xb.numpy()})
        l16, c16 = s16.run(None, {"input": xb.numpy()})
        d_pt = max(d_pt, float(np.abs(l32 - rl.numpy()).max()))
        d_prob = max(d_prob, float(np.abs(np.exp(l16) - np.exp(l32)).max()))
        agree += int(l16.argmax() == l32.argmax())
        cam_ok &= c16.shape == (1, 6, 7, 7)
size_mb = final.stat().st_size / 1e6
res["export"] = {"onnx_mb": round(size_mb, 3), "fp32_graph_mb": round(fp32.stat().st_size / 1e6, 3),
                 "weights": "fp16 storage, fp32 compute", "photos": len(xs),
                 "fp32_graph_vs_pytorch_max_abs_logit": d_pt, "fp16_vs_fp32_max_prob_diff": d_prob,
                 "fp16_vs_fp32_top1_agreement": agree / len(xs), "cam_shape": [6, 7, 7] if cam_ok else None,
                 "gates": {"pytorch_parity_1e-4": d_pt <= 1e-4, "fp16_prob_2e-3": d_prob <= 2e-3,
                           "fp16_top1_100pct": agree == len(xs), "size_le_30mb": size_mb <= 30.0}}
fp32.unlink()

train_n, val_n, test_n = map(int, a.split_sizes.split(","))
arch = " + ".join(tt.PIPELINES[k]["name"] for k in names)
version = "v1-blend-" + "-".join(k.lower() for k in names) + "-scratch"
meta = {"version": version, "architecture": f"Per-class weighted blend of {arch} (all random init, pretrained=False)",
        "trainedFromScratch": True, "classes": tt.CLASSES, "inputSize": tt.INPUT_SIZE, "mean": list(tt.MEAN),
        "std": list(tt.STD), "temperature": round(T, 4), "thresholds": th, "camOutput": True}
v = res["internal_test"]["calibrated"]
report = {"modelVersion": version, "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
          "dataset": {"name": "AgroLeaf AI unified rice leaf dataset (build v2)",
                      "url": "https://www.kaggle.com/code/mdmasumakondha/agroleaf-unified-dataset-build",
                      "license": "CC BY 4.0 (RiceLeafDiseaseBD v3, RiceLeafBD, BD5) + CC0 1.0 (BanglaRiceLeaf)",
                      "images": {"train": train_n, "val": val_n, "test": test_n}},
          "test": {"n": v["n"], "accuracy": v["accuracy"], "macroF1": v["macro_f1"], "perClass": v["per_class"],
                   "confusionMatrix": v["confusion_matrix"], "classes": tt.CLASSES},
          "calibration": {"temperature": round(T, 4), "eceBefore": res["internal_test"]["uncalibrated"]["ece15"],
                          "eceAfter": v["ece15"]},
          "tiers": res["internal_test"]["tiers"],
          "limitations": [
              {"en": "Trained from scratch on 8,863 Bangladesh field photos. On BD5 (detached leaves on white paper, Savar) "
                     f"4-class macro-F1 is only {res['external_bd5']['calibrated']['macro_f1']:.2f}: photos unlike field photos are unreliable.",
               "bn": "৮,৮৬৩টি মাঠের ছবিতে শূন্য থেকে শেখানো। সাদা কাগজে রাখা ছেঁড়া পাতার ছবিতে (BD5) ফল ভালো নয়; মাঠে গাছের পাতার ছবি তুলুন।"},
              {"en": "Leaf Smut images come from one source only and are most often confused with Brown Spot.",
               "bn": "Leaf Smut-এর সব ছবি একটি উৎস থেকে; এটি প্রায়ই Brown Spot-এর সাথে গুলিয়ে যায়।"}]}
for name, obj in (("model_meta.json", meta), ("report.json", report), ("blend_results.json", res)):
    (out / name).write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
for key in ("val", "internal_test", "external_bd5"):
    c = res[key]["calibrated"]
    print(f"{key:14s} macroF1 {c['macro_f1']:.4f} smutR {c['leaf_smut_recall']:.3f} smutP {c['leaf_smut_precision']:.3f} "
          f"ECE {c['ece15']:.4f} NLL {c['nll']:.4f}")
print("weights", res["weights"], "\nT", round(T, 3), th, "\nexport", json.dumps(res["export"]))
