# Project state

_Last updated: 23 Nov 2026, 2 AM BST (main at #38 + docs cleanup)._

- **Live:** https://agroleaf-ai-olive.vercel.app (Vercel project `agroleaf-ai`, root `web`, deploys from `main`). Local fallback: `cd web && npm ci && npm run demo`.
- **Model:** `web/public/model/agroleaf.onnx`, version `v2-blend-p2-p3-scratch-gate`, 16.6 MB. Scratch-trained P2 (MobileNetV3-Large-CAM) + P3 (RegNetY-400MF) per-class blend + M3 not-rice gate in one graph. Internal test macro-F1 0.894 (6-class with gate 0.8925). See `docs/MODEL_REPORT.md`.
- **Features:** all MUST and SHOULD features merged (F1–F15, M1–M8, S1, S3). See `docs/FEATURES.md`.
- **Checks on main:** lint clean, 225 web tests pass, build OK.
- **Still open:** S2 demo video (Tanjil). Final day 24 Nov: hourly commits from every member; hard deadline 1:00 PM.

## Open risks
| Risk | Mitigation | Owner |
|---|---|---|
| Photos of a screen score lower (macro-F1 ≈ 0.65) | Tiers + "not sure"; said openly in README and MODEL_REPORT; screen-recapture fine-tune evaluated separately | Masum |
| Venue Wi-Fi fails | PWA works offline after first load; `npm run demo` on a laptop + phone on the same hotspot; demo video | Masum |
| Other crops' leaves pass the gate (~1 in 4) | Stated in MODEL_REPORT; 16123 referral on every result | Masum |
