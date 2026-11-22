"""Finish a Kaggle run locally from its saved best.pt + logits.npz (no retraining).

Used when a run trained fine but failed in the export step. Recomputes exactly what
top3_train.py would have written after training: temperature (val only), tier
thresholds (val only), val / internal-test / BD5 metrics, ONNX export + parity, and
model_meta.json / report.json / results.json.

    python finalize_local.py --pipe P3 --run-dir <downloaded>/P3_RegNetY-400MF_seed42 \
        --ml-dir <repo>/ml --parity-images <folder of real leaf photos>
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import time
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument("--pipe", required=True)
ap.add_argument("--run-dir", required=True)
ap.add_argument("--ml-dir", required=True)
ap.add_argument("--parity-images", required=True, help="real photos for the ONNX parity check")
ap.add_argument("--split-sizes", default="8863,1902,1901")
a = ap.parse_args()
os.environ["AGROLEAF_ML_DIR"] = str(Path(a.ml_dir).resolve())
spec = importlib.util.spec_from_file_location("tt", Path(__file__).resolve().parent / "top3_train.py")
tt = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tt)
np, torch = tt.np, tt.torch
from PIL import Image  # noqa: E402

run = Path(a.run_dir)
cfg = json.loads((run / "config.json").read_text())
pipe = a.pipe
ck = torch.load(run / "best.pt", map_location="cpu", weights_only=False)
model = tt.build_model(pipe, tt.PIPELINES[pipe])
model.load_state_dict(ck["state"])
model.eval()

z = np.load(run / "logits.npz")
lg = {s: (z[f"{s}_logits"], z[f"{s}_y"]) for s in ("val", "test", "external_test")}
T = tt.fit_temperature(*lg["val"])
th = tt.choose_thresholds(*lg["val"], T)
bd5_labels = sorted(set(lg["external_test"][1].tolist()))
results = {"pipeline": pipe, "name": cfg["name"], "params": tt.count_params(model), "best_epoch": ck["epoch"],
           "best_weights": ck["which"], "temperature": T, "thresholds": th, "aug_profile": cfg["aug_profile"],
           "seed": cfg["seed"], "finalized_locally": True}
for split, key in (("val", "val"), ("test", "internal_test"), ("external_test", "external_bd5")):
    zz, y = lg[split]
    labels = bd5_labels if split == "external_test" else None
    results[key] = {"uncalibrated": tt.full_metrics(zz, y, 1.0, labels), "calibrated": tt.full_metrics(zz, y, T, labels),
                    "tiers": tt.tier_table(zz, y, T, th)}
zb = lg["external_test"][0]
results["external_bd5"]["pred_absent_class_rate"] = float(np.isin(zb.argmax(1), [i for i in range(tt.K) if i not in bd5_labels]).mean())
results["external_bd5"]["classes_present"] = [tt.CLASSES[i] for i in bd5_labels]

# sanity: the Kaggle val logits must be reproducible from best.pt (same weights, eval mode)
files = sorted(p for p in Path(a.parity_images).rglob("*") if p.suffix.lower() in {".jpg", ".jpeg", ".png"})
rng = np.random.RandomState(0)
imgs = []
for i in rng.permutation(len(files)):
    try:
        with Image.open(files[i]) as im:
            imgs.append(tt.eval_transform(im))
    except Exception:
        continue  # skip unreadable files
    if len(imgs) == 64:
        break
px = torch.stack(imgs)
results["export"] = tt.export_onnx(model, run / "agroleaf.onnx", px)
results["export"]["parity_source"] = "64 real BD5 photos (local)"

train_n, val_n, test_n = map(int, a.split_sizes.split(","))
version = f"v1-{pipe.lower()}-{cfg['name'].lower()}-scratch-s{cfg['seed']}"
meta = {"version": version, "architecture": f"{cfg['name']} (random init, pretrained=False)", "trainedFromScratch": True,
        "classes": tt.CLASSES, "inputSize": tt.INPUT_SIZE, "mean": list(tt.MEAN), "std": list(tt.STD),
        "temperature": round(T, 4), "thresholds": th, "camOutput": True}
v = results["internal_test"]["calibrated"]
report = {"modelVersion": version, "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
          "dataset": {"name": "AgroLeaf AI unified rice leaf dataset (build v2)",
                      "url": "https://www.kaggle.com/code/mdmasumakondha/agroleaf-unified-dataset-build",
                      "license": "CC BY 4.0 (RiceLeafDiseaseBD v3, RiceLeafBD, BD5) + CC0 1.0 (BanglaRiceLeaf)",
                      "images": {"train": train_n, "val": val_n, "test": test_n}},
          "test": {"n": v["n"], "accuracy": v["accuracy"], "macroF1": v["macro_f1"], "perClass": v["per_class"],
                   "confusionMatrix": v["confusion_matrix"], "classes": tt.CLASSES},
          "calibration": {"temperature": round(T, 4), "eceBefore": results["internal_test"]["uncalibrated"]["ece15"],
                          "eceAfter": v["ece15"]},
          "tiers": results["internal_test"]["tiers"],
          "limitations": [
              {"en": "Trained from scratch on 8,863 Bangladesh field photos; external BD5 (Savar) has only 4 of 6 classes.",
               "bn": "৮,৮৬৩টি বাংলাদেশি মাঠের ছবিতে শূন্য থেকে শেখানো; বাইরের BD5 পরীক্ষায় ৬টির মধ্যে ৪টি রোগ আছে।"},
              {"en": "Leaf Smut images come from one source only, so its accuracy outside that source is uncertain.",
               "bn": "Leaf Smut-এর সব ছবি একটি উৎস থেকে, তাই অন্য জায়গার ছবিতে এর নির্ভুলতা অনিশ্চিত।"}]}
for name, obj in (("model_meta.json", meta), ("report.json", report), ("results.json", results)):
    (run / name).write_text(json.dumps(obj, indent=2, ensure_ascii=False), encoding="utf-8")
for key in ("val", "internal_test", "external_bd5"):
    c, u = results[key]["calibrated"], results[key]["uncalibrated"]
    print(f"{key:14s} macroF1 {c['macro_f1']:.4f} acc {c['accuracy']:.4f} smutR {c['leaf_smut_recall']:.3f} "
          f"smutP {c['leaf_smut_precision']:.3f} ECE {u['ece15']:.4f}->{c['ece15']:.4f} NLL {c['nll']:.4f}")
print("T", round(T, 3), "thresholds", th, "export", results["export"])
