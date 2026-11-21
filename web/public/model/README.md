# Model files (owner: Masum)

`ml/export.py` writes these here:

| File | What |
|---|---|
| `agroleaf.onnx` | Scratch-trained model. Input `input` [1,3,224,224] float32 NCHW. Output `logits` [1,C]; optional `cam` [1,C,h,w]. |
| `model_meta.json` | See `ModelMeta` in `src/ai/types.ts`. |
| `report.json` | Test-set metrics for the Accuracy page (H6): accuracy, macro-F1, per-class P/R/F1, confusion matrix, coverage. |

Never put a hand-written or fake result here. Every number comes from `ml/evaluate.py`.
