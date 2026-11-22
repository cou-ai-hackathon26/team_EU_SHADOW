import pytest

torch = pytest.importorskip("torch")

from agroleaf_ml.mixup import (  # noqa: E402
    MixUpConfig,
    class_weights_sqrt,
    mixup_active,
    mixup_batch,
    soft_target_ce,
)

LEAF_SMUT = 3


def test_sqrt_class_weights_for_train_counts():
    w = class_weights_sqrt([1551, 1673, 1750, 503, 1916, 1470])
    assert w.dtype == torch.float32
    assert torch.isclose(w.mean(), torch.tensor(1.0), atol=1e-6)
    assert torch.allclose(w, torch.tensor([0.9109, 0.8770, 0.8575, 1.5995, 0.8195, 0.9356]), atol=1e-3)
    assert int(w.argmax()) == LEAF_SMUT


def test_mixup_schedule_off_in_last_15_percent():
    cfg = MixUpConfig(off_last_frac=0.15)
    assert mixup_active(0, 100, cfg)
    assert mixup_active(84, 100, cfg)
    assert not mixup_active(85, 100, cfg)
    assert not mixup_active(99, 100, cfg)


def test_mixup_returns_soft_targets_that_sum_to_one():
    torch.manual_seed(0)
    x = torch.randn(16, 3, 8, 8)
    y = torch.arange(16) % 6
    cfg = MixUpConfig(p=1.0, protect_class=None)
    xm, t = mixup_batch(x, y, 6, cfg)
    assert xm.shape == x.shape and t.shape == (16, 6)
    assert torch.allclose(t.sum(1), torch.ones(16))
    # dominant label is always the original one (lambda >= 0.5)
    assert torch.equal(t.argmax(1), y) or (t.max(1).values >= 0.5).all()
    assert (t.gather(1, y[:, None]).squeeze(1) >= 0.5 - 1e-6).all()


def test_mixup_p_zero_is_identity_one_hot():
    x = torch.randn(8, 3, 4, 4)
    y = torch.arange(8) % 6
    xm, t = mixup_batch(x, y, 6, MixUpConfig(p=0.0))
    assert torch.equal(xm, x)
    assert torch.equal(t, torch.nn.functional.one_hot(y, 6).float())


def test_leaf_smut_images_are_never_mixed():
    torch.manual_seed(1)
    x = torch.randn(32, 3, 4, 4)
    y = torch.arange(32) % 6
    xm, t = mixup_batch(x, y, 6, MixUpConfig(p=1.0, protect_class=LEAF_SMUT))
    smut = y == LEAF_SMUT
    assert torch.equal(xm[smut], x[smut])
    assert torch.equal(t[smut], torch.nn.functional.one_hot(y[smut], 6).float())
    # nothing else receives Leaf Smut pixels either
    assert (t[~smut][:, LEAF_SMUT] == 0).all()


def test_soft_ce_equals_weighted_ce_on_hard_labels():
    torch.manual_seed(0)
    logits = torch.randn(10, 6)
    y = torch.arange(10) % 6
    w = class_weights_sqrt([1551, 1673, 1750, 503, 1916, 1470])
    ours = soft_target_ce(logits, torch.nn.functional.one_hot(y, 6).float(), w)
    ref = (torch.nn.functional.cross_entropy(logits, y, weight=w, reduction="none")).mean()
    assert torch.isclose(ours, ref, atol=1e-5)


def test_soft_ce_with_label_smoothing_is_finite():
    logits = torch.randn(4, 6, requires_grad=True)
    t = torch.full((4, 6), 1 / 6)
    loss = soft_target_ce(logits, t, label_smoothing=0.03)
    loss.backward()
    assert torch.isfinite(loss)
