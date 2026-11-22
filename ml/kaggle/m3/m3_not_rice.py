"""M3: scratch-trained rice-vs-not-rice gate, folded into the shipped blend ONNX.

Rice: unified dataset build v2 (train/val/test as built, seed 42).
Not-rice: PlantDoc (other crops' leaves, CC BY 4.0 original) + COCO 2017 images whose per-image licence is
CC BY 2.0 (id 4), "No known copyright restrictions" (id 7) or "United States Government Work" (id 8).
Not-rice split 70/15/15 with seed 42. Gate: small CNN, random init (pretrained=False). Threshold on validation only.
Output graph: input `input`; `logits` = log of 7 probabilities [p6 * (1 - p_nr), p_nr] (temperature folded in, so
model_meta.temperature = 1.0); `cam` = 7 channels (empty not_rice channel).
"""
import csv, glob, json, os, random, subprocess, sys, time, urllib.request
from collections import Counter
from pathlib import Path

import numpy as np
import torch, torch.nn as nn, torch.nn.functional as F
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms as Tv

SEED = 42
random.seed(SEED); np.random.seed(SEED); torch.manual_seed(SEED)
OUT = Path("/kaggle/working/m3"); OUT.mkdir(parents=True, exist_ok=True)
DEV = "cuda" if torch.cuda.is_available() else "cpu"
RAW = "https://raw.githubusercontent.com/masumcit44/AgroLeaf_AI-/main"
CLASSES6 = ["healthy", "blast", "brown_spot", "leaf_smut", "tungro", "sheath_blight"]
CANON = {"Healthy": "healthy", "Blast": "blast", "Brown Spot": "brown_spot", "Leaf Smut": "leaf_smut",
         "Rice Tungro": "tungro", "Sheath Blight": "sheath_blight"}
t0 = time.time()

subprocess.run([sys.executable, "-m", "pip", "install", "-q", "onnx", "onnxruntime"], check=True)
import onnx, onnxruntime as ort
from onnx import helper, numpy_helper, TensorProto

# exact web preprocessing (ml/agroleaf_ml/preprocess.py)
subprocess.run(["git", "clone", "-q", "--depth", "1", "https://github.com/masumcit44/AgroLeaf_AI-.git", "/kaggle/working/repo"], check=True)
sys.path.insert(0, "/kaggle/working/repo/ml")
from agroleaf_ml.preprocess import preprocess as ref_preprocess
from agroleaf_ml.config import MEAN, STD

for f in ("agroleaf.onnx", "model_meta.json", "report.json"):
    urllib.request.urlretrieve(f"{RAW}/web/public/model/{f}", OUT / f"base_{f}")
base_meta = json.loads((OUT / "base_model_meta.json").read_text())
base_report = json.loads((OUT / "base_report.json").read_text())
T_BASE = float(base_meta["temperature"])
print("base", base_meta["version"], "T", T_BASE)

# ---------------- data ----------------
man = glob.glob("/kaggle/input/**/metadata/image_manifest.csv", recursive=True)[0]
ubase = Path(man).parent.parent
rice = {"train": [], "val": [], "test": []}
for r in csv.DictReader(open(man, encoding="utf-8")):
    if r["split"] in rice:
        rice[r["split"]].append((str(ubase / r["relative_path"]), CANON[r["canonical_class"]]))
print({k: len(v) for k, v in rice.items()})

# BD5 (detached rice leaves on white paper): used for the GATE ONLY, split 70/15/15 (seed 42).
# The disease blend never sees BD5, so its BD5 disease score stays an external test.
bd5_all = sorted(str(ubase / r["relative_path"]) for r in csv.DictReader(open(man, encoding="utf-8")) if r["split"] == "external_test")
random.Random(SEED).shuffle(bd5_all)
_a, _b = int(0.7 * len(bd5_all)), int(0.85 * len(bd5_all))
bd5 = {"train": bd5_all[:_a], "val": bd5_all[_a:_b], "test": bd5_all[_b:]}
print("bd5 gate split", {k: len(v) for k, v in bd5.items()})

neg = []
def find_dir(name, root="/kaggle/input", depth=4):
    for cur, dirs, _ in os.walk(root):
        if cur.count(os.sep) - root.count(os.sep) >= depth:
            dirs[:] = []
        if os.path.basename(cur) == name:
            return cur
    raise FileNotFoundError(name)

