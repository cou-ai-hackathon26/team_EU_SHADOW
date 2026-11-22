"""Online, train-only image augmentation for AgroLeaf AI (feature M2).

Three profiles for controlled ablations:

* ``A0_baseline``        lesion-safe geometry + mild brightness/contrast.
* ``A1_field_realistic`` A0 + field/BD5 bridge: tight hue/saturation, soft shadow,
                         down-up or mild blur, sensor noise, JPEG, one tiny erase.
* ``A2_field_mixup``     A1 image pipeline; batch-level MixUp is switched on in
                         the training loop (see ``mixup.py``).

Only the ``train`` split is ever augmented. Every other split goes through
``eval_transform``, which wraps ``preprocess.preprocess`` so training, validation,
ONNX export and the browser (``web/src/ai/preprocess.ts``) all see the same input.

All randomness comes from ``torch``'s RNG, so ``torch.manual_seed`` (and the
DataLoader's per-worker seeding) makes a run reproducible.
"""
from __future__ import annotations

import io
import math
from dataclasses import dataclass

import torch
import torch.nn.functional as F
from PIL import Image, ImageOps
from torchvision.transforms import InterpolationMode, v2
from torchvision.transforms.v2 import functional as TF

from .config import INPUT_SIZE, MEAN, RESIZE_SHORTER, STD
from .preprocess import preprocess

PROFILES = ("A0_baseline", "A1_field_realistic", "A2_field_mixup")
SPLITS = ("train", "val", "test", "external_test")


@dataclass(frozen=True)
class AugProfile:
    name: str
    # geometry (lesion-safe)
    crop_scale: tuple[float, float] = (0.80, 1.0)
    crop_ratio: tuple[float, float] = (0.85, 1.18)
    p_hflip: float = 0.5
    p_vflip: float = 0.15
    rotate_deg: float = 15.0
    p_rotate: float = 0.35
    # lighting
    brightness: float = 0.15
    contrast: float = 0.15
    p_bc: float = 0.5
    hue: float = 0.0
    saturation: float = 0.0
    p_hs: float = 0.0
    p_shadow: float = 0.0
    shadow_strength: tuple[float, float] = (0.2, 0.4)
    # field-camera degradation (BD5 bridge)
    p_degrade: float = 0.0
    downup_scale: tuple[float, float] = (0.45, 0.80)
    blur_kernels: tuple[int, ...] = (3, 5)
    blur_sigma: tuple[float, float] = (0.3, 1.2)
    p_noise: float = 0.0
    noise_sigma: tuple[float, float] = (0.005, 0.02)
    p_jpeg: float = 0.0
    jpeg_quality: tuple[int, int] = (60, 95)
    # occlusion
    p_erase: float = 0.0
    erase_scale: tuple[float, float] = (0.005, 0.04)
    # batch-level (applied in the training loop, not here)
    mixup: bool = False


_FIELD = dict(
    hue=0.015, saturation=0.10, p_hs=0.25,
    p_shadow=0.20,
    p_degrade=0.35,
    p_noise=0.15,
    p_jpeg=0.25,
    p_erase=0.10,
)

_REGISTRY = {
    "A0_baseline": AugProfile(name="A0_baseline"),
    "A1_field_realistic": AugProfile(name="A1_field_realistic", **_FIELD),
    "A2_field_mixup": AugProfile(name="A2_field_mixup", mixup=True, **_FIELD),
}


def get_profile(name: str) -> AugProfile:
    if name not in _REGISTRY:
        raise ValueError(f"unknown augmentation profile {name!r}; choose from {PROFILES}")
    return _REGISTRY[name]


# ---------------------------------------------------------------- small ops


def _uniform(lo: float, hi: float) -> float:
    return float(torch.empty(1).uniform_(lo, hi))


class _PILToUint8:
    """EXIF-aware RGB PIL image -> uint8 CHW tensor (same decode rules as preprocess)."""

    def __call__(self, img: Image.Image) -> torch.Tensor:
        img = ImageOps.exif_transpose(img).convert("RGB")
        return TF.pil_to_tensor(img)


class _RotateReflect:
    """Small rotation with reflect padding, so no black corners appear."""

    def __init__(self, degrees: float):
        self.degrees = degrees

    def __call__(self, x: torch.Tensor) -> torch.Tensor:
        deg = _uniform(-self.degrees, self.degrees)
        _, h, w = x.shape
        rad = math.radians(abs(deg))
        pad = int(math.ceil(0.5 * max(h, w) * (math.sin(rad) + math.cos(rad) - 1))) + 2
        pad = min(pad, h - 1, w - 1)
        xp = F.pad(x[None].float(), (pad, pad, pad, pad), mode="reflect")[0]
        xr = TF.rotate(xp, deg, interpolation=InterpolationMode.BILINEAR)
        xr = xr[:, pad:pad + h, pad:pad + w]
        return xr.round().clamp(0, 255).to(torch.uint8)


