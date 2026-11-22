# AgroLeaf AI Dataset Pipeline (M1)

This directory contains the dataset preparation and merging pipeline code for creating the unified 6-class rice leaf disease dataset.

Kaggle Dataset Build Notebook: `mdmasumakondha/agroleaf-unified-dataset-build` (Version 2)  
Mounted at `/kaggle/input/agroleaf-unified-dataset-build/unified/` for training notebooks.

---

## Scripts

### 1. `build_unified.py`
Local/bare-metal pipeline script for processing downloaded raw datasets:
- **Integrity & Validation**: Scans all image files, verifies EXIF orientation, filters corrupt files and images smaller than 64 px.
- **Taxonomy Mapping**: Maps disparate directory and class naming conventions to the canonical 6-class taxonomy. Excludes distinct non-target diseases (e.g., Bacterial Leaf Blight, Narrow Brown Spot) and non-image artifacts (YOLO annotations, visual overlays).
- **Deduplication**: Computes SHA-256 for exact duplicates, and pHash + dHash (Hamming distance $\le 6$ bits) for perceptual near-duplicates using a Disjoint Set Union (Union-Find) algorithm. Excludes duplicate groups with conflicting diagnostic labels.
- **Stratified Split**: Splits dataset with `seed=42`, stratified by `(class, source)` into ~70% train, 15% val, 15% test. Whole duplicate groups are assigned to a single split to eliminate data leakage.
- **Standardized Export**: Resizes images to max 512 px on longest edge (JPEG quality 95), retaining original images in raw storage. Generates detailed CSV manifests (`image_manifest.csv`, `excluded_images.csv`, `duplicate_report.csv`, `class_mapping.csv`, `licence_manifest.csv`) and `dataset_statistics.json`.

### 2. `agroleaf_merge.py`
The cloud-native Kaggle kernel version of the merge pipeline executed in `agroleaf-unified-dataset-build`:
- Runs inside the Kaggle environment to merge datasets directly from Kaggle input archives into the unified dataset artifact.
- Implements parallel multiprocessing for fast hash computation, verification, and image resizing.

---

## 4 Official Data Sources

All datasets were downloaded from their official repositories with verified checksums:

| source_id | Dataset Name | DOI / Persistent ID | Licence | Role |
|---|---|---|---|---|
| `riceleafdiseasebd_v3` | RiceLeafDiseaseBD v3 (Gazipur, 2025) | [10.17632/86s4jzj2m4.3](https://doi.org/10.17632/86s4jzj2m4.3) | CC BY 4.0 | train/val/test pool |
| `banglariceleaf` | BanglaRiceLeaf (BRRI Gazipur) | [10.7910/DVN/XAOBYW](https://doi.org/10.7910/DVN/XAOBYW) | CC0 1.0 | train/val/test pool |
| `riceleafbd_realfield` | RiceLeafBD real-field (Sylhet/Dhaka) | [10.17632/kx9rx8p2mz.1](https://doi.org/10.17632/kx9rx8p2mz.1) | CC BY 4.0 | train/val/test pool |
| `bd5_v2` | RiceLeafDisease-BD5 v2 (Savar, 2024) | [10.17632/sjkptpgv79.2](https://doi.org/10.17632/sjkptpgv79.2) | CC BY 4.0 | external test only |

*Note on CC BY 4.0 Notice of Changes*: Images were resized to max 512 px longest side with JPEG quality 95, EXIF orientation normalized, and folders mapped to the canonical 6 classes. Originals remain unmodified at their respective DOIs.

---

## Split Protocol

- **Random Seed**: `42`
- **Internal Pool**: Stratified by `class × source` into approximately **70% train / 15% validation / 15% test**.
- **No Data Leakage**: Whole duplicate and near-duplicate groups (exact SHA-256 or perceptual hash match) are strictly assigned to the same split. Leakage checks are asserted during generation.
- **External Test Set**: `bd5_v2` (RiceLeafDisease-BD5 v2) is kept entirely as an out-of-distribution external test benchmark (`external_test`, 2,671 images) and is never included in the training or validation splits.

---

## Canonical 6-Class Taxonomy

1. **Healthy**
2. **Blast**
3. **Brown Spot**
4. **Leaf Smut**
5. **Rice Tungro**
6. **Sheath Blight**

### Final Counts (15,337 total images)

| Class | train | val | test | external_test (BD5) |
|---|---|---|---|---|
| Healthy | 1,551 | 334 | 333 | 834 |
| Blast | 1,673 | 359 | 359 | 720 |
| Brown Spot | 1,750 | 376 | 376 | 0 |
| Leaf Smut | 503 | 108 | 108 | 0 |
| Rice Tungro | 1,916 | 410 | 410 | 494 |
| Sheath Blight | 1,470 | 315 | 315 | 623 |
| **Total** | **8,863** | **1,902** | **1,901** | **2,671** |
