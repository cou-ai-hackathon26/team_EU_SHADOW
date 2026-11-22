from __future__ import annotations

import sys
from pathlib import Path
import pytest

# Ensure ml/data is in python path
data_dir = Path(__file__).resolve().parent.parent / "data"
if str(data_dir) not in sys.path:
    sys.path.insert(0, str(data_dir))

import build_unified


def test_filename_normalisation():
    assert build_unified.norm("Healthy Leaf") == "healthyleaf"
    assert build_unified.norm("Rice_Leaf-BD_v3 (Annotated)!") == "riceleafbdv3annotated"
    assert build_unified.norm("Blast-01_Crop") == "blast01crop"

    # Test make_filename helper
    fname = build_unified.make_filename("banglariceleaf", "Healthy Leaf", "IMG_001")
    assert fname == "banglariceleaf__healthyleaf__IMG_001.jpg"

    seen = {fname}
    dup_fname = build_unified.make_filename("banglariceleaf", "Healthy Leaf", "IMG_001", sha256="abcdef123456", seen=seen)
    assert dup_fname == "banglariceleaf__healthyleaf__IMG_001_abcdef.jpg"
    assert dup_fname in seen


def test_folder_to_class_mapping():
    sources = build_unified.SOURCES

    # 1. riceleafdiseasebd_v3
    v3_cfg = sources["riceleafdiseasebd_v3"]
    orig, canon = build_unified.find_label(["Original images", "Brown spot", "001.jpg"], v3_cfg)
    assert orig == "Brown spot" and canon == "Brown Spot"
    orig, canon = build_unified.find_label(["Original images", "Leaf smut", "002.jpg"], v3_cfg)
    assert orig == "Leaf smut" and canon == "Leaf Smut"

    # 2. banglariceleaf
    brri_cfg = sources["banglariceleaf"]
    orig, canon = build_unified.find_label(["Leaf Blast", "003.jpg"], brri_cfg)
    assert orig == "Leaf Blast" and canon == "Blast"
    orig, canon = build_unified.find_label(["Healthy Leaf", "004.jpg"], brri_cfg)
    assert orig == "Healthy Leaf" and canon == "Healthy"

    # 3. riceleafbd_realfield
    real_cfg = sources["riceleafbd_realfield"]
    orig, canon = build_unified.find_label(["Tungro Virus", "005.jpg"], real_cfg)
    assert orig == "Tungro Virus" and canon == "Rice Tungro"
    orig, canon = build_unified.find_label(["Bacterial Leaf Blight", "006.jpg"], real_cfg)
    assert orig == "Bacterial Leaf Blight" and canon is None  # Excluded disease

    # 4. bd5_v2
    bd5_cfg = sources["bd5_v2"]
    orig, canon = build_unified.find_label(["Normal_Leaf", "007.jpg"], bd5_cfg)
    assert orig == "Normal_Leaf" and canon == "Healthy"
    orig, canon = build_unified.find_label(["Narrow_Brown_Spot", "008.jpg"], bd5_cfg)
    assert orig == "Narrow_Brown_Spot" and canon is None  # Excluded disease

    # Unmapped
    orig, canon = build_unified.find_label(["random_folder", "009.jpg"], bd5_cfg)
    assert orig is None and canon == "UNMAPPED"


def test_synthetic_split_duplicate_groups_never_cross_splits():
    # Construct a synthetic list of items with duplicate groups
    items = []
    # Group 1: 3 items in Blast (v3)
    for i in range(3):
        items.append({
            "source_id": "riceleafdiseasebd_v3",
            "canonical": "Blast",
            "group": "dg00001",
            "sha256": f"sha_g1_{i}",
        })

    # Group 2: 4 items in Healthy (banglariceleaf)
    for i in range(4):
        items.append({
            "source_id": "banglariceleaf",
            "canonical": "Healthy",
            "group": "dg00002",
            "sha256": f"sha_g2_{i}",
        })

    # Group 3: 2 items in Blast (v3)
    for i in range(2):
        items.append({
            "source_id": "riceleafdiseasebd_v3",
            "canonical": "Blast",
            "group": "dg00003",
            "sha256": f"sha_g3_{i}",
        })

    # Singletons: 30 items
    for i in range(30):
        cls = "Blast" if i % 2 == 0 else "Healthy"
        src = "riceleafdiseasebd_v3" if i % 3 == 0 else "banglariceleaf"
        items.append({
            "source_id": src,
            "canonical": cls,
            "group": f"u{i}",
            "sha256": f"sha_u_{i:03d}",
        })

    # External test items: 10 items from bd5_v2
    for i in range(10):
        items.append({
            "source_id": "bd5_v2",
            "canonical": "Blast",
            "group": f"bd5_{i}",
            "sha256": f"sha_bd5_{i}",
        })

    # Perform split
    split_items = build_unified.split_records(items, seed=42)

    # 1. BD5 items must all be external_test
    bd5_splits = {it["split"] for it in split_items if it["source_id"] == "bd5_v2"}
    assert bd5_splits == {"external_test"}

    # 2. Check no duplicate group crosses splits
    group_splits = {}
    for it in split_items:
        g = it["group"]
        if g not in group_splits:
            group_splits[g] = set()
        group_splits[g].add(it["split"])

    for g, splits in group_splits.items():
        assert len(splits) == 1, f"Duplicate group {g} leaked across multiple splits: {splits}"

    # 3. All items should have a valid split
    valid_splits = {"train", "val", "test", "external_test"}
    for it in split_items:
        assert it["split"] in valid_splits