pd_dir = find_dir("plantdoc-dataset")
pd_files = sorted(f for f in glob.glob(pd_dir + "/**/*", recursive=True) if f.lower().endswith((".jpg", ".jpeg", ".png")))
for f in pd_files:
    neg.append({"path": f, "source": "plantdoc", "licence": "CC BY 4.0", "credit": "PlantDoc (Singh et al., 2020)"})
print("plantdoc images", len(pd_files))

COCO_OK = {4: "CC BY 2.0", 7: "No known copyright restrictions", 8: "United States Government Work"}
coco_dir = find_dir("coco2017", depth=5)
coco_imgs = []
for split in ("val2017", "train2017"):
    a = os.path.join(coco_dir, "annotations", f"captions_{split}.json")
    js = json.load(open(a))
    img_dir = Path(a).parent.parent / split
    for im in js["images"]:
        if im["license"] in COCO_OK:
            coco_imgs.append({"path": str(img_dir / im["file_name"]), "source": "coco2017", "licence": COCO_OK[im["license"]],
                              "credit": f"COCO 2017 / Flickr {im.get('flickr_url', '')}"})
random.Random(SEED).shuffle(coco_imgs)
neg += coco_imgs[:7000]
print("coco kept", min(7000, len(coco_imgs)), "of eligible", len(coco_imgs))

# fixed-seed 70/15/15 per source
nsplit = {"train": [], "val": [], "test": []}
for src in ("plantdoc", "coco2017"):
    items = [n for n in neg if n["source"] == src]
    random.Random(SEED).shuffle(items)
    a, b = int(0.7 * len(items)), int(0.85 * len(items))
    for n, s in [(x, "train") for x in items[:a]] + [(x, "val") for x in items[a:b]] + [(x, "test") for x in items[b:]]:
        n["split"] = s; nsplit[s].append(n)
print({k: len(v) for k, v in nsplit.items()})
with open(OUT / "not_rice_manifest.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, ["split", "source", "licence", "path", "credit"]); w.writeheader()
    for s in nsplit:
        for n in nsplit[s]:
            w.writerow({k: n[k] for k in ["split", "source", "licence", "path", "credit"]})

norm = Tv.Normalize(MEAN, STD)
train_tf = Tv.Compose([Tv.RandomResizedCrop(224, scale=(0.35, 1.0)), Tv.RandomHorizontalFlip(), Tv.RandomVerticalFlip(),
                       Tv.ColorJitter(0.3, 0.3, 0.3, 0.05), Tv.ToTensor(), norm])

from PIL import ImageFilter

def on_plain_background(im):
    """Cut the green/yellow leaf pixels out and paste them on a white, grey or beige background (rice positives only)."""
    hsv = np.asarray(im.convert("HSV")).astype(np.int16)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    m = ((h >= 15) & (h <= 90) & (s >= 45) & (v >= 40)).astype(np.uint8) * 255
    if m.mean() < 255 * 0.05:
        return im
    mask = Image.fromarray(m).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(2))
    rng = np.random.default_rng()
    base = rng.choice([[245, 245, 245], [230, 230, 228], [236, 228, 210], [210, 210, 210], [250, 250, 250]])
    bg = np.clip(np.asarray(base, np.float32)[None, None, :] + rng.normal(0, 6, (im.size[1], im.size[0], 3)), 0, 255).astype(np.uint8)
    return Image.composite(im, Image.fromarray(bg), mask)

