# Model report (M5) — v1-blend-p2-p3-scratch

All models are trained **from random initialisation** (`pretrained=False`) on the AgroLeaf AI unified dataset build v2
(train 8,863 / val 1,902 / internal test 1,901 / external BD5 2,671). Augmentation profile **A0_baseline** (winner of the
A0/A1/A2 ablation on validation). Checkpoint, blend weights, temperature and tier thresholds were chosen on **validation only**;
internal test and BD5 were scored once afterwards. Code: `ml/kaggle/top3/`.

| Model | Params | ONNX MB | Val macro-F1 | Test macro-F1 | Leaf Smut recall val / test | BD5 4-class macro-F1 | Test ECE (after T) |
|---|---|---|---|---|---|---|---|
| P1 AgroFusedNet-M | 3.69M | 14.8 | 0.908 | 0.880 | 0.78 / 0.69 | 0.268 | 0.050 |
| P2 MobileNetV3-Large-CAM | 4.21M | 16.9 | 0.903 | 0.877 | 0.73 / 0.69 | 0.233 | 0.037 |
| P3 RegNetY-400MF | 3.91M | 15.6 | 0.896 | 0.888 | 0.79 / 0.77 | 0.383 | 0.028 |
| **Blend P2+P3 (deployed)** | 8.12M | 16.3 (FP16 weights) | 0.910 | 0.894 | 0.78 / 0.78 | 0.371 | 0.021 |
| Blend P1+P2+P3 | 11.81M | 23.7 (FP16 weights) | 0.910 | 0.890 | 0.78 / 0.72 | 0.328 | 0.026 |

**Why P2+P3 and not all three:** the 3-model blend tied on validation macro-F1 (0.9100 vs 0.9099) and is 7 MB larger and slower,
so the smaller blend was kept (rule fixed before looking at test).

The deployed file is one ONNX graph: both networks, the per-class blend, output `logits` (blended log-probabilities; the app
divides by T = 0.910) and `cam` [1, 6, 7, 7]. Weights are stored as FP16 and cast to FP32, so all maths is FP32.
Checks: FP32 graph vs PyTorch max |Δ| 5.7e-06; FP16-stored vs FP32 on 200 real photos max prob Δ
0.0019, top-1 agreement 100%; ONNX Runtime Web (WASM) vs Python within 1e-4 (`web/src/ai/model.parity.test.ts`).

## Blend weights (per class, validation-fitted)

| Model | healthy | blast | brown_spot | leaf_smut | tungro | sheath_blight |
|---|---|---|---|---|---|---|
| P2 | 0.53 | 0.27 | 0.47 | 0.52 | 0.37 | 0.23 |
| P3 | 0.47 | 0.73 | 0.53 | 0.48 | 0.63 | 0.77 |

## Internal test, per class (calibrated)

| Class | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| healthy | 0.928 | 0.970 | 0.949 | 333 |
| blast | 0.904 | 0.897 | 0.901 | 359 |
| brown_spot | 0.855 | 0.830 | 0.842 | 376 |
| leaf_smut | 0.778 | 0.778 | 0.778 | 108 |
| tungro | 0.923 | 0.934 | 0.928 | 410 |
| sheath_blight | 0.974 | 0.956 | 0.965 | 315 |

## Limitations

- **BD5 (external, Savar) is weak (4-class macro-F1 0.37).** BD5 photos are detached leaves on white paper
  indoors; all training photos are field photos. Wrong answers go mostly to Blast and Sheath Blight. Photos that do not look like
  field photos are unreliable; the confidence tiers and the "not sure" answer are the safety net.
- Leaf Smut comes from one source (RiceLeafDiseaseBD v3) and is most often confused with Brown Spot.
- No not_rice class yet (M3), so `thresholds.notRice` is 1.01 (never triggers).

## Confidence tiers (thresholds chosen on validation)

`high` 0.65 (≤ 5% val error), `healthyHigh` 0.72 (≥ 97% val precision for "healthy"), `medium` 0.57: below it the app says "আমি নিশ্চিত নই". 0.57 is the largest threshold where the abstained validation photos are mostly wrong (top-1 accuracy ≤ 60%) while abstaining on ≤ 5% of validation photos.

| Tier | Val coverage / accuracy | Internal test coverage / accuracy | BD5 coverage / accuracy |
|---|---|---|---|
| high | 92.8% / 95.4% | 92.5% / 94.4% | 36.5% / 37.7% |
| medium (top-2) | 2.5% / 51.1% | 2.8% / 49.1% | 16.8% / 36.6% |
| not sure | 4.7% / 56.7% | 4.7% / 43.8% | 46.8% / 35.6% |
