"""Kaggle GPU ablation of the three augmentation profiles (M2).

Same scratch model, optimiser, schedule, loss and seed for every arm; only the
augmentation profile changes. Checkpoints are chosen on validation macro-F1.
Internal test and external BD5 are read once per arm, after selection, and are
never used to choose anything.

Kaggle: GPU T4, internet on, input = kernel output "agroleaf-unified-dataset-build".
The script clones this repo branch to import agroleaf_ml, so code on Kaggle is the
code under review.
"""
from __future__ import annotations

import csv
import json
import math
import os
import random
import subprocess
import sys
import time
from pathlib import Path

REPO = "https://github.com/masumcit44/AgroLeaf_AI-.git"
BRANCH = os.environ.get("AGROLEAF_BRANCH", "feat/M2-augmentation")
EPOCHS = int(os.environ.get("AUG_EPOCHS", "40"))
ARMS = os.environ.get("AUG_ARMS", "A0_baseline,A1_field_realistic,A2_field_mixup").split(",")
MODEL = "mobilenetv3_small_075"
BATCH, LR, WD, WARMUP, SEED, LS = 64, 2e-3, 2e-4, 5, 42, 0.03
OUT = Path("/kaggle/working") if Path("/kaggle").exists() else Path("./kaggle_out")

ML_DIR = Path(os.environ.get("AGROLEAF_ML_DIR", "repo/ml"))  # local smoke runs point this at ./ml
if not ML_DIR.exists():
    subprocess.run(["git", "clone", "--depth", "1", "-b", BRANCH, REPO, "repo"], check=True)
sys.path.insert(0, str(ML_DIR.resolve()))

import numpy as np  # noqa: E402
import timm  # noqa: E402
import torch  # noqa: E402
import torch.nn.functional as F  # noqa: E402
from PIL import Image  # noqa: E402
from sklearn.metrics import f1_score, precision_recall_fscore_support  # noqa: E402
from torch.utils.data import DataLoader, Dataset  # noqa: E402

from agroleaf_ml.augment import get_profile, get_transform  # noqa: E402
from agroleaf_ml.mixup import MixUpConfig, class_weights_sqrt, mixup_active, mixup_batch, soft_target_ce  # noqa: E402

sys.path.insert(0, str((ML_DIR / "tools").resolve()))
import aug_grid  # noqa: E402

CLASS_DIRS = aug_grid.CLASS_DIRS
K = len(CLASS_DIRS)
DEV = "cuda" if torch.cuda.is_available() else "cpu"


def find_dataset() -> Path:
    if os.environ.get("AGROLEAF_DATA"):
        return Path(os.environ["AGROLEAF_DATA"])
    hits = sorted(Path("/kaggle/input").rglob("image_manifest.csv")) if Path("/kaggle/input").exists() else []
    if not hits:
        raise SystemExit("image_manifest.csv not found under /kaggle/input")
    return hits[0].parent.parent  # <unified>/metadata/image_manifest.csv


class LeafSet(Dataset):
    def __init__(self, root: Path, rows, tf):
        self.items = [(root / r["relative_path"], CLASS_DIRS.index(r["canonical_class"])) for r in rows]
        self.tf = tf

    def __len__(self):
        return len(self.items)

    def __getitem__(self, i):
        path, y = self.items[i]
        with Image.open(path) as im:
            return self.tf(im), y


def seed_all(s: int):
    random.seed(s)
    np.random.seed(s)
    torch.manual_seed(s)
    torch.cuda.manual_seed_all(s)


def lr_at(epoch_f: float) -> float:
    if epoch_f < WARMUP:
        return LR * epoch_f / WARMUP
    t = (epoch_f - WARMUP) / max(1, EPOCHS - WARMUP)
    return 1e-6 + 0.5 * (LR - 1e-6) * (1 + math.cos(math.pi * t))


@torch.no_grad()
def predict(model, loader):
    model.eval()
    logits, ys = [], []
    for x, y in loader:
        with torch.autocast(DEV, enabled=DEV == "cuda"):
            logits.append(model(x.to(DEV, non_blocking=True)).float().cpu())
        ys.append(y)
    return torch.cat(logits), torch.cat(ys)


def ece(probs: torch.Tensor, y: torch.Tensor, bins: int = 15) -> float:
    conf, pred = probs.max(1)
    acc = (pred == y).float()
    e = torch.zeros(1)
    edges = torch.linspace(0, 1, bins + 1)
    for lo, hi in zip(edges[:-1], edges[1:]):
        m = (conf > lo) & (conf <= hi)
        if m.any():
            e += m.float().mean() * (conf[m].mean() - acc[m].mean()).abs()
    return float(e)


def metrics(logits, y, labels=None) -> dict:
    p = logits.softmax(1)
    pred = p.argmax(1).numpy()
    yn = y.numpy()
    labels = list(range(K)) if labels is None else labels
    pr, rc, f1, sup = precision_recall_fscore_support(yn, pred, labels=list(range(K)), zero_division=0)
    return {
        "acc": float((pred == yn).mean()),
        "macro_f1": float(f1_score(yn, pred, labels=labels, average="macro", zero_division=0)),
        "leaf_smut_recall": float(rc[3]),
        "leaf_smut_precision": float(pr[3]),
        "per_class_f1": {CLASS_DIRS[i]: float(f1[i]) for i in range(K)},
        "ece15": ece(p, y),
        "nll": float(F.cross_entropy(logits, y)),
        "n": int(len(yn)),
    }


