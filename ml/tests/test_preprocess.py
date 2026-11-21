import numpy as np
from PIL import Image

from agroleaf_ml.config import INPUT_SIZE, MEAN, STD
from agroleaf_ml.preprocess import preprocess


def test_output_shape_and_dtype():
    x = preprocess(Image.new("RGB", (640, 480), (10, 200, 30)))
    assert x.shape == (1, 3, INPUT_SIZE, INPUT_SIZE)
    assert x.dtype == np.float32


def test_normalisation_of_uniform_colour():
    x = preprocess(Image.new("RGB", (300, 300), (255, 0, 128)))
    expected = [(1.0 - MEAN[0]) / STD[0], (0.0 - MEAN[1]) / STD[1], (128 / 255 - MEAN[2]) / STD[2]]
    for c in range(3):
        assert np.allclose(x[0, c], expected[c], atol=1e-4)


def test_grayscale_and_rgba_inputs_become_rgb():
    assert preprocess(Image.new("L", (256, 256), 100)).shape[1] == 3
    assert preprocess(Image.new("RGBA", (256, 300), (1, 2, 3, 4))).shape[1] == 3
