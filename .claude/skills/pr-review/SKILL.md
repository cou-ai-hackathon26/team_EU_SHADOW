---
name: pr-review
description: Review, test and merge a teammate pull request into main safely. Use when a member says their PR or branch is ready.
---
1. `git fetch origin && git checkout <branch> && git merge origin/main` locally (never rebase). Read the full diff against `origin/main`.
2. Check: scope matches its feature ID; tests were added first and are meaningful; contracts untouched (or agreed); no fake or hard-coded predictions; no pesticide names or doses; disclaimer and 16123 intact; no secrets; nothing copied from the old AIgnite project; accessible Bangla UI.
3. Run `cd web && npm ci && npm run lint && npm test && npm run build` and `cd ml && python -m pytest -q`. Open the app at 375px and desktop for UI PRs.
4. For large PRs, ask the `code-reviewer` and `rules-auditor` agents for a second opinion.
5. Problems: leave numbered review comments (Bangla + English) and request changes. Small fixes: add a separate, explained commit on the branch.
6. Good: `git checkout main && git pull && git merge --no-ff <branch> -m "Merge <ID>: <title>"`, run the checks again, `git push origin main`. Never squash, never force.
7. Run the `deploy-verify` skill. Update `docs/FEATURES.md` and `docs/PROJECT_STATE.md`. Tell the member what was good and what to learn.
