"""Generate deterministic non-uniform image and Python agroleaf_ml.preprocess output fixture."""
from __future__ import annotations

import base64
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image

# Ensure agroleaf_ml is in path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from agroleaf_ml.preprocess import preprocess


def make_fixture():
    w, h = 301, 217
    xs = np.arange(w)
    ys = np.arange(h)
    grid_x, grid_y = np.meshgrid(xs, ys)

    # Continuous gradient across channels
    r = ((grid_x / (w - 1)) * 220 + 15).astype(np.uint8)
    g = ((grid_y / (h - 1)) * 220 + 20).astype(np.uint8)
    b = (((grid_x + grid_y) / (w + h - 2)) * 220 + 10).astype(np.uint8)

    # Checkerboard modulation (16x16 blocks)
    checker = ((grid_x // 16) + (grid_y // 16)) % 2 == 0
    r[checker] = ((r[checker].astype(np.int32) + 35) % 256).astype(np.uint8)
    g[checker] = ((g[checker].astype(np.int32) + 55) % 256).astype(np.uint8)
    b[checker] = ((b[checker].astype(np.int32) + 75) % 256).astype(np.uint8)

    rgb = np.stack([r, g, b], axis=-1)
    img = Image.fromarray(rgb, "RGB")

    rgba = img.convert("RGBA")
    rgba_bytes = rgba.tobytes()
    b64_pixels = base64.b64encode(rgba_bytes).decode("ascii")

    # Run Python reference preprocess
    processed = preprocess(img)  # shape (1, 3, 224, 224)
    flat = processed[0].reshape(-1)  # 3 * 224 * 224 = 150528

    # Sample ~200 fixed indices across all 3 channels
    total_elements = len(flat)  # 150528
    indices = np.linspace(0, total_elements - 1, 200, dtype=int).tolist()
    samples = [
        {"index": idx, "expected": round(float(flat[idx]), 6)}
        for idx in indices
    ]

    out_path = (
        Path(__file__).resolve().parents[2]
        / "web"
        / "src"
        / "ai"
        / "__fixtures__"
        / "preprocess.python.json"
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "width": w,
                "height": h,
                "pixels": b64_pixels,
                "samples": samples,
            },
            f,
            indent=2,
        )

    print(f"Generated fixture at {out_path} with {len(samples)} samples")


if __name__ == "__main__":
    make_fixture()
