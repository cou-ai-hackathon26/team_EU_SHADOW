"""Save a visual sanity-check grid of augmented training samples for every profile (M2).

Rows are the 6 classes; column 0 is the deterministic eval view, the other columns
are random train views of the same image. Look for: lesions still visible, Healthy
still green, no black corners, blur/JPEG mild.

    python tools/aug_grid.py --root <unified>/images/train --out artifacts/aug_grid
    python tools/aug_grid.py --root ... --profiles A1_field_realistic --cols 8 --seed 1
"""
from __future__ import annotations

import argparse
import random
import sys
from pathlib import Path

import torch
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agroleaf_ml.augment import PROFILES, build_train_transform, eval_transform  # noqa: E402
from agroleaf_ml.config import INPUT_SIZE, MEAN, STD  # noqa: E402

# folder names in the unified Kaggle dataset, in config.CLASSES order
CLASS_DIRS = ["Healthy", "Blast", "Brown Spot", "Leaf Smut", "Rice Tungro", "Sheath Blight"]
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def to_pil(x: torch.Tensor) -> Image.Image:
    mean = torch.tensor(MEAN).view(3, 1, 1)
    std = torch.tensor(STD).view(3, 1, 1)
    u8 = ((x * std + mean).clamp(0, 1) * 255).round().to(torch.uint8)
    return Image.fromarray(u8.permute(1, 2, 0).numpy())


def pick_images(root: Path, rng: random.Random) -> list[tuple[str, Path]]:
    picks = []
    for name in CLASS_DIRS:
        d = root / name
        files = sorted(p for p in d.rglob("*") if p.suffix.lower() in EXTS) if d.is_dir() else []
        if not files:
            raise SystemExit(f"no images for class {name!r} under {d}")
        picks.append((name, rng.choice(files)))
    return picks


def make_grid(picks, profile: str, cols: int, seed: int) -> Image.Image:
    tf = build_train_transform(profile)
    s, label_h = INPUT_SIZE, 18
    grid = Image.new("RGB", (s * (cols + 1), (s + label_h) * len(picks)), "white")
    draw = ImageDraw.Draw(grid)
    torch.manual_seed(seed)
    for r, (name, path) in enumerate(picks):
        img = Image.open(path)
        y = r * (s + label_h)
        draw.text((4, y + 2), f"{name}  ({path.name[:40]})   col 0 = eval view", fill="black")
        grid.paste(to_pil(eval_transform(img)), (0, y + label_h))
        for c in range(cols):
            grid.paste(to_pil(tf(img)), ((c + 1) * s, y + label_h))
    return grid


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", type=Path, required=True, help="train folder with one sub-folder per class")
    ap.add_argument("--out", type=Path, default=Path("artifacts/aug_grid"))
    ap.add_argument("--profiles", nargs="+", default=list(PROFILES), choices=PROFILES)
    ap.add_argument("--cols", type=int, default=6)
    ap.add_argument("--seed", type=int, default=42)
    a = ap.parse_args(argv)
    a.out.mkdir(parents=True, exist_ok=True)
    picks = pick_images(a.root, random.Random(a.seed))
    for prof in a.profiles:
        path = a.out / f"aug_grid_{prof}.png"
        make_grid(picks, prof, a.cols, a.seed).save(path)
        print(f"saved {path}")


if __name__ == "__main__":
    main()
