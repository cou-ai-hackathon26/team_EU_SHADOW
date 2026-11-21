---
name: pr-review
description: Review, test and merge a teammate pull request into main safely. Use when a member says their PR or branch is ready.
---
1. Find the PR: `gh pr list`, then `gh pr view <n>` and `gh pr checks <n>`. Check it out with `gh pr checkout <n>`, run `git merge origin/main` (never rebase), and read the full diff: `gh pr diff <n>`. Compare against the spec `docs/specs/<ID>.md`.
2. Check: scope matches its feature ID; tests were added first and are meaningful; contracts untouched (or agreed); no fake or hard-coded predictions; no pesticide names or doses; disclaimer and 16123 intact; no secrets; nothing copied from the old AIgnite project; accessible Bangla UI.
3. Run `cd web && npm ci && npm run lint && npm test && npm run build` and `cd ml && python -m pytest -q`. Open the app at 375px and desktop for UI PRs.
4. For large PRs, ask the `code-reviewer` and `rules-auditor` agents for a second opinion.
5. Problems: `gh pr review <n> --request-changes --body "<numbered points, Bangla + English>"`. Small fixes: push a separate, explained commit to the branch.
6. Good: `gh pr review <n> --approve --body "<what was good>"`, then `gh pr merge <n> --merge` (merge commit). Never squash, never force. Then `git checkout main && git pull`.
7. Run the `deploy-verify` skill. Update `docs/FEATURES.md` and `docs/PROJECT_STATE.md`. Tell the member what was good and what to learn.
