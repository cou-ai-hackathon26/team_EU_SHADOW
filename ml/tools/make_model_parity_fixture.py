"""Write web/src/ai/__fixtures__/model_parity.json for the ORT-Web parity test (M6).

Runs the shipped web/public/model/agroleaf.onnx in Python onnxruntime on a few real
photos preprocessed by agroleaf_ml.preprocess, and stores input + reference outputs.
The vitest test runs the same file in onnxruntime-web (WASM) and must match within 1e-4.

    python tools/make_model_parity_fixture.py <photo> [<photo> ...]
"""
from __future__ import annotations

import base64
import json
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from agroleaf_ml.preprocess import preprocess  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
MODEL = ROOT / "web" / "public" / "model" / "agroleaf.onnx"
OUT = ROOT / "web" / "src" / "ai" / "__fixtures__" / "model_parity.json"


def b64(a: np.ndarray) -> str:
    return base64.b64encode(np.ascontiguousarray(a, dtype="<f4").tobytes()).decode()


def main(paths: list[str]) -> None:
    sess = ort.InferenceSession(str(MODEL), providers=["CPUExecutionProvider"])
    cases = []
    for p in paths:
        x = preprocess(Image.open(p))
        logits, cam = sess.run(None, {"input": x})
        cases.append({"name": Path(p).name, "input": b64(x), "logits": logits[0].tolist(),
                      "camShape": list(cam.shape), "camSum": float(cam.sum())})
    OUT.write_text(json.dumps({"model": "agroleaf.onnx", "atol": 1e-4, "cases": cases}) + "\n", encoding="utf-8")
    print(f"wrote {OUT} ({len(cases)} cases)")


if __name__ == "__main__":
    main(sys.argv[1:])
