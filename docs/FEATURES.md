# Feature tracker — AgroLeaf AI (CoU AI Hackathon 2026)

Model work (M1–M8) belongs to the team lead. The other 15 features are split equally (5 each), plus one shared deliverable each.
Status: `todo` → `in-progress` → `in-review` (PR open) → `merged` → `verified`. Full spec of each item: `docs/specs/<ID>.md`.
Every item: Understand → Plan → **Tests first** → Implement → PR → Review → Merge (merge commit) → Deploy → Verify.

## Checkpoints (Bangladesh time)
- **CP0 — ২২ নভেম্বর, দুপুর ১২:০০:** সবাই invite accept, repo clone, নিজের PC-তে `npm test` সবুজ, প্রথম feature-এর branch খোলা
- **CP1 — ২২ নভেম্বর, সন্ধ্যা ৬:০০:** Model v0 repo-তে; প্রত্যেকের প্রথম MUST feature merged; ছবি দিয়ে Analyze করলে আসল ফল আসে
- **CP2 — ২২ নভেম্বর, রাত ১১:০০:** সব MUST feature merged; Vercel live link ফোনে কাজ করে
- **CP3 — ২৩ নভেম্বর, দুপুর ১:০০:** সব SHOULD feature merged; final model v1 + report
- **CP4 — ২৩ নভেম্বর, সন্ধ্যা ৬:০০:** FEATURE FREEZE: README, demo video, pitch, local fallback (Wi-Fi ছাড়া) rehearsal

## Model track — Md. Masum Akondha

| ID | Item | Deadline | Branch | Status |
|---|---|---|---|---|
| M1 | Dataset pipeline: পরিষ্কার করা ও ভাগ করা | CP1 | `feat/M1-data-split` | todo |
| M2 | শূন্য থেকে model training (Kaggle GPU) | CP1 (v0), CP3 (v1) | `feat/M2-train` | todo |
| M3 | "ধানপাতা নয়" চেনা (not_rice class) | CP3 | `feat/M3-not-rice` | todo |
| M4 | Calibration: confidence-কে সৎ করা | CP3 | `feat/M4-calibration` | todo |
| M5 | Evaluation ও model report | CP3 | `feat/M5-report` | todo |
| M6 | ONNX export + parity test | CP1 (v0), CP3 | `feat/M6-export` | todo |
| M7 | Browser inference engine (web/src/ai) | CP1 | `feat/M7-engine` | todo |
| M8 | Deployment: Vercel, CI, local fallback | CP2 | `feat/M8-deploy` | todo |

## Md. Masum Akondha

| ID | Feature | Priority | Deadline | Branch | Status |
|---|---|---|---|---|---|
| F11 | "কেন এই উত্তর?" heat-map | SHOULD | CP3 | `feat/F11-heatmap` | todo |
| F12 | "AI কীভাবে কাজ করে" + Accuracy page | MUST | CP3 | `feat/F12-accuracy-page` | todo |
| F13 | নমুনা ছবি gallery (judges-দের জন্য) | SHOULD | CP3 | `feat/F13-sample-gallery` | todo |
| F14 | Offline PWA (install করা যায়) | SHOULD | CP3 | `feat/F14-offline-pwa` | todo |
| F15 | কৃষি কর্মকর্তার জন্য case summary | SHOULD | CP3 | `feat/F15-case-summary` | todo |
| S3 | Pitch ও final submission | MUST | CP4 | `docs/S3-pitch-submission` | todo |

## Tanjil Shaiket

| ID | Feature | Priority | Deadline | Branch | Status |
|---|---|---|---|---|---|
| F1 | App shell ও design system | MUST | CP1 | `feat/F1-app-shell` | todo |
| F2 | ছবি নেওয়া: gallery + camera + preview | MUST | CP1 | `feat/F2-photo-input` | todo |
| F3 | ছবির মান যাচাই (অন্ধকার / ঝাপসা) | MUST | CP2 | `feat/F3-photo-quality` | todo |
| F4 | Analyze flow ও ফলাফলের screen (৪টি tier) | MUST | CP2 | `feat/F4-result-screens` | todo |
| F5 | বাংলা / English toggle | SHOULD | CP3 | `feat/F5-language-toggle` | todo |
| S2 | ৩ মিনিটের demo video | MUST | CP4 | `docs/S2-demo-video` | todo |

## Md. Mehedi Hasan

| ID | Feature | Priority | Deadline | Branch | Status |
|---|---|---|---|---|---|
| F6 | বাংলা + English রোগের card (সূত্রসহ) | MUST | CP1 | `feat/F6-disease-cards` | todo |
| F7 | Safety layer: disclaimer + ১৬১২৩ | MUST | CP1 | `feat/F7-safety-disclaimer` | todo |
| F8 | বাংলায় ফল পড়ে শোনানো | SHOULD | CP3 | `feat/F8-voice-readout` | todo |
| F9 | Scan ইতিহাস (শুধু নিজের ফোনে) | SHOULD | CP3 | `feat/F9-scan-history` | todo |
| F10 | QA: edge-case ছবি সেট + end-to-end test | MUST | CP2–CP4 | `feat/F10-qa-e2e` | todo |
| S1 | README (সব নিয়ম মেনে) | MUST | CP4 | `docs/S1-readme` | todo |
