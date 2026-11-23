# M3 — rice / not-rice gate

`m3_not_rice.py` is the exact Kaggle script (private notebook `agroleaf-m3-not-rice-gate`, version 5, CPU) that produced
`web/public/model/agroleaf.onnx` v2-blend-p2-p3-scratch-gate. It:

1. downloads the shipped P2+P3 blend (`web/public/model/agroleaf.onnx`, `model_meta.json`, `report.json`) from `main`;
2. builds the not-rice set (PlantDoc CC BY 4.0 + COCO 2017 images licensed CC BY 2.0 / no known copyright / US Gov),
   split 70/15/15 with seed 42; splits BD5 70/15/15 for the gate only;
3. trains a small CNN from random initialisation (`pretrained=False`) with plain-background and screen-recapture augmentation;
4. picks the threshold and the blend-confidence cap on validation only;
5. folds the gate into the blend graph (7 log-probability outputs, temperature inside, 7-channel CAM) and scores everything once.

Inputs (Kaggle): `kernel-metadata.json` (unified dataset build, `nirmalsankalana/plantdoc-dataset`, `awsaf49/coco-2017-dataset`).
`m3_results.json` holds the numbers reported in `docs/MODEL_REPORT.md`.
