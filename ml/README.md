# ml/ — training, calibration and export (owner: Masum)

```bash
cd ml
python -m pip install -r requirements.txt
python -m pytest -q
```

Training runs on Kaggle GPU (`requirements-train.txt`). Outputs go to `web/public/model/` via `export.py`.
Rule: the final model is trained from random initialisation (`pretrained=False`). Never commit dataset images or Kaggle keys.