import io
def recapture(im, seed):
    rng = np.random.default_rng(seed)
    im = im.convert("RGB")
    w, h = im.size
    # screen shows the photo with a dark bezel around it, phone frames it slightly off-axis
    pad = int(rng.uniform(0.03, 0.08) * max(w, h))
    canvas = Image.new("RGB", (w + 2 * pad, h + 2 * pad), tuple(int(v) for v in rng.integers(10, 35, 3)))
    canvas.paste(im, (pad, pad)); im = canvas; w, h = im.size
    d = rng.uniform(-0.05, 0.05, 8) * np.array([w, h] * 4)
    src = [(0, 0), (w, 0), (w, h), (0, h)]
    dst = [(x + d[2 * i], y + d[2 * i + 1]) for i, (x, y) in enumerate(src)]
    coeffs = _persp(dst, src)
    im = im.transform((w, h), Image.PERSPECTIVE, coeffs, Image.BILINEAR)
    a = np.asarray(im).astype(np.float32) / 255.0
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    # LCD sub-pixel grid + moire beat pattern
    f1, f2, ang = rng.uniform(0.28, 0.45), rng.uniform(0.01, 0.04), rng.uniform(0, np.pi)
    grid = 1 + 0.06 * np.sin(2 * np.pi * f1 * xx) * np.sin(2 * np.pi * f1 * yy)
    moire = 1 + 0.07 * np.sin(2 * np.pi * f2 * (xx * np.cos(ang) + yy * np.sin(ang)))
    a = a * (grid * moire)[..., None]
    # cool / blue white balance
    a = a * np.array([rng.uniform(0.84, 0.94), rng.uniform(0.96, 1.0), rng.uniform(1.04, 1.12)], np.float32)
    # glare blob + contrast washout + gamma
    cx, cy, r = rng.uniform(0.2, 0.8) * w, rng.uniform(0.2, 0.8) * h, rng.uniform(0.15, 0.35) * max(w, h)
    glare = np.exp(-(((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * r * r)))[..., None] * rng.uniform(0.15, 0.35)
    a = a + glare
    c = rng.uniform(0.72, 0.88); a = 0.5 + (a - 0.5) * c + rng.uniform(0.02, 0.08)
    a = np.clip(a, 0, 1) ** rng.uniform(0.85, 1.0)
    im = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(rng.uniform(0.3, 0.9)))
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=int(rng.integers(70, 90))); buf.seek(0)
    return Image.open(buf).convert("RGB")

def _persp(pa, pb):
    A = []
    for (x, y), (X, Y) in zip(pa, pb):
        A += [[x, y, 1, 0, 0, 0, -X * x, -X * y], [0, 0, 0, x, y, 1, -Y * x, -Y * y]]
    A = np.array(A, np.float64); B = np.array(pb, np.float64).reshape(8)
    return np.linalg.solve(A, B).tolist()


class DS(Dataset):
    def __init__(self, items, train):
        self.items, self.train = items, train
    def __len__(self): return len(self.items)
    def __getitem__(self, i):
        p, y = self.items[i]
        try:
            im = Image.open(p)
            im.draft("RGB", (512, 512))
            if self.train:
                im = im.convert("RGB")
                if y == 0 and random.random() < 0.35:
                    im = on_plain_background(im)
                if random.random() < 0.25:   # phone photo of a laptop/monitor screen (both classes)
                    im = recapture(im, random.randrange(1 << 30))
                return train_tf(im), torch.tensor(float(y))
            return torch.from_numpy(ref_preprocess(im)[0]), torch.tensor(float(y))
        except Exception:
            return torch.zeros(3, 224, 224), torch.tensor(-1.0)

def items_for(s):
    return [(p, 0) for p, _ in rice[s]] + [(p, 0) for p in bd5[s]] + [(n["path"], 1) for n in nsplit[s]]

# ---------------- gate model (random init) ----------------
def dw(cin, cout, s):
    return nn.Sequential(nn.Conv2d(cin, cin, 3, s, 1, groups=cin, bias=False), nn.BatchNorm2d(cin), nn.ReLU(inplace=True),
                         nn.Conv2d(cin, cout, 1, bias=False), nn.BatchNorm2d(cout), nn.ReLU(inplace=True))

class Gate(nn.Module):
    def __init__(self):
        super().__init__()
        self.f = nn.Sequential(nn.AvgPool2d(2),                                       # 224 -> 112
                               nn.Conv2d(3, 24, 3, 2, 1, bias=False), nn.BatchNorm2d(24), nn.ReLU(inplace=True),  # 56
                               dw(24, 48, 2), dw(48, 48, 1), dw(48, 96, 2), dw(96, 96, 1),  # 14
                               dw(96, 192, 2), dw(192, 192, 1), nn.AdaptiveAvgPool2d(1), nn.Flatten())
        self.head = nn.Linear(192, 1)
    def forward(self, x):
        return self.head(self.f(x))

gate = Gate().to(DEV)
n_params = sum(p.numel() for p in gate.parameters())
print("gate params", n_params)

