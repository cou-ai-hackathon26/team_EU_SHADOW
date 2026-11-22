# Rule compliance checklist (CoU AI Hackathon 2026 rule book, revised 12 Nov)

Lead re-checks this before every merge to main and before submission.

| Rule | Requirement | How we comply | ✓ |
|---|---|---|---|
| 8 | Code only from 21 Nov; no reuse of old projects | New repo, first commit 22 Nov; earlier AgroLeaf (AIgnite) used for ideas only | ☐ |
| 9 | Disclose every AI coding tool and model/API | README "AI tools" section: Claude Code (review, scaffolding, tests), Gemini Antigravity (feature coding) | ☐ |
| 9 | Real AI only | Predictions come only from `agroleaf.onnx`; mocks only in tests | ☐ |
| 9 | Data public/licensed and credited | RiceLeafDiseaseBD v3, CC BY 4.0, cited; every extra dataset credited | ☐ |
| 10 | One public repo, regular commits from each member's account, no force-push/squash/back-dating | Branch protection, `--no-ff` merges, hourly commits on 24 Nov | ☐ |
| 10 | No keys committed; `.env.example` | `.gitignore` covers `.env`, `kaggle.json`, `.vercel/` | ☐ |
| 10 | README items | Team & members, problem/solution, features & AI, stack/models/datasets, AI tools, credits, setup, live link, demo video | ☐ |
| 11 | Public deployment, stays live | Vercel (root `web`) + local fallback `npm run demo` | ☐ |
| 12 | Final submission: ≤150-word description, repo link, live link, AI disclosure, optional ≤3-min video | Drafted in `docs/SUBMISSION.md` by 23 Nov | ☐ |
| Privacy | Zero Location / No GPS Tracking (F16) | Farmer picks division from dropdown; only fixed headquarters coordinates sent to Open-Meteo; choice stored in localStorage on device only | ☑ |
| Organiser notice | Fully working prototype that runs locally before arriving | CP4 rehearsal on two laptops without internet | ☐ |
