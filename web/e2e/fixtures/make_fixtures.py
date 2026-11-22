"""
Generates synthetic fixture images for the F10 e2e / quality-rule tests.
All images are 224x224 JPEG, ≤ 300 KB.

Images generated here are NOT real photos of rice leaves.
They are used to trigger quality-rule code paths (blur, dark, bright, not_rice).
See TEST_REPORT.md for the honest account of what has and has not been tested
with real photos.
"""

import io
import os
from PIL import Image, ImageFilter, ImageDraw
import random

OUT = os.path.join(os.path.dirname(__file__), "images")
os.makedirs(OUT, exist_ok=True)

SIZE = (224, 224)
Q = 75  # JPEG quality, keeps files well under 300 KB


def save(img: Image.Image, name: str) -> None:
    path = os.path.join(OUT, name)
    buf = io.BytesIO()
    img.convert("RGB").save(buf, format="JPEG", quality=Q, optimize=True)
    if buf.tell() > 300_000:
        raise ValueError(f"{name}: {buf.tell()} bytes exceeds 300 KB limit")
    with open(path, "wb") as f:
        f.write(buf.getvalue())
    print(f"  wrote {name}  ({buf.tell():,} bytes)")


# --- BLURRY images (uniform grey + extreme Gaussian blur → near-zero Laplacian) ---
def make_blurry(n: int) -> Image.Image:
    # Slight noise then heavy blur → no edges → tooBlurry
    img = Image.new("RGB", SIZE, (90 + n * 10, 90 + n * 5, 85))
    # Add faint grid so there's something to blur
    draw = ImageDraw.Draw(img)
    for i in range(0, 224, 16):
        draw.line([(i, 0), (i, 224)], fill=(80, 90, 80), width=1)
        draw.line([(0, i), (224, i)], fill=(80, 90, 80), width=1)
    # Extreme blur removes all edges
    img = img.filter(ImageFilter.GaussianBlur(radius=18))
    return img


save(make_blurry(0), "blur_1.jpg")
save(make_blurry(1), "blur_2.jpg")

# --- DARK images (average luminance < 40) ---
def make_dark(luma: int) -> Image.Image:
    # Pure dark image with tiny variation so it's not a solid block
    base = max(0, luma - 10)
    pixels = [
        (
            max(0, base + random.randint(-3, 3)),
            max(0, base + random.randint(-3, 3)),
            max(0, base + random.randint(-3, 3)),
        )
        for _ in range(SIZE[0] * SIZE[1])
    ]
    img = Image.new("RGB", SIZE)
    img.putdata(pixels)
    return img


random.seed(42)
save(make_dark(18), "dark_1.jpg")
save(make_dark(28), "dark_2.jpg")

# --- BRIGHT images (average luminance > 220) ---
def make_bright(luma: int) -> Image.Image:
    base = min(255, luma + 10)
    pixels = [
        (
            min(255, base + random.randint(-3, 3)),
            min(255, base + random.randint(-3, 3)),
            min(255, base + random.randint(-3, 3)),
        )
        for _ in range(SIZE[0] * SIZE[1])
    ]
    img = Image.new("RGB", SIZE)
    img.putdata(pixels)
    return img


save(make_bright(235), "bright_1.jpg")
save(make_bright(245), "bright_2.jpg")

# --- NOT-RICE images (solid colours that look nothing like a rice leaf) ---
# Bright blue sky patch
sky = Image.new("RGB", SIZE, (100, 149, 237))
save(sky, "not_rice_sky.jpg")

# Soil / mud brown
mud = Image.new("RGB", SIZE, (101, 67, 33))
draw = ImageDraw.Draw(mud)
for _ in range(300):
    x, y = random.randint(0, 223), random.randint(0, 223)
    draw.ellipse([x, y, x + 4, y + 4], fill=(90 + random.randint(-10, 10), 60, 25))
save(mud, "not_rice_mud.jpg")

# White noise / blank
noise_pixels = [
    (random.randint(220, 255), random.randint(220, 255), random.randint(220, 255))
    for _ in range(SIZE[0] * SIZE[1])
]
noise = Image.new("RGB", SIZE)
noise.putdata(noise_pixels)
save(noise, "not_rice_noise.jpg")

print("Done — all fixture images written.")
