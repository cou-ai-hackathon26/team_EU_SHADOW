---
name: kaggle-train
description: Run AgroLeaf AI training on Kaggle GPU with the kaggle CLI and download the outputs. Use for M1 to M5 training runs.
---
- Credentials: `~/.kaggle/kaggle.json` on the lead's PC. Never copy it into the repo.
- Dataset: RiceLeafDiseaseBD v3 (Mendeley DOI 10.17632/86s4jzj2m4.3, CC BY 4.0). Before using a Kaggle mirror, check its per-class file counts match the paper (9,769 images, 6 classes); otherwise upload the Mendeley zip as a private Kaggle dataset.
- Kernel source lives in `ml/notebooks/<run>/` with `kernel-metadata.json` (`enable_gpu: true`, `enable_internet: true`, dataset in `dataset_sources`). Copy `ml/agroleaf_ml` into the kernel folder so the same preprocessing code is used.
- Push: `kaggle kernels push -p ml/notebooks/<run>`. Status: `kaggle kernels status <user>/<slug>`. Output: `kaggle kernels output <user>/<slug> -p ml/artifacts/<run>`.
- Each run writes `best.pt`, `history.csv`, `val_logits.npy`, `test_logits.npy`, `split_manifest.csv`, `config.json`. Record run id, settings and validation macro-F1 in `docs/MODEL_REPORT.md`.
- Always `pretrained=False`. Evaluate the test set once, for the chosen model only.