tr = items_for("train")
pos_w = sum(1 for _, y in tr if y == 0) / max(1, sum(1 for _, y in tr if y == 1))
dl = DataLoader(DS(tr, True), batch_size=128, shuffle=True, num_workers=4, drop_last=True)
EPOCHS = 10
opt = torch.optim.AdamW(gate.parameters(), lr=3e-3, weight_decay=1e-4)
sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=3e-3, total_steps=EPOCHS * len(dl))
crit = nn.BCEWithLogitsLoss(reduction="none")

@torch.no_grad()
def scores(items):
    gate.eval(); out, ys = [], []
    for x, y in DataLoader(DS(items, False), batch_size=128, num_workers=4):
        out.append(torch.sigmoid(gate(x.to(DEV))).squeeze(1).cpu()); ys.append(y)
    return torch.cat(out).numpy(), torch.cat(ys).numpy()

best, best_state = -1, None
va_items = items_for("val")
for ep in range(EPOCHS):
    gate.train(); tot = 0
    for x, y in dl:
        x, y = x.to(DEV), y.to(DEV); m = (y >= 0).float()
        w = torch.where(y > 0.5, torch.full_like(y, pos_w), torch.ones_like(y))
        loss = (crit(gate(x).squeeze(1), y.clamp(min=0)) * w * m).sum() / m.sum().clamp(min=1)
        opt.zero_grad(); loss.backward(); opt.step(); sched.step(); tot += loss.item()
    s, y = scores(va_items); ok = y >= 0
    rs, ns = s[ok & (y == 0)], s[ok & (y == 1)]
    t99 = float(np.quantile(rs, 0.998))           # threshold keeping rice false-reject <= 0.2%
    rej = float((ns >= t99).mean())
    print(f"ep {ep} loss {tot/len(dl):.4f} val rej@FRR0.2% {rej:.4f} ({time.time()-t0:.0f}s)")
    if rej > best:
        best, best_state = rej, {k: v.detach().clone() for k, v in gate.state_dict().items()}
gate.load_state_dict(best_state); gate.eval()

# ---------------- threshold on validation only ----------------
# Rule folded into the graph: reject as not_rice only if p_nr >= thr AND the disease blend is not confident
# (max calibrated disease prob < c). (thr, c) chosen on validation: max not-rice rejection with rice false-reject <= 0.1%.
s, y = scores(va_items); ok = y >= 0
sess_base = ort.InferenceSession(str(OUT / "base_agroleaf.onnx"), providers=["CPUExecutionProvider"])
def blend_maxp(p):
    try:
        lo = sess_base.run(None, {"input": ref_preprocess(Image.open(p))})[0][0] / T_BASE
        e = np.exp(lo - lo.max()); return float((e / e.sum()).max())
    except Exception:
        return 1.0
mp = np.array([blend_maxp(p) for p, _ in va_items])
rmask, nmask = ok & (y == 0), ok & (y == 1)
best_t = None
for c in [0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 0.98, 1.01]:
    for t in np.quantile(s[rmask], [0.99, 0.995, 0.998, 0.999, 0.9995, 1.0]).tolist() + [0.5, 0.6, 0.7, 0.8, 0.9]:
        rej_r = (s >= t) & (mp < c)
        frr = float(rej_r[rmask].mean()); rej = float(rej_r[nmask].mean())
        if frr <= 0.001 and (best_t is None or rej > best_t[3]):
            best_t = (float(t), float(c), frr, rej)
thr, conf_cap = best_t[0], best_t[1]
print("chosen (threshold, blend-confidence cap, val rice FRR, val not-rice rejection)", best_t)

# ---------------- export gate + fold into the base graph ----------------
gate_cpu = gate.cpu()
torch.onnx.export(gate_cpu, (torch.zeros(1, 3, 224, 224),), str(OUT / "gate.onnx"), input_names=["input"], output_names=["gate_logit"],
                  opset_version=17, dynamo=False, dynamic_axes={"input": {0: "batch"}, "gate_logit": {0: "batch"}})
base = onnx.load(str(OUT / "base_agroleaf.onnx"))
g_gate = onnx.load(str(OUT / "gate.onnx")).graph
bg = base.graph
assert [o.name for o in bg.output] == ["logits", "cam"], [o.name for o in bg.output]
ren = {}
for n in g_gate.node:
    for i, nm in enumerate(n.input):
        if nm != "input": n.input[i] = "gate/" + nm
    for i, nm in enumerate(n.output): n.output[i] = "gate/" + nm
    n.name = "gate/" + n.name
