---
name: model-export-parity
description: Export the trained model to ONNX for the browser, write model_meta.json and report.json, and prove Python and browser preprocessing and inference match. Use after a training run is chosen (M4 to M6).
---
1. Fit temperature T on validation logits (minimise NLL). Choose thresholds (high, medium, healthyHigh, notRice) from the validation risk–coverage curve. Save to `web/public/model/model_meta.json` (schema `ModelMeta` in `web/src/ai/types.ts`).
2. Export ONNX (opset 17): input `input` [1,3,224,224]; outputs `logits` [1,C] and `cam` [1,C,7,7]. Check with `onnx.checker` and run onnxruntime on 5 fixture images.
3. Write `web/src/ai/__fixtures__/parity.json`: for 3 small images, the expected preprocessed values (sampled) and the onnxruntime logits from Python.
4. The web parity test runs `preprocess.ts` on the same images and compares (atol 1e-3); logits are compared by running the ONNX model in Vitest with onnxruntime-web (wasm).
5. Keep `agroleaf.onnx` at most 30 MB (raised from 10 MB, D8). Commit model files in a `feat/ml-*` PR with the report numbers in the description.
