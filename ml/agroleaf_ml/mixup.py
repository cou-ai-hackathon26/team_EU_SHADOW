"""Batch-level MixUp for profile A2_field_mixup, plus class weights and a soft-target loss (M2).

MixUp is mild (alpha 0.2), keeps the original image dominant (lambda >= 0.5), is
switched off for the last part of training, and by default never mixes Leaf Smut
images, whose tiny dark sori could be washed out by blending.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Sequence

import torch
import torch.nn.functional as F

LEAF_SMUT = 3  # index in config.CLASSES


@dataclass(frozen=True)
class MixUpConfig:
    alpha: float = 0.2
    p: float = 0.25
    off_last_frac: float = 0.15
    protect_class: int | None = LEAF_SMUT


def mixup_active(epoch: int, total_epochs: int, cfg: MixUpConfig) -> bool:
    """True while MixUp is allowed; False during the final ``off_last_frac`` of epochs (0-based epoch)."""
    return epoch < math.floor(total_epochs * (1 - cfg.off_last_frac) + 1e-9)


def mixup_batch(x: torch.Tensor, y: torch.Tensor, num_classes: int, cfg: MixUpConfig):
    """Return (images, soft targets [B, num_classes]). With probability 1-p the batch is unchanged."""
    target = F.one_hot(y, num_classes).float()
    if cfg.p <= 0 or float(torch.rand(1)) >= cfg.p:
        return x, target
    lam = float(torch.distributions.Beta(cfg.alpha, cfg.alpha).sample())
    lam = max(lam, 1.0 - lam)
    perm = torch.randperm(x.size(0), device=x.device)
    lam_vec = torch.full((x.size(0),), lam, device=x.device)
    if cfg.protect_class is not None:
        protected = (y == cfg.protect_class) | (y[perm] == cfg.protect_class)
        lam_vec = torch.where(protected, torch.ones_like(lam_vec), lam_vec)
    lx = lam_vec.view(-1, *([1] * (x.dim() - 1))).to(x.dtype)
    mixed = lx * x + (1 - lx) * x[perm]
    lt = lam_vec[:, None]
    return mixed, lt * target + (1 - lt) * target[perm]


def class_weights_sqrt(counts: Sequence[int]) -> torch.Tensor:
    """Square-root inverse-frequency weights, w_c = sqrt(N / (K * n_c)), normalised to mean 1."""
    c = torch.as_tensor(counts, dtype=torch.float64)
    w = (c.sum() / (len(c) * c)).sqrt()
    return (w / w.mean()).float()


def soft_target_ce(
    logits: torch.Tensor,
    targets: torch.Tensor,
    class_weights: torch.Tensor | None = None,
    label_smoothing: float = 0.0,
) -> torch.Tensor:
    """Cross-entropy on soft targets with optional per-class weights and label smoothing (mean over batch)."""
    k = logits.size(-1)
    t = targets * (1 - label_smoothing) + label_smoothing / k
    logp = F.log_softmax(logits, dim=-1)
    if class_weights is not None:
        t = t * class_weights.to(logits.device, logits.dtype)[None]
    return -(t * logp).sum(-1).mean()
