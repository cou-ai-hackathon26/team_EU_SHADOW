# AgroLeaf AI — ধানপাতার রোগের প্রাথমিক স্ক্রিনিং

**CoU AI Hackathon 2026 · Team EU_SHADOW · Eastern University, Bangladesh**

A browser-based tool that lets a Bangladeshi rice farmer photograph a leaf and get an honest, Bangla-first first opinion: the likely disease, the two most likely options, or "আমি নিশ্চিত নই" (I am not sure), always with a referral to the Krishi Call Centre **16123**. The AI model is **trained from scratch** by the team and runs **inside the browser**, so the photo never leaves the phone.

> Work in progress (pre-build 21–23 Nov 2026). Sections marked _TBD_ are filled as features merge.

## Team
| Member | Role |
|---|---|
| Md. Masum Akondha | Team lead, AI/ML, inference engine, deployment |
| Tanjil Shaiket | Web app, UX and integration |
| Md. Mehedi Hasan | Bangla content, responsible AI, QA, documentation |

## Problem and solution
_TBD (H8)._ Summary: rice leaf diseases (blast, brown spot, sheath blight, leaf smut, tungro) cut yields; farmers lack a quick, understandable and honest first step. AgroLeaf AI gives a calibrated screening in Bangla and sends uncertain or serious cases to experts.

## Features
See [`docs/FEATURES.md`](docs/FEATURES.md) for the live tracker.

## How the AI works
_TBD (M5/H6)._ Small CNN / MobileNetV3-Small trained from random initialisation on RiceLeafDiseaseBD v3 → temperature-scaled confidence → three answer tiers → class activation map ("why this answer"). Real test results: [`docs/MODEL_REPORT.md`](docs/MODEL_REPORT.md).

## Tech stack
React 19, Vite, TypeScript, Tailwind CSS 4, ONNX Runtime Web (WASM), Vitest, Testing Library · PyTorch, timm (random init), Kaggle GPU · Vercel. Decisions: [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Datasets
- RiceLeafDiseaseBD v3 — Munna MMH et al., Mendeley Data 2026, CC BY 4.0, https://doi.org/10.17632/86s4jzj2m4.3

## AI tools used (disclosure)
| Tool | Used for |
|---|---|
| Claude Code (Anthropic) | Project setup, architecture, code review, tests, merging, documentation help |
| Gemini Antigravity (Google) | Members' feature coding on their own branches |
All AI-assisted code is reviewed, tested and explained by the team.

## Run locally (no internet needed after install)
```bash
cd web
npm ci
npm run demo     # builds and serves on http://localhost:4173 (also reachable from a phone on the same Wi-Fi)
```
Development: `npm run dev` · Tests: `npm test` · ML tests: `cd ml && pip install -r requirements.txt && python -m pytest -q`

## Live link and demo video
_TBD (M8, H8)._

## Credits
_TBD._ All third-party libraries are installed from npm/PyPI under their own licences.

## Disclaimer
AgroLeaf AI is a preliminary screening tool, not a diagnosis. For treatment, contact your local agriculture officer or call **16123**.
