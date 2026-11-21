# Feature tracker — AgroLeaf AI (CoU AI Hackathon 2026)

Status: `todo` → `in-progress` → `in-review` (PR open) → `merged` → `verified` (checked on the live/local build).
Priority: **MUST** = demo fails without it. **SHOULD** = add after all MUST of that owner are merged.
Every feature follows: Understand → Plan → **Tests first** → Implement → Review → Merge (`--no-ff`) → Deploy → Verify.

Checkpoints (Bangladesh time):
- **CP0 — 22 Nov 11:00** everyone cloned, `npm test` + `pytest` green on own PC, first PR opened.
- **CP1 — 22 Nov 17:00** model v0 in `web/public/model/`, upload → analyze → result works end to end.
- **CP2 — 22 Nov 23:00** all MUST features merged; Vercel live link works on a phone.
- **CP3 — 23 Nov 13:00** all SHOULD features merged; final model v1 + report.json.
- **CP4 — 23 Nov 18:00** FEATURE FREEZE. README, demo video, pitch, local fallback rehearsed.

## Masum Akondha — Lead, AI/ML, inference engine, deployment (branches `feat/ml-*`, `feat/api-*`)

| ID | Feature | Pri | Status |
|---|---|---|---|
| M1 | Dataset pipeline: download RiceLeafDiseaseBD v3, remove corrupt files + near-duplicates (pHash), stratified 70/15/15 split with duplicate groups kept together, `split_manifest.csv` + class counts | MUST | todo |
| M2 | Scratch training on Kaggle GPU: small CNN baseline + MobileNetV3-Small (`pretrained=False`), augmentation, checkpoints; choose by validation macro-F1 | MUST | todo |
| M3 | "Not a rice leaf" handling: 7th class `not_rice` from credited public non-rice images + threshold | SHOULD | todo |
| M4 | Calibration: temperature scaling on validation; high/medium/healthy/not-rice thresholds from risk–coverage; written to `model_meta.json` | MUST | todo |
| M5 | Evaluation: test set used once; `report.json` (accuracy, macro-F1, per-class P/R/F1, confusion matrix, coverage) + `docs/MODEL_REPORT.md` | MUST | todo |
| M6 | ONNX export with outputs `logits` + `cam` (GAP→Linear head so CAM is exact); Python↔browser preprocessing parity fixtures | MUST | todo |
| M7 | Browser inference engine `web/src/ai/` (`loadModel`, `analyze`, `decideTier`, softmax/temperature, CAM upsample) with unit tests | MUST | todo |
| M8 | Delivery: Vercel project + CI green, `npm run demo` one-command local fallback, model size budget (< 10 MB) | MUST | todo |

## Tanjil Shaiket — Web app, UX and integration (branches `feat/ui-*`, `feat/integration-*`)

| ID | Feature | Pri | Status |
|---|---|---|---|
| T1 | App shell + design system: mobile-first layout, header, bottom nav, Bangla font, colour tokens, screens (Home, Result, History, About) | MUST | todo |
| T2 | Photo input: gallery upload + phone camera (`capture`), preview, "অন্য ছবি", type/size validation (JPG/PNG/WebP, ≤ 10 MB), EXIF orientation | MUST | todo |
| T3 | Photo quality check: brightness + blur (variance of Laplacian) as a pure function, warning + retake tips (never blocks) | MUST | todo |
| T4 | Analyze flow + result screens: loading state, 4 tiers (high / medium top-2 / low "আমি নিশ্চিত নই" / not rice), confidence meter | MUST | todo |
| T5 | "কেন এই উত্তর?" heat-map overlay toggle on the result photo (uses `Prediction.heatmap`) | SHOULD | todo |
| T6 | Bangla / English toggle; all UI strings in `src/i18n/`, Bangla default, choice remembered | SHOULD | todo |
| T7 | Sample photos gallery for judges (one per class + one non-rice), credited | SHOULD | todo |
| T8 | Installable offline PWA (app shell + model cached), "নতুন সংস্করণ" reload prompt | SHOULD | todo |

## Md. Mehedi Hasan — Content, responsible AI, user features, QA, docs (branches `feat/content-*`, `feat/qa-*`, `docs/*`)

| ID | Feature | Pri | Status |
|---|---|---|---|
| H1 | Bangla + English disease cards `web/src/content/diseases.json` (6 classes + `not_sure` + `not_rice`) with BRRI/DAE/IRRI sources; schema test + banned-words test (no pesticide names, no doses) | MUST | todo |
| H2 | Safety layer: `<Disclaimer/>` on every result, one-tap `tel:16123`, "কৃষি কর্মকর্তার সাথে যোগাযোগ" guidance; test that every tier renders it | MUST | todo |
| H3 | Bangla voice read-out of the result (Web Speech API, `bn-BD`), graceful fallback when no Bangla voice | SHOULD | todo |
| H4 | Officer case summary: downloadable/shareable image (photo, result, tier, date, model version; no location) | SHOULD | todo |
| H5 | Local scan history in IndexedDB: list, view, delete one / delete all; privacy note | SHOULD | todo |
| H6 | "AI কীভাবে কাজ করে" + Accuracy page: reads `report.json`, confusion matrix, limitations, dataset credit, model label | MUST | todo |
| H7 | QA: 30–50 edge-case photo set (each class, blurry, dark, non-rice, huge file), Playwright e2e on 375px + desktop, `docs/TEST_REPORT.md` | MUST | todo |
| H8 | README (all rule-10 items), AI tool disclosure, credits, pitch slides, ≤ 3-min demo video | MUST | todo |
