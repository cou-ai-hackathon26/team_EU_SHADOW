# ml/ — training, calibration and export (owner: Masum)

```bash
cd ml
python -m pip install -r requirements.txt
python -m pytest -q
```

Training runs on Kaggle GPU (`requirements-train.txt`). Outputs go to `web/public/model/` via `export.py`.
Rule: the final model is trained from random initialisation (`pretrained=False`). Never commit dataset images or Kaggle keys.

## Augmentation (M2)
`agroleaf_ml/augment.py` has three online, train-only profiles; every other split uses `eval_transform` (= `preprocess.py`, same as the browser).

| Profile | What it adds |
|---|---|
| `A0_baseline` | shorter side 256 → RandomResizedCrop 224 (scale 0.80–1.0), HFlip 0.5, VFlip 0.15, rotate ±15° reflect (p 0.35), brightness/contrast ±0.15 |
| `A1_field_realistic` | A0 + hue ±0.015 / saturation ±0.10, soft shadow, down-up or blur (k ≤ 5), noise, JPEG 60–95, one tiny erase ≤ 4% |
| `A2_field_mixup` | A1 + batch MixUp α 0.2, p 0.25, λ ≥ 0.5, off for the last 15% of epochs, Leaf Smut never mixed (`mixup.py`) |

```bash
python tools/aug_grid.py --root <unified>/images/train --out artifacts/aug_grid   # visual check, 6 classes
cd kaggle && kaggle kernels push                                                 # GPU ablation A0/A1/A2
```
