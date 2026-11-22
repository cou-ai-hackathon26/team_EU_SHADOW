"""Local CPU smoke test for top3_train.py (no GPU, no real dataset needed).

Builds a tiny synthetic dataset with the same layout as the Kaggle build
(<root>/metadata/image_manifest.csv + images), then runs every pipeline for
2 epochs x 3 batches with AGROLEAF_SMOKE=1. It checks that training, EMA,
checkpointing, temperature scaling, thresholds, ONNX export (logits + cam),
parity and the JSON outputs all work. The numbers it prints mean nothing.

    python smoke_test.py --ml-dir <repo checkout on feat/M2-augmentation>/ml
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

CLASS_DIRS = ["Healthy", "Blast", "Brown Spot", "Leaf Smut", "Rice Tungro", "Sheath Blight"]
BD5 = ["Healthy", "Blast", "Rice Tungro", "Sheath Blight"]


def make_data(root: Path) -> None:
    rng = np.random.RandomState(0)
    rows = []
    plan = [("train", CLASS_DIRS, 10, (512, 384)), ("val", CLASS_DIRS, 6, (512, 384)),
            ("test", CLASS_DIRS, 4, (384, 512)), ("external_test", BD5, 4, (300, 300))]
    for split, classes, n, size in plan:
        for ci, c in enumerate(classes):
            d = root / "images" / split / c
            d.mkdir(parents=True, exist_ok=True)
            for i in range(n):
                base = np.array([40 + 30 * CLASS_DIRS.index(c), 140, 60], dtype=np.float32)
                img = np.clip(base + rng.randn(size[1], size[0], 3) * 25, 0, 255).astype(np.uint8)
                p = d / f"{split}_{ci}_{i}.jpg"
                Image.fromarray(img).save(p, quality=90)
                rows.append({"relative_path": str(p.relative_to(root)).replace("\\", "/"),
                             "canonical_class": c, "split": split})
    (root / "metadata").mkdir(exist_ok=True)
    with open(root / "metadata" / "image_manifest.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["relative_path", "canonical_class", "split"])
        w.writeheader()
        w.writerows(rows)


def model_checks(ml_dir: str, pipes: list[str]) -> list[str]:
    """M2 spec gates per model: random init, output [B, 6], params < budget, initial loss ~ ln 6,
    and the model can overfit one fixed batch (proves gradients flow from scratch)."""
    import importlib.util
    import math
    import torch
    import torch.nn.functional as F
    os.environ["AGROLEAF_ML_DIR"] = str(Path(ml_dir).resolve())
    spec = importlib.util.spec_from_file_location("top3_train", Path(__file__).resolve().parent / "top3_train.py")
    tt = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(tt)
    bad = []
    for pipe in pipes:
        torch.manual_seed(0)
        m = tt.build_model(pipe, tt.PIPELINES[pipe])
        x, y = torch.randn(16, 3, 224, 224), torch.arange(16) % 6
        m.train()
        loss0 = float(F.cross_entropy(m(x), y))
        opt = torch.optim.AdamW(m.parameters(), lr=2e-3, weight_decay=0)
        m.drop.p = 0.0
        for _ in range(40):
            opt.zero_grad()
            loss = F.cross_entropy(m(x), y)
            loss.backward()
            opt.step()
        logits, cam = m.eval().forward_with_cam(x[:2])
        ok = (tuple(logits.shape) == (2, 6) and tuple(cam.shape) == (2, 6, 7, 7)
              and tt.count_params(m) <= tt.MAX_PARAMS and abs(loss0 - math.log(6)) < 0.15 and float(loss) < 0.3)
        print(f"{pipe}: params {tt.count_params(m):,} | initial loss {loss0:.3f} (ln6=1.792) | "
              f"one-batch overfit loss {float(loss):.3f} | {'OK' if ok else 'FAIL'}", flush=True)
        if not ok:
            bad.append(pipe)
    return bad


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ml-dir", required=True, help="path to the repo's ml/ folder (branch with augment.py)")
    ap.add_argument("--pipelines", default="P1,P2,P3")
    a = ap.parse_args()
    here = Path(__file__).resolve().parent
    failed = model_checks(a.ml_dir, a.pipelines.split(","))
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        make_data(tmp / "unified")
        for pipe in a.pipelines.split(","):
            env = dict(os.environ, AGROLEAF_PIPELINE=pipe, AGROLEAF_SMOKE="1", AGROLEAF_DATA=str(tmp / "unified"),
                       AGROLEAF_ML_DIR=str(Path(a.ml_dir).resolve()), AGROLEAF_OUT=str(tmp / "out"))
            print(f"\n######## {pipe}", flush=True)
            r = subprocess.run([sys.executable, str(here / "top3_train.py")], env=env)
            outs = list((tmp / "out").glob(f"{pipe}_*"))
            ok = r.returncode == 0 and outs and (outs[0] / "agroleaf.onnx").exists()
            if ok:
                res = json.loads((outs[0] / "results.json").read_text(encoding="utf-8"))
                ex = res["export"]
                ok = ex["parity_pass"] and ex["size_pass"] and ex["cam_shape"] == [6, 7, 7] \
                    and ex["cam_gap_plus_bias_minus_logits"] < 1e-4
                print(f"{pipe}: params {res['params']:,} | onnx {ex['onnx_mb']} MB | parity {ex['parity_pass']} "
                      f"(max |dlogit| {ex['max_abs_diff_logits']:.2e}) | cam {ex['cam_shape']} exact "
                      f"{ex['cam_gap_plus_bias_minus_logits']:.1e} | files "
                      f"{sorted(p.name for p in outs[0].iterdir())}")
            if not ok:
                failed.append(pipe)
    print("\nSMOKE", "FAILED: " + ",".join(failed) if failed else "PASSED for all pipelines")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
