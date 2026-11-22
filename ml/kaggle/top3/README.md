# code/

| File | What it does |
|---|---|
| `top3_train.py` | One self-contained Kaggle script for all three pipelines (P1/P2/P3). Clones the repo branch that holds `agroleaf_ml` (augment, mixup, preprocess) so augmentation and preprocessing are the reviewed PR #14 code. Trains, picks the best val checkpoint (raw or EMA), fits temperature on val, chooses tier thresholds on val, scores internal test and BD5 once, exports `agroleaf.onnx` (`logits`, `cam`), runs parity, and writes `model_meta.json` / `report.json` in the web contract format. |
| `make_kernels.py` | Writes `kaggle/P1`, `kaggle/P2`, `kaggle/P3`, each with a copy of the script (PIPELINE fixed) and a private GPU `kernel-metadata.json` whose input is `mdmasumakondha/agroleaf-unified-dataset-build`. Options: `--aug <profile>`, `--branch <git branch>`. |
| `smoke_test.py` | Local CPU check. Per model: random-init loss ≈ ln 6, one-batch overfit, then a 2-epoch run on a synthetic dataset through export and parity. |

Environment variables (all optional): `AGROLEAF_PIPELINE`, `AGROLEAF_AUG`, `AGROLEAF_BRANCH`, `AGROLEAF_SEED`, `AGROLEAF_DATA`, `AGROLEAF_ML_DIR`, `AGROLEAF_OUT`, `AGROLEAF_TIME_LIMIT_H`, `AGROLEAF_SMOKE`. Kaggle script kernels cannot set them, which is why `make_kernels.py` writes the values into each copy.

Local check (needs torch, torchvision, timm, onnx, onnxruntime, scikit-learn, this repo checked out):

```powershell
python smoke_test.py --ml-dir ..\..
```

Last result on this PC (22 Nov): `SMOKE PASSED for all pipelines`.