for init in g_gate.initializer: init.name = "gate/" + init.name
# rename base outputs to internal names
for n in bg.node:
    for i, nm in enumerate(n.output):
        if nm == "logits": n.output[i] = "blend_logp"
        if nm == "cam": n.output[i] = "blend_cam"
bg.node.extend(g_gate.node); bg.initializer.extend(g_gate.initializer)
C = lambda name, arr: bg.initializer.append(numpy_helper.from_array(np.asarray(arr, dtype=np.float32), name))
C("m3/T", [T_BASE]); C("m3/one", [1.0]); C("m3/eps", [1e-7]); C("m3/zero", [0.0]); C("m3/cap", [conf_cap])
bg.initializer.append(numpy_helper.from_array(np.array([0], np.int64), "m3/s0"))
bg.initializer.append(numpy_helper.from_array(np.array([1], np.int64), "m3/s1"))
bg.initializer.append(numpy_helper.from_array(np.array([1], np.int64), "m3/ax1"))
mk = helper.make_node
bg.node.extend([
    mk("Div", ["blend_logp", "m3/T"], ["m3/z"]),
    mk("Softmax", ["m3/z"], ["m3/p6"], axis=1),
    mk("Sigmoid", ["gate/gate_logit"], ["m3/pnr_raw"]),
    mk("ReduceMax", ["m3/p6"], ["m3/maxp6"], axes=[1], keepdims=1),
    mk("Less", ["m3/maxp6", "m3/cap"], ["m3/unsure"]),
    mk("Cast", ["m3/unsure"], ["m3/unsure_f"], to=TensorProto.FLOAT),
    mk("Mul", ["m3/pnr_raw", "m3/unsure_f"], ["m3/pnr"]),
    mk("Sub", ["m3/one", "m3/pnr"], ["m3/keep"]),
    mk("Mul", ["m3/p6", "m3/keep"], ["m3/p6s"]),
    mk("Concat", ["m3/p6s", "m3/pnr"], ["m3/p7"], axis=1),
    mk("Add", ["m3/p7", "m3/eps"], ["m3/p7e"]),
    mk("Log", ["m3/p7e"], ["logits"]),
    mk("Slice", ["blend_cam", "m3/s0", "m3/s1", "m3/ax1"], ["m3/cam0"]),
    mk("Mul", ["m3/cam0", "m3/zero"], ["m3/camz"]),
    mk("Concat", ["blend_cam", "m3/camz"], ["cam"], axis=1),
])
del bg.output[:]
bg.output.extend([helper.make_tensor_value_info("logits", TensorProto.FLOAT, ["batch", 7]),
                  helper.make_tensor_value_info("cam", TensorProto.FLOAT, ["batch", 7, 7, 7])])
del bg.value_info[:]
onnx.checker.check_model(base)
final = OUT / "agroleaf.onnx"
onnx.save(base, str(final))
size_mb = final.stat().st_size / 1048576
print("final size MB", round(size_mb, 2))

# ---------------- evaluation with the FINAL graph (exact web preprocessing) ----------------
sess_new = ort.InferenceSession(str(final), providers=["CPUExecutionProvider"])
sess_old = ort.InferenceSession(str(OUT / "base_agroleaf.onnx"), providers=["CPUExecutionProvider"])
def run_all(items, max_n=None):
    P7, P6old, labels = [], [], []
    for p, lab in items[:max_n] if max_n else items:
        x = ref_preprocess(Image.open(p))
        l7, c7 = sess_new.run(None, {"input": x})
        lo, _ = sess_old.run(None, {"input": x})
        assert c7.shape[1] == 7
        P7.append(np.exp(l7[0]) / np.exp(l7[0]).sum())
        z = lo[0] / T_BASE; e = np.exp(z - z.max()); P6old.append(e / e.sum())
        labels.append(lab)
    return np.array(P7), np.array(P6old), labels