class _SoftShadow:
    """Soft half-plane shadow (hand, canopy) that darkens without changing hue."""

    def __init__(self, strength: tuple[float, float]):
        self.strength = strength

    def __call__(self, x: torch.Tensor) -> torch.Tensor:
        _, h, w = x.shape
        theta = _uniform(0, 2 * math.pi)
        yy, xx = torch.meshgrid(torch.linspace(-1, 1, h), torch.linspace(-1, 1, w), indexing="ij")
        d = xx * math.cos(theta) + yy * math.sin(theta)
        mask = torch.sigmoid((d - _uniform(-0.4, 0.4)) / _uniform(0.05, 0.3))
        return (x * (1 - _uniform(*self.strength) * mask)).clamp(0, 1)


class _DownUp:
    """Down-scale then up-scale: mimics low-resolution / soft-focus budget phones (BD5)."""

    def __init__(self, scale: tuple[float, float]):
        self.scale = scale

    def __call__(self, x: torch.Tensor) -> torch.Tensor:
        _, h, w = x.shape
        s = _uniform(*self.scale)
        small = F.interpolate(x[None], size=(max(16, int(h * s)), max(16, int(w * s))), mode="area")
        return F.interpolate(small, size=(h, w), mode="bilinear", align_corners=False)[0].clamp(0, 1)


class _GaussNoise:
    def __init__(self, sigma: tuple[float, float]):
        self.sigma = sigma

    def __call__(self, x: torch.Tensor) -> torch.Tensor:
        return (x + torch.randn_like(x) * _uniform(*self.sigma)).clamp(0, 1)


class _JPEG:
    """Messaging-app / cheap camera JPEG compression on a float [0,1] tensor."""

    def __init__(self, quality: tuple[int, int]):
        self.quality = quality

    def __call__(self, x: torch.Tensor) -> torch.Tensor:
        q = int(torch.randint(self.quality[0], self.quality[1] + 1, (1,)))
        u8 = (x * 255).round().clamp(0, 255).to(torch.uint8)
        buf = io.BytesIO()
        TF.to_pil_image(u8).save(buf, "JPEG", quality=q)
        buf.seek(0)
        return TF.pil_to_tensor(Image.open(buf).convert("RGB")).float() / 255.0


# ---------------------------------------------------------------- builders


def build_train_transform(profile: str | AugProfile):
    """PIL image -> normalised float32 tensor [3, INPUT_SIZE, INPUT_SIZE] with random augmentation."""
    p = profile if isinstance(profile, AugProfile) else get_profile(profile)
    ops: list = [
        _PILToUint8(),
        v2.Resize(RESIZE_SHORTER, antialias=True),  # same framing as eval (shorter side 256)
        v2.CenterCrop(RESIZE_SHORTER),
        v2.RandomApply([_RotateReflect(p.rotate_deg)], p=p.p_rotate),
        v2.RandomResizedCrop(INPUT_SIZE, scale=p.crop_scale, ratio=p.crop_ratio, antialias=True),
        v2.RandomHorizontalFlip(p.p_hflip),
        v2.RandomVerticalFlip(p.p_vflip),
        v2.RandomApply([v2.ColorJitter(brightness=p.brightness, contrast=p.contrast)], p=p.p_bc),
    ]
    if p.p_hs > 0:
        ops.append(v2.RandomApply([v2.ColorJitter(saturation=p.saturation, hue=p.hue)], p=p.p_hs))
    ops.append(v2.ToDtype(torch.float32, scale=True))
    if p.p_shadow > 0:
        ops.append(v2.RandomApply([_SoftShadow(p.shadow_strength)], p=p.p_shadow))
    if p.p_degrade > 0:
        choices = [_DownUp(p.downup_scale)] + [v2.GaussianBlur(k, sigma=p.blur_sigma) for k in p.blur_kernels]
        ops.append(v2.RandomApply([v2.RandomChoice(choices)], p=p.p_degrade))
    if p.p_noise > 0:
        ops.append(v2.RandomApply([_GaussNoise(p.noise_sigma)], p=p.p_noise))
    if p.p_jpeg > 0:
        ops.append(v2.RandomApply([_JPEG(p.jpeg_quality)], p=p.p_jpeg))
    ops.append(v2.Normalize(MEAN, STD))
    if p.p_erase > 0:
        ops.append(v2.RandomErasing(p=p.p_erase, scale=p.erase_scale, ratio=(0.5, 2.0), value=0))
    return v2.Compose(ops)


def eval_transform(img: Image.Image) -> torch.Tensor:
    """Deterministic val/test/ONNX/browser preprocessing: exactly ``preprocess()``, as a CHW tensor."""
    return torch.from_numpy(preprocess(img)[0])


def get_transform(split: str, profile: str = "A0_baseline"):
    """Transform for a dataset split. Augmentation is applied to ``train`` only."""
    if split not in SPLITS:
        raise ValueError(f"unknown split {split!r}; choose from {SPLITS}")
    get_profile(profile)  # validate the name for every split
    return build_train_transform(profile) if split == "train" else eval_transform
