# Project state

_Last updated: 22 Nov 2026 by lead (Claude Code on Masum's PC)._

- Repo scaffolded: `web/` (React + Vite + TS + Tailwind + Vitest), `ml/` (preprocess + tests), CI, PR template, contracts.
- Model: **none yet** (M2 in progress). The app must not show predictions until `web/public/model/` has a real model.
- Live link: not deployed yet (M8).
- Next checkpoint: **CP0 22 Nov 11:00** — every member has cloned, run tests, opened a first PR.

## Open risks
| Risk | Mitigation | Owner |
|---|---|---|
| Scratch model scores modestly | Honest tiers + report; baseline first; pretrained backup only if labelled | Masum |
| Venue Wi-Fi fails | `npm run demo` local build + phone on same hotspot; recorded demo video | Masum |
| Parallel work conflicts | Contracts in `src/ai/types.ts`, own folders, small PRs | Lead |
