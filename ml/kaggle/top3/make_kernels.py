"""Write one Kaggle kernel folder per pipeline (kaggle/P1, kaggle/P2, kaggle/P3).

Each folder holds a copy of top3_train.py with its PIPELINE line fixed, plus a
kernel-metadata.json (private, GPU, internet on, input = the unified dataset build).
Nothing is pushed: run `kaggle kernels push -p kaggle/P2` yourself after approval.

    python make_kernels.py                    # default branch / augmentation profile
    python make_kernels.py --aug A2_field_mixup --branch main
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

SLUGS = {"P1": "agroleaf-top3-p1-agrofusednet-m", "P2": "agroleaf-top3-p2-mnv3l-cam",
         "P3": "agroleaf-top3-p3-regnety-400mf"}
TITLES = {"P1": "AgroLeaf Top3 P1 AgroFusedNet-M", "P2": "AgroLeaf Top3 P2 MNV3L-CAM",
          "P3": "AgroLeaf Top3 P3 RegNetY-400MF"}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--user", default="mdmasumakondha")
    ap.add_argument("--aug", default=None, help="override AUG_PROFILE default (A0_baseline/A1_field_realistic/A2_field_mixup)")
    ap.add_argument("--branch", default=None, help="override repo branch that holds agroleaf_ml")
    a = ap.parse_args()
    here = Path(__file__).resolve().parent
    src = (here / "top3_train.py").read_text(encoding="utf-8")
    for pipe, slug in SLUGS.items():
        code = re.sub(r'^PIPELINE = .*$', f'PIPELINE = "{pipe}"', src, count=1, flags=re.M)
        if a.aug:
            code = re.sub(r'(AUG_PROFILE = os.environ.get\("AGROLEAF_AUG", )"[^"]+"', rf'\1"{a.aug}"', code, count=1)
        if a.branch:
            code = re.sub(r'(BRANCH = os.environ.get\("AGROLEAF_BRANCH", )"[^"]+"', rf'\1"{a.branch}"', code, count=1)
        d = here / "kaggle" / pipe
        d.mkdir(parents=True, exist_ok=True)
        (d / "top3_train.py").write_text(code, encoding="utf-8")
        meta = {"id": f"{a.user}/{slug}", "title": TITLES[pipe], "code_file": "top3_train.py",
                "language": "python", "kernel_type": "script", "is_private": True, "enable_gpu": True,
                "enable_internet": True, "dataset_sources": [], "competition_sources": [], "model_sources": [],
                "kernel_sources": [f"{a.user}/agroleaf-unified-dataset-build"]}
        (d / "kernel-metadata.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
        print(f"wrote {d}")


if __name__ == "__main__":
    main()
