---
name: tdd-feature
description: Implement one feature from docs/FEATURES.md test-first (Understand, Plan, failing tests, implement, green, PR). Use when asked to build or improve a feature by ID (M*, T*, H*).
---
1. **Understand**: read the feature row in `docs/FEATURES.md`, the contracts (`web/src/ai/types.ts`, `web/src/content/types.ts`) and the current code it touches. Say in 2–3 Bangla lines what it does for the farmer.
2. **Plan**: list files to add/change, acceptance criteria (3–6 bullets), and possible regressions (which existing tests/screens could break).
3. **Branch**: `git checkout main && git pull && git checkout -b <prefix>/<short-name>`.
4. **Tests first**: write tests for every acceptance criterion; run `npm test` (or `pytest`) and confirm they FAIL for the right reason.
5. **Implement** the minimum to pass. Keep pure logic in plain functions (easy to test), UI in components.
6. **Verify**: `cd web && npm run lint && npm test && npm run build`; for UI, check 375px and desktop in the browser.
7. **Commit** small, conventional messages ending with the feature ID; push; open a PR with the template.
8. Update `docs/FEATURES.md` status to `in-review`. Explain the change in simple Bangla plus one judge talking point.