def macro_f1(y_true, y_pred, labels):
    f1s, per = [], []
    for c in labels:
        tp = sum(1 for a, b in zip(y_true, y_pred) if a == c and b == c)
        fp = sum(1 for a, b in zip(y_true, y_pred) if a != c and b == c)
        fn = sum(1 for a, b in zip(y_true, y_pred) if a == c and b != c)
        pr = tp / (tp + fp) if tp + fp else 0.0; rc = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * pr * rc / (pr + rc) if pr + rc else 0.0
        f1s.append(f1); per.append({"classId": c, "precision": pr, "recall": rc, "f1": f1, "support": tp + fn})
    return float(np.mean(f1s)), per

CL7 = CLASSES6 + ["not_rice"]
def pred7(p):
    return "not_rice" if p[6] >= thr else CL7[int(np.argmax(p[:6]))]

res = {}
P7, P6o, lab = run_all(rice["test"])
y_old = [CLASSES6[int(np.argmax(p))] for p in P6o]
y_new = [pred7(p) for p in P7]
res["rice_test_n"] = len(lab)
res["macroF1_6class_base"] = macro_f1(lab, y_old, CLASSES6)[0]
res["macroF1_6class_with_gate"] = macro_f1(lab, y_new, CLASSES6)[0]
res["rice_test_false_reject"] = float(np.mean([p[6] >= thr for p in P7]))
res["accuracy_6class_with_gate"] = float(np.mean([a == b for a, b in zip(lab, y_new)]))
# composition check: rescaled 6 probs equal base probs * (1 - p_nr)
res["max_abs_diff_composition"] = float(np.max(np.abs(P7[:, :6] / (1 - P7[:, 6:7] + 1e-12) - P6o)))

Pv, _, labv = run_all(rice["val"])
res["rice_val_false_reject"] = float(np.mean([p[6] >= thr for p in Pv]))
neg_val = [(n["path"], "not_rice") for n in nsplit["val"]]
neg_test = [(n["path"], "not_rice") for n in nsplit["test"]]
def rej(items):
    r = []
    for p, _ in items:
        try:
            l7, _ = sess_new.run(None, {"input": ref_preprocess(Image.open(p))})
            pr = np.exp(l7[0]) / np.exp(l7[0]).sum(); r.append(pr[6] >= thr)
        except Exception:
            pass
    return float(np.mean(r)), len(r)
res["not_rice_val_rejected"], res["not_rice_val_n"] = rej(neg_val)
res["not_rice_test_rejected"], res["not_rice_test_n"] = rej(neg_test)
for src in ("plantdoc", "coco2017"):
    res[f"not_rice_test_rejected_{src}"] = rej([(n["path"], 0) for n in nsplit["test"] if n["source"] == src])[0]

# BD5 external rice (informational): false rejects on out-of-domain rice photos
res["bd5_gate_test_false_reject"], res["bd5_gate_test_n"] = rej([(p, 0) for p in bd5["test"]])
res["bd5_gate_val_false_reject"] = rej([(p, 0) for p in bd5["val"]])[0]

# screen-recapture stress: rice test photos and not-rice test photos shown on a screen and re-photographed
def eval_screen(items, n=700):
    out = []
    for i, (p, lab) in enumerate(items[:n]):
        try:
            x = ref_preprocess(recapture(Image.open(p), 10_000 + i))
            l7, _ = sess_new.run(None, {"input": x}); pr = np.exp(l7[0]) / np.exp(l7[0]).sum()
            out.append((lab, pred7(pr)))
        except Exception:
            pass
    return out
sr = eval_screen(rice["test"], n=len(rice["test"]))
res["screen_rice_test_false_reject"] = float(np.mean([pr == "not_rice" for _, pr in sr]))
res["screen_macroF1_6class_with_gate"] = macro_f1([a for a, _ in sr], [b for _, b in sr], CLASSES6)[0]
sn = eval_screen([(n["path"], "not_rice") for n in nsplit["test"]])
res["screen_not_rice_test_rejected"] = float(np.mean([pr == "not_rice" for _, pr in sn]))

# 7-class test (rice test + not-rice test) for report.json
labs7 = lab + ["not_rice"] * len(neg_test)
preds7 = y_new[:]
for p, _ in neg_test:
    try:
        l7, _ = sess_new.run(None, {"input": ref_preprocess(Image.open(p))}); pr = np.exp(l7[0]) / np.exp(l7[0]).sum()
        preds7.append(pred7(pr))
    except Exception:
        preds7.append("not_rice")
