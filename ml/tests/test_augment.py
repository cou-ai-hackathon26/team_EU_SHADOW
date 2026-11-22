import numpy as np
import pytest
from PIL import Image

torch = pytest.importorskip("torch")

from agroleaf_ml.augment import (  # noqa: E402
    PROFILES,
    eval_transform,
    get_profile,
    get_transform,
)
from agroleaf_ml.config import INPUT_SIZE  # noqa: E402
from agroleaf_ml.preprocess import preprocess  # noqa: E402


def _leaf(w=400, h=300, seed=0):
    rng = np.random.default_rng(seed)
    arr = np.zeros((h, w, 3), np.uint8)
    arr[..., 1] = 160  # green leaf
    arr[..., 0] = 40
    arr[..., 2] = 30
    arr += rng.integers(0, 20, arr.shape, dtype=np.uint8)
    arr[120:140, 180:200] = (20, 20, 20)  # small dark "lesion"
    return Image.fromarray(arr)


def test_three_profiles_exist():
    assert PROFILES == ("A0_baseline", "A1_field_realistic", "A2_field_mixup")


@pytest.mark.parametrize("profile", PROFILES)
def test_train_output_shape_and_dtype(profile):
    tf = get_transform("train", profile)
    for i in range(5):
        x = tf(_leaf(seed=i))
        assert isinstance(x, torch.Tensor)
        assert tuple(x.shape) == (3, INPUT_SIZE, INPUT_SIZE)
        assert x.dtype == torch.float32
        assert torch.isfinite(x).all()


@pytest.mark.parametrize("size", [(640, 480), (300, 300), (256, 512)])
def test_eval_transform_matches_browser_preprocess_exactly(size):
    img = _leaf(*size)
    x = eval_transform(img)
    assert tuple(x.shape) == (3, INPUT_SIZE, INPUT_SIZE)
    assert x.dtype == torch.float32
    assert np.array_equal(x.numpy(), preprocess(img)[0])


def test_eval_transform_is_deterministic():
    img = _leaf()
    a, b = eval_transform(img), eval_transform(img)
    assert torch.equal(a, b)


@pytest.mark.parametrize("split", ["val", "test", "external_test"])
@pytest.mark.parametrize("profile", PROFILES)
def test_no_augmentation_leaks_into_eval_splits(split, profile):
    img = _leaf()
    tf = get_transform(split, profile)
    torch.manual_seed(0)
    a = tf(img)
    torch.manual_seed(123)
    b = tf(img)
    assert torch.equal(a, b)
    assert torch.equal(a, eval_transform(img))


def test_unknown_split_or_profile_raises():
    with pytest.raises(ValueError):
        get_transform("training", "A0_baseline")
    with pytest.raises(ValueError):
        get_transform("train", "A9_magic")


@pytest.mark.parametrize("profile", PROFILES)
def test_train_transform_reproducible_with_seed(profile):
    tf = get_transform("train", profile)
    img = _leaf()
    torch.manual_seed(7)
    a = tf(img)
    torch.manual_seed(7)
    b = tf(img)
    assert torch.equal(a, b)


def test_train_transform_is_random():
    tf = get_transform("train", "A1_field_realistic")
    img = _leaf()
    outs = [tf(img) for _ in range(4)]
    assert any(not torch.equal(outs[0], o) for o in outs[1:])


@pytest.mark.parametrize("profile", PROFILES)
def test_symptom_safe_bounds(profile):
    p = get_profile(profile)
    assert p.crop_scale[0] >= 0.80
    assert p.hue <= 0.02
    assert p.saturation <= 0.15
    assert p.rotate_deg <= 15
    assert p.blur_kernels and max(p.blur_kernels) <= 5 or not p.blur_kernels
    assert p.erase_scale[1] <= 0.04


def test_baseline_has_no_degradation_or_hue():
    p = get_profile("A0_baseline")
    assert p.hue == 0 and p.saturation == 0
    assert p.p_degrade == 0 and p.p_jpeg == 0 and p.p_shadow == 0 and p.p_erase == 0
    assert not p.mixup


def test_field_profiles_differ_only_by_mixup():
    a1, a2 = get_profile("A1_field_realistic"), get_profile("A2_field_mixup")
    assert not a1.mixup and a2.mixup
    assert {k: v for k, v in vars(a1).items() if k not in ("name", "mixup")} == {
        k: v for k, v in vars(a2).items() if k not in ("name", "mixup")
    }


def test_green_leaf_stays_green_under_field_colour_jitter():
    """Healthy must not drift towards Tungro yellow: the green channel stays dominant."""
    tf = get_transform("train", "A1_field_realistic")
    img = Image.new("RGB", (300, 300), (60, 150, 40))
    mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
    std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
    torch.manual_seed(0)
    for _ in range(60):
        rgb = (tf(img) * std + mean).mean(dim=(1, 2))
        r, g, _b = rgb.tolist()
        assert g > r * 1.5
