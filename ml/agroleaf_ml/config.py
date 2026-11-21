"""Single source of truth for ML settings shared with the web app (via model_meta.json)."""

CLASSES = ["healthy", "blast", "brown_spot", "leaf_smut", "tungro", "sheath_blight"]
NOT_RICE = "not_rice"  # optional 7th class (feature M3)

INPUT_SIZE = 224
RESIZE_SHORTER = 256  # resize shorter side, then centre-crop INPUT_SIZE
MEAN = (0.485, 0.456, 0.406)
STD = (0.229, 0.224, 0.225)

SEED = 42
SPLIT = {"train": 0.70, "val": 0.15, "test": 0.15}
