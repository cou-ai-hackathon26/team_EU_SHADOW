---
name: rules-check
description: Audit the repo against the CoU AI Hackathon 2026 rules before a merge to main, before the CP4 freeze, and before final submission.
---
Go through `docs/RULES_COMPLIANCE.md` row by row and verify each with evidence:
- `git log --format='%h %ad %an %s' --date=iso`: all commits on/after 21 Nov 2026, several authors, no rewritten history.
- `git grep -nI -E "(api[_-]?key|secret|token|password)\s*[:=]"` and `.gitignore`: no `.env`, no `kaggle.json`.
- Predictions come only from `web/src/ai/engine.ts`; `git grep -n "Math.random" web/src` finds nothing in result logic.
- README has every rule-10 item and the AI tools section; datasets and libraries are credited.
- The content banned-words test passes; disclaimer and 16123 are visible in every tier.
- If `trainedFromScratch` is false, the label "Temporary Prototype — Pretrained Model" appears in UI, README and pitch.
Report a table: rule, status, evidence, fix needed.
