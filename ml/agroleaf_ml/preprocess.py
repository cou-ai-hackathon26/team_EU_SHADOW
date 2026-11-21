"""Inference preprocessing. The browser (web/src/ai) must reproduce this exactly (parity test M6)."""
from __future__ import annotations

import numpy as np
from PIL import Image, ImageOps

from .config import INPUT_SIZE, MEAN, RESIZE_SHORTER, STD


def preprocess(img: Image.Image) -> np.ndarray:
    """PIL image -> float32 array [1, 3, INPUT_SIZE, INPUT_SIZE] (NCHW), normalised."""
    img = ImageOps.exif_transpose(img).convert("RGB")
    w, h = img.size
    scale = RESIZE_SHORTER / min(w, h)
    img = img.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.BILINEAR)
    w, h = img.size
    left, top = (w - INPUT_SIZE) // 2, (h - INPUT_SIZE) // 2
    img = img.crop((left, top, left + INPUT_SIZE, top + INPUT_SIZE))
    x = np.asarray(img, dtype=np.float32) / 255.0
    x = (x - np.array(MEAN, dtype=np.float32)) / np.array(STD, dtype=np.float32)
    return x.transpose(2, 0, 1)[None].astype(np.float32)
