# Rule compliance checklist (CoU AI Hackathon 2026 rule book, revised 12 Nov)

Lead re-checks this before every merge to main and before submission. Last full audit: 23 Nov 2026, 2 AM BST (main at #38).
☑ = checked on that date. ☐ = still to do.

| Rule | Requirement | How we comply | ✓ |
|---|---|---|---|
| 8 | Code only from 21 Nov; no reuse of old projects | New repo; first commit `9a490b9` on 22 Nov 00:19 BST; the earlier AgroLeaf (AIgnite) work was used for ideas only, no code copied | ☑ |
| 9 | Disclose every AI coding tool and model/API | README §7, `docs/CREDITS.md` §5 and `docs/SUBMISSION.md`: Claude Code, Gemini Antigravity, GitHub Copilot, ChatGPT (research only); Microsoft Edge neural TTS for the pre-generated voice clips | ☑ |
| 9 | Real AI only | Predictions come only from `agroleaf.onnx`; mocks only in tests | ☑ |
| 9 | Data public/licensed and credited | 6 datasets (CC BY 4.0 / CC0 / COCO's permissive subset), all in README §6 and `docs/CREDITS.md` | ☑ |
| 10 | One public repo, regular commits from each member's account, no force-push/squash/back-dating | Merge commits only; Masum, Tanjil and Mehedi each commit from their own account; history never rewritten | ☑ |
| 10 | Hourly commits during the final (24 Nov) | Every member commits at least once an hour, 9 AM to 1 PM | ☐ |
| 10 | No keys committed; `.env.example` | No secrets needed; `.env.example` says so; `.gitignore` covers `.env`, `kaggle.json`, `.vercel/`; full-history grep found no keys | ☑ |
| 10 | README items | Team & members, problem/solution, features & AI, stack/models/datasets, AI tools, credits, setup, live link | ☑ |
| 10 | README demo video link | S2 (Tanjil) | ☐ |
| 11 | Public deployment, stays live | Vercel (root `web`) + local fallback `npm run demo` + offline PWA | ☑ |
| 12 | Final submission: ≤150-word description, repo link, live link, AI disclosure, optional ≤3-min video | `docs/SUBMISSION.md` (147-word description, checked by `web/src/docs/s3.test.ts`) | ☑ |
| 13 | Submit at least 10 minutes early | Leader submits by 12:40 PM on 24 Nov | ☐ |
| Privacy | Leaf scanning uses no location; Weather tab uses opt-in GPS rounded to ~1 km (F16 v2) | Scanning has zero location; Weather tab asks for opt-in browser location rounded to 2 decimals (~1 km), sent only to Open-Meteo, stored only in localStorage with division fallback | ☑ |
| Organiser notice | Fully working prototype that runs locally before arriving | `npm run demo` rehearsal without internet | ☐ |