mf7, per7 = macro_f1(labs7, preds7, CL7)
cm = [[sum(1 for a, b in zip(labs7, preds7) if a == ti and b == pj) for pj in CL7] for ti in CL7]

res.update({"threshold_notRice": thr, "blend_conf_cap": conf_cap, "val_choice": best_t, "gate_params": n_params, "onnx_mb": size_mb,
            "macroF1_7class_test": mf7, "elapsed_s": time.time() - t0})
print(json.dumps(res, indent=2))

meta = dict(base_meta)
meta.update({"version": base_meta["version"].replace("v1-", "v2-") + "-gate", "classes": CL7, "temperature": 1.0,
             "architecture": base_meta["architecture"] + " + scratch rice/not-rice gate CNN (pretrained=False, "
                             f"{n_params/1e3:.0f}k params) folded into the same graph"})
meta["thresholds"] = dict(base_meta["thresholds"], notRice=round(thr, 4))
report = dict(base_report)
report["modelVersion"] = meta["version"]
report["createdAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
report["test"] = {"n": len(labs7), "accuracy": float(np.mean([a == b for a, b in zip(labs7, preds7)])), "macroF1": mf7,
                  "perClass": per7, "confusionMatrix": cm, "classes": CL7}
report["notRice"] = {"threshold": thr, "blendConfidenceCap": conf_cap, "rule": "not_rice only if gate p >= threshold AND max disease prob < blendConfidenceCap", "screenRecapture": {"riceFalseReject": res["screen_rice_test_false_reject"], "notRiceRejected": res["screen_not_rice_test_rejected"], "macroF1SixClassWithGate": res["screen_macroF1_6class_with_gate"]}, "riceValFalseReject": res["rice_val_false_reject"],
                     "riceTestFalseReject": res["rice_test_false_reject"], "notRiceValRejected": res["not_rice_val_rejected"],
                     "notRiceTestRejected": res["not_rice_test_rejected"],
                     "macroF1SixClassBase": res["macroF1_6class_base"], "macroF1SixClassWithGate": res["macroF1_6class_with_gate"],
                     "sources": [{"name": "PlantDoc", "licence": "CC BY 4.0", "url": "https://github.com/pratikkayal/PlantDoc-Dataset"},
                                 {"name": "COCO 2017 (only images licensed CC BY 2.0, no known copyright, or US Gov work)",
                                  "licence": "per image", "url": "https://cocodataset.org"}],
                     "split": {k: len(v) for k, v in nsplit.items()},
                     "bd5GateOnly": {"note": "BD5 (rice leaves on white paper) was split 70/15/15 and used to train/threshold the gate only; the disease blend never saw it.", "split": {k: len(v) for k, v in bd5.items()}, "testFalseReject": res["bd5_gate_test_false_reject"]}}
report["limitations"] = list(base_report.get("limitations", [])) + [{
    "bn": "\"ধানপাতা নয়\" যাচাই অন্য ফসলের পাতা ও সাধারণ ছবিতে শেখানো; ধানের মতো ঘাস বা খুব ঝাপসা ছবিতে ভুল হতে পারে।",
    "en": "The not-rice check was trained on other crops' leaves and everyday photos; rice-like grasses or very blurry photos can fool it."}]
json.dump(meta, open(OUT / "model_meta.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
json.dump(report, open(OUT / "report.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
json.dump(res, open(OUT / "m3_results.json", "w"), indent=2)

# parity fixture for the browser: a few test images, their preprocessed input checksum and expected 7 probs
fx = []
for p, labx in rice["test"][:3] + [(n["path"], "not_rice") for n in nsplit["test"][:2]]:
    im = Image.open(p).convert("RGB"); im.thumbnail((480, 480)); name = f"parity_{len(fx)}.jpg"
    im.save(OUT / name, "JPEG", quality=92)
    x = ref_preprocess(Image.open(OUT / name))
    l7, _ = sess_new.run(None, {"input": x}); pr = np.exp(l7[0]) / np.exp(l7[0]).sum()
    fx.append({"file": name, "label": labx, "probs": [float(v) for v in pr]})
json.dump(fx, open(OUT / "parity.json", "w"), indent=2)
os.remove(OUT / "base_agroleaf.onnx")
print("DONE", time.time() - t0)