def run_arm(arm: str, root: Path, rows: dict, counts: list[int]) -> dict:
    seed_all(SEED)
    prof = get_profile(arm)
    g = torch.Generator().manual_seed(SEED)
    nw = int(os.environ.get("AUG_WORKERS", "4"))
    kw = dict(num_workers=nw, pin_memory=DEV == "cuda", persistent_workers=nw > 0)
    train = DataLoader(LeafSet(root, rows["train"], get_transform("train", arm)), BATCH, shuffle=True,
                       drop_last=True, generator=g, **kw)
    evals = {s: DataLoader(LeafSet(root, rows[s], get_transform(s, arm)), 128, **kw)
             for s in ("val", "test", "external_test")}
    model = timm.create_model(MODEL, pretrained=False, num_classes=K, drop_rate=0.2).to(DEV)
    n_params = sum(p.numel() for p in model.parameters())
    opt = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=WD)
    scaler = torch.amp.GradScaler(enabled=DEV == "cuda")
    w = class_weights_sqrt(counts).to(DEV)
    mcfg = MixUpConfig()
    best, hist, best_path = -1.0, [], OUT / f"best_{arm}.pt"
    steps = len(train)
    for ep in range(EPOCHS):
        model.train()
        t0, tot = time.time(), 0.0
        use_mix = prof.mixup and mixup_active(ep, EPOCHS, mcfg)
        for i, (x, y) in enumerate(train):
            for gp in opt.param_groups:
                gp["lr"] = lr_at(ep + i / steps)
            x, y = x.to(DEV, non_blocking=True), y.to(DEV, non_blocking=True)
            if use_mix:
                x, t = mixup_batch(x, y, K, mcfg)
            else:
                t = F.one_hot(y, K).float()
            with torch.autocast(DEV, enabled=DEV == "cuda"):
                loss = soft_target_ce(model(x).float(), t, w, LS)
            opt.zero_grad(set_to_none=True)
            scaler.scale(loss).backward()
            scaler.unscale_(opt)
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            scaler.step(opt)
            scaler.update()
            tot += loss.item()
        vm = metrics(*predict(model, evals["val"]))
        hist.append({"epoch": ep, "loss": tot / steps, "mixup": use_mix, "val_macro_f1": vm["macro_f1"],
                     "val_leaf_smut_recall": vm["leaf_smut_recall"], "sec": round(time.time() - t0, 1)})
        print(f"[{arm}] ep {ep:3d} loss {tot / steps:.4f} val F1 {vm['macro_f1']:.4f} "
              f"smut R {vm['leaf_smut_recall']:.3f} mix {use_mix} {time.time() - t0:.0f}s", flush=True)
        if vm["macro_f1"] > best:
            best = vm["macro_f1"]
            torch.save(model.state_dict(), best_path)
    model.load_state_dict(torch.load(best_path, map_location=DEV))
    res = {"arm": arm, "model": MODEL, "params": n_params, "epochs": EPOCHS, "seed": SEED,
           "best_epoch": max(hist, key=lambda h: h["val_macro_f1"])["epoch"], "history": hist}
    res["val"] = metrics(*predict(model, evals["val"]))
    res["internal_test"] = metrics(*predict(model, evals["test"]))
    lg, yy = predict(model, evals["external_test"])
    present = sorted(set(yy.tolist()))
    res["external_bd5"] = metrics(lg, yy, labels=present)  # macro-F1 over the classes BD5 actually has
    res["external_bd5"]["classes_present"] = [CLASS_DIRS[i] for i in present]
    return res


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    root = find_dataset()
    with open(root / "metadata" / "image_manifest.csv", encoding="utf-8") as f:
        all_rows = list(csv.DictReader(f))
    rows = {s: [r for r in all_rows if r["split"] == s] for s in ("train", "val", "test", "external_test")}
    counts = [sum(r["canonical_class"] == c for r in rows["train"]) for c in CLASS_DIRS]
    print("device", DEV, "| split sizes", {k: len(v) for k, v in rows.items()}, "| train counts", counts, flush=True)
    # visual sanity grids first, so they exist even if training is stopped
    aug_grid.main(["--root", str(root / "images" / "train"), "--out", str(OUT / "aug_grid")])
    results = []
    for arm in ARMS:
        results.append(run_arm(arm, root, rows, counts))
        (OUT / "aug_ablation_results.json").write_text(json.dumps(results, indent=2))
    print("\nSUMMARY (selection on val only)")
    for r in results:
        print(f"{r['arm']:20s} val F1 {r['val']['macro_f1']:.4f} smut R {r['val']['leaf_smut_recall']:.3f} "
              f"P {r['val']['leaf_smut_precision']:.3f} ECE {r['val']['ece15']:.4f} | test F1 "
              f"{r['internal_test']['macro_f1']:.4f} | BD5 F1 {r['external_bd5']['macro_f1']:.4f}")


if __name__ == "__main__":
    main()
