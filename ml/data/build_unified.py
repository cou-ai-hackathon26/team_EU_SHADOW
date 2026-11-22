"""Build the AgroLeaf AI unified 6-class dataset from extracted source folders.

Steps: scan -> integrity check -> canonical mapping -> SHA-256 + dHash + pHash ->
cross-source duplicate grouping -> drop label conflicts / keep one per group ->
group-aware stratified split (seed 42) -> resized copies + manifests.

Run:  python -I build_unified.py --root F:/dataset_download_merge
Refuses to write into an existing output folder.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import random
import sys
from collections import Counter, defaultdict
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = 200_000_000
CLASSES = ["Healthy", "Blast", "Brown Spot", "Leaf Smut", "Rice Tungro", "Sheath Blight"]
IMG_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}
SEED = 42
MAX_SIDE = 512          # resized training copy; originals stay untouched in raw/
NEAR_DUP_BITS = 6       # pHash AND dHash Hamming distance threshold
MIN_SIDE = 64

# folder name (normalised: lower, no spaces/_/-) -> canonical class, or None = exclude (with reason)
SOURCES = {
    "riceleafdiseasebd_v3": {
        "name": "RiceLeafDiseaseBD v3",
        "doi": "10.17632/86s4jzj2m4.3",
        "url": "https://data.mendeley.com/datasets/86s4jzj2m4/3",
        "licence": "CC BY 4.0",
        "role": "pool",
        "map": {"healthy": "Healthy", "blast": "Blast", "brownspot": "Brown Spot",
                "leafsmut": "Leaf Smut", "ricetungro": "Rice Tungro", "tungro": "Rice Tungro",
                "sheathblight": "Sheath Blight"},
        "skip_dirs": ["visual", "label", "annotation"],
    },
    "banglariceleaf": {
        "name": "BanglaRiceLeaf",
        "doi": "10.7910/DVN/XAOBYW",
        "url": "https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/XAOBYW",
        "licence": "CC0 1.0",
        "role": "pool",
        "map": {"healthyleaf": "Healthy", "healthy": "Healthy", "leafblast": "Blast",
                "sheathblight": "Sheath Blight"},
        "skip_dirs": [],
    },
    "riceleafbd_realfield": {
        "name": "RiceLeafBD (real-field, Sylhet/Dhaka)",
        "doi": "10.17632/kx9rx8p2mz.1",
        "url": "https://data.mendeley.com/datasets/kx9rx8p2mz/1",
        "licence": "CC BY 4.0",
        "role": "pool",
        "map": {"healthy": "Healthy", "healthyleaf": "Healthy", "brownspot": "Brown Spot", "tungrovirus": "Rice Tungro",
                "tungro": "Rice Tungro", "bacterialleafblight": None},
        "skip_dirs": [],
    },
    "bd5_v2": {
        "name": "RiceLeafDisease-BD5 v2 (Savar)",
        "doi": "10.17632/sjkptpgv79.2",
        "url": "https://data.mendeley.com/datasets/sjkptpgv79/2",
        "licence": "CC BY 4.0",
        "role": "external_test",
        "map": {"normalleaf": "Healthy", "normal": "Healthy", "blast": "Blast",
                "sheathblight": "Sheath Blight", "tungro": "Rice Tungro", "narrowbrownspot": None},
        "skip_dirs": [],
    },
}


def norm(s: str) -> str:
    return "".join(ch for ch in s.lower() if ch.isalnum())


def find_label(rel_parts, cfg):
    """Nearest ancestor folder that is a mapping key."""
    for part in reversed(rel_parts[:-1]):
        k = norm(part)
        if k in cfg["map"]:
            return part, cfg["map"][k]
    return None, "UNMAPPED"


def make_filename(source_id: str, original_class: str, stem: str, sha256: str = "", seen: set | None = None) -> str:
    fname = f"{source_id}__{norm(original_class)}__{stem}"[:150] + ".jpg"
    if seen is not None:
        while fname in seen:
            fname = fname[:-4] + "_" + sha256[:6] + ".jpg"
        seen.add(fname)
    return fname


def split_records(final: list[dict], seed: int = SEED, test_ratio: float = 0.15, val_ratio: float = 0.15) -> list[dict]:
    """Group-aware stratified split by (canonical_class, source_id).
    External_test sources are assigned wholly to 'external_test'.
    Whole duplicate groups are kept in one split (no leakage).
    """
    rng = random.Random(seed)
    strata = defaultdict(lambda: defaultdict(list))
    for it in final:
        if SOURCES[it["source_id"]]["role"] == "external_test":
            it["split"] = "external_test"
        else:
            g = it["group"]
            strata[(it["canonical"], it["source_id"])][g].append(it)
    # a group spanning two sources is put in the stratum of its first member
    assigned = {}
    for key in sorted(strata):
        glist = sorted(strata[key].items(), key=lambda kv: kv[1][0].get("sha256", kv[0]))
        rng.shuffle(glist)
        total = sum(len(v) for _, v in glist)
        target = {"test": total * test_ratio, "val": total * val_ratio}
        cnt = {"test": 0, "val": 0, "train": 0}
        for g, members in glist:
            if g in assigned:
                sp = assigned[g]
            elif cnt["test"] + len(members) / 2 <= target["test"]:
                sp = "test"
            elif cnt["val"] + len(members) / 2 <= target["val"]:
                sp = "val"
            else:
                sp = "train"
            assigned[g] = sp
            cnt[sp] += len(members)
            for it in members:
                it["split"] = sp
    # leakage check
    gsplits = defaultdict(set)
    for it in final:
        gsplits[it["group"]].add(it["split"])
    leaks = [g for g, s in gsplits.items() if len(s) > 1]
    assert not leaks, f"leakage in groups {leaks[:5]}"
    return final


def dhash(img: Image.Image) -> int:
    g = np.asarray(img.convert("L").resize((9, 8), Image.LANCZOS), dtype=np.int16)
    bits = (g[:, 1:] > g[:, :-1]).flatten()
    return int("".join("1" if b else "0" for b in bits), 2)


def phash(img: Image.Image) -> int:
    g = np.asarray(img.convert("L").resize((32, 32), Image.LANCZOS), dtype=np.float64)
    n = 32
    k = np.arange(n)
    dct_m = np.cos(np.pi * (2 * k[None, :] + 1) * k[:, None] / (2 * n))
    d = dct_m @ g @ dct_m.T
    low = d[:8, :8].flatten()
    med = np.median(low[1:])
    bits = low > med
    return int("".join("1" if b else "0" for b in bits), 2)


def process(args):
    path, out_tmp = args
    rec = {"path": path}
    try:
        data = Path(path).read_bytes()
        rec["sha256"] = hashlib.sha256(data).hexdigest()
        with Image.open(path) as im:
            im.verify()
        with Image.open(path) as im:
            rec["format"] = im.format
            im = ImageOps.exif_transpose(im)
            im = im.convert("RGB")
            rec["width"], rec["height"] = im.size
            if min(im.size) < MIN_SIDE:
                rec["error"] = f"too small {im.size}"
                return rec
            rec["dhash"] = f"{dhash(im):016x}"
            rec["phash"] = f"{phash(im):016x}"
            arr = np.asarray(im.convert("L").resize((256, 256)), dtype=np.float32)
            lap = arr[1:-1, 1:-1] * 4 - arr[:-2, 1:-1] - arr[2:, 1:-1] - arr[1:-1, :-2] - arr[1:-1, 2:]
            rec["blur_var"] = round(float(lap.var()), 2)
            rec["std"] = round(float(arr.std()), 2)
    except Exception as e:  # corrupt / unreadable
        rec["error"] = f"{type(e).__name__}: {e}"
    return rec


def write_resized(args):
    src, dst = args
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        Path(dst).parent.mkdir(parents=True, exist_ok=True)
        im.save(dst, "JPEG", quality=95)
    return dst


def popcount64(x: np.ndarray) -> np.ndarray:
    x = x.astype(np.uint64)
    c = np.zeros(x.shape, dtype=np.uint8)
    for s in range(0, 64, 8):
        c += POP8[((x >> np.uint64(s)) & np.uint64(0xFF)).astype(np.uint8)]
    return c


POP8 = np.array([bin(i).count("1") for i in range(256)], dtype=np.uint8)


class UF:
    def __init__(self, n):
        self.p = list(range(n))

    def find(self, a):
        while self.p[a] != a:
            self.p[a] = self.p[self.p[a]]
            a = self.p[a]
        return a

    def union(self, a, b):
        a, b = self.find(a), self.find(b)
        if a != b:
            self.p[max(a, b)] = min(a, b)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default="F:/dataset_download_merge")
    ap.add_argument("--out", default="unified")
    ap.add_argument("--workers", type=int, default=max(1, (os.cpu_count() or 2) - 1))
    a = ap.parse_args()
    root = Path(a.root)
    out = root / a.out
    if out.exists():
        sys.exit(f"refusing: {out} exists")
    ext_root = root / "extracted"

    # 1. scan
    items = []
    for sid, cfg in SOURCES.items():
        base = ext_root / sid
        if not base.exists():
            sys.exit(f"missing extracted source {base}")
        for p in sorted(base.rglob("*")):
            if not p.is_file() or p.suffix.lower() not in IMG_EXT:
                continue
            rel = p.relative_to(base)
            if any(any(s in norm(part) for s in cfg["skip_dirs"]) for part in rel.parts[:-1]):
                continue
            orig, canon = find_label(rel.parts, cfg)
            items.append({"source_id": sid, "path": str(p), "original_relative_path": rel.as_posix(),
                          "original_class": orig or "", "canonical": canon})
    print("scanned", len(items), Counter(i["source_id"] for i in items))

    excluded = []
    keep = []
    for it in items:
        if it["canonical"] is None:
            excluded.append({**it, "reason": "class not in 6-class taxonomy (distinct disease)"})
        elif it["canonical"] == "UNMAPPED":
            excluded.append({**it, "reason": "no mappable class folder"})
        else:
            keep.append(it)

    # 2. integrity + hashes
    with ProcessPoolExecutor(a.workers) as ex:
        res = list(ex.map(process, [(it["path"], None) for it in keep], chunksize=16))
    good = []
    for it, r in zip(keep, res):
        it.update({k: v for k, v in r.items() if k != "path"})
        if "error" in r:
            excluded.append({**it, "reason": "unreadable/corrupt: " + r["error"]})
        else:
            good.append(it)
    print("readable", len(good))

    # 3. duplicates: exact sha OR (pHash<=T and dHash<=T)
    n = len(good)
    uf = UF(n)
    by_sha = defaultdict(list)
    for i, it in enumerate(good):
        by_sha[it["sha256"]].append(i)
    for idx in by_sha.values():
        for j in idx[1:]:
            uf.union(idx[0], j)
    ph = np.array([int(it["phash"], 16) for it in good], dtype=np.uint64)
    dh = np.array([int(it["dhash"], 16) for it in good], dtype=np.uint64)
    pairs = []
    for i in range(n - 1):
        dp = popcount64(ph[i + 1:] ^ ph[i])
        dd = popcount64(dh[i + 1:] ^ dh[i])
        hit = np.nonzero((dp <= NEAR_DUP_BITS) & (dd <= NEAR_DUP_BITS))[0]
        for h in hit:
            j = i + 1 + int(h)
            uf.union(i, j)
            pairs.append((i, j, int(dp[h]), int(dd[h])))
    groups = defaultdict(list)
    for i in range(n):
        groups[uf.find(i)].append(i)

    dup_rows = []
    final = []
    for gid, (g, idx) in enumerate(sorted(groups.items())):
        dgid = f"dg{gid:05d}" if len(idx) > 1 else ""
        labels = {good[i]["canonical"] for i in idx}
        for i in idx:
            good[i]["duplicate_group_id"] = dgid
        if len(idx) > 1:
            for i in idx:
                dup_rows.append({"duplicate_group_id": dgid, "source_id": good[i]["source_id"],
                                 "canonical": good[i]["canonical"], "path": good[i]["path"],
                                 "sha256": good[i]["sha256"], "phash": good[i]["phash"], "dhash": good[i]["dhash"],
                                 "group_size": len(idx), "label_conflict": len(labels) > 1})
        if len(labels) > 1:
            for i in idx:
                excluded.append({**good[i], "reason": f"duplicate with conflicting labels {sorted(labels)}"})
            continue
        roles = {SOURCES[good[i]["source_id"]]["role"] for i in idx}
        if len(roles) > 1:
            # same image in a training-pool source and the external test source: drop the external copy
            ext = [i for i in idx if SOURCES[good[i]["source_id"]]["role"] == "external_test"]
            for i in ext:
                excluded.append({**good[i], "reason": "external-test image duplicates a training-pool image"})
            idx = [i for i in idx if i not in ext]
        # exact copies (same SHA-256) -> keep one; near-duplicates are all kept but
        # the whole group goes into ONE split (no leakage)
        by_s = defaultdict(list)
        for i in idx:
            by_s[good[i]["sha256"]].append(i)
        for sh, ii in by_s.items():
            best = ii[0]
            for i in ii[1:]:
                excluded.append({**good[i], "reason": f"exact duplicate (same SHA-256) in {dgid}"})
            good[best]["group"] = dgid or f"u{best}"
            final.append(good[best])
    print("final images", len(final))

    # 4. split: external_test source whole; pool = whole groups, stratified by (class, source)
    split_records(final, seed=SEED)

    # 5. write resized copies
    out.mkdir(parents=True)
    jobs = []
    seen = set()
    for it in final:
        stem = Path(it["original_relative_path"]).stem
        fname = make_filename(it["source_id"], it["original_class"], stem, sha256=it["sha256"], seen=seen)
        rel = Path("images") / it["split"] / it["canonical"] / fname
        it["relative_path"] = rel.as_posix()
        it["filename"] = fname
        jobs.append((it["path"], str(out / rel)))
    with ProcessPoolExecutor(a.workers) as ex:
        list(ex.map(write_resized, jobs, chunksize=16))

    # 6. manifests
    md = out / "metadata"
    md.mkdir()
    cols = ["filename", "relative_path", "split", "canonical_class", "source_id", "source_name", "source_doi",
            "source_url", "source_licence", "original_relative_path", "original_class", "sha256", "width",
            "height", "format", "dhash", "phash", "blur_var", "duplicate_group_id", "group"]
    with open(md / "image_manifest.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, cols)
        w.writeheader()
        for it in sorted(final, key=lambda x: x["relative_path"]):
            s = SOURCES[it["source_id"]]
            w.writerow({**{c: it.get(c, "") for c in cols}, "canonical_class": it["canonical"],
                        "source_name": s["name"], "source_doi": s["doi"], "source_url": s["url"],
                        "source_licence": s["licence"]})
    with open(md / "excluded_images.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, ["source_id", "original_relative_path", "original_class", "canonical", "sha256", "reason"],
                           extrasaction="ignore")
        w.writeheader()
        for e in excluded:
            w.writerow({**e, "canonical": e.get("canonical") or ""})
    with open(md / "duplicate_report.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, ["duplicate_group_id", "group_size", "label_conflict", "source_id", "canonical",
                               "sha256", "phash", "dhash", "path"])
        w.writeheader()
        w.writerows(dup_rows)
    with open(md / "class_mapping.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["source_id", "normalised_folder_name", "canonical_class"])
        for sid, s in SOURCES.items():
            for k, v in s["map"].items():
                w.writerow([sid, k, v or "EXCLUDED"])
    with open(md / "licence_manifest.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["source_id", "name", "doi", "url", "licence", "role", "images_used"])
        used = Counter(it["source_id"] for it in final)
        for sid, s in SOURCES.items():
            w.writerow([sid, s["name"], s["doi"], s["url"], s["licence"], s["role"], used[sid]])

    stats = {
        "seed": SEED, "max_side": MAX_SIDE, "near_dup_bits": NEAR_DUP_BITS,
        "scanned": len(items), "excluded": len(excluded), "final": len(final),
        "excluded_by_source_reason": {f"{k[0]}|{k[1]}": v for k, v in Counter(
            (e["source_id"], e["reason"].split(":")[0].split(" in dg")[0].split(" [")[0].split(" of kept")[0])
            for e in excluded).items()},
        "label_conflicts": {f"{k[0]}|{k[1]}": v for k, v in Counter(
            (e["source_id"], e["canonical"]) for e in excluded if e["reason"].startswith("duplicate with conflicting")).items()},
        "size_by_source": {sid: {"w_median": float(np.median([i["width"] for i in final if i["source_id"] == sid] or [0])),
                                 "h_median": float(np.median([i["height"] for i in final if i["source_id"] == sid] or [0])),
                                 "w_min": min([i["width"] for i in final if i["source_id"] == sid] or [0]),
                                 "blur_median": float(np.median([i["blur_var"] for i in final if i["source_id"] == sid] or [0]))}
                           for sid in SOURCES},
        "raw_by_source_class": {f"{k[0]}|{k[1]}": v for k, v in
                                Counter((i["source_id"], i["original_class"]) for i in items).items()},
        "final_by_split_class": {f"{k[0]}|{k[1]}": v for k, v in
                                 Counter((i["split"], i["canonical"]) for i in final).items()},
        "final_by_source_class": {f"{k[0]}|{k[1]}": v for k, v in
                                  Counter((i["source_id"], i["canonical"]) for i in final).items()},
        "duplicate_groups": sum(1 for g in groups.values() if len(g) > 1),
        "cross_source_duplicate_groups": sum(1 for g in groups.values()
                                             if len({good[i]["source_id"] for i in g}) > 1),
        "label_conflict_groups": sum(1 for g in groups.values() if len({good[i]["canonical"] for i in g}) > 1),
    }
    (md / "dataset_statistics.json").write_text(json.dumps(stats, indent=2), encoding="utf-8")
    print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()
