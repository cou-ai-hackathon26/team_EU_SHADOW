# Rules for AI coding agents (Gemini Antigravity, Claude Code, others)

Read this file and `CLAUDE.md` before writing code. These rules come from the CoU AI Hackathon 2026 rule book; breaking them can disqualify the team.

1. **Stay in your feature.** Only touch files for the feature ID you were given (see `docs/FEATURES.md` and the spec `docs/specs/<ID>.md`). Do not refactor other members' code.
2. **Tests first.** Write the failing tests (`*.test.ts(x)` in `web/`, `tests/test_*.py` in `ml/`), run them and see them fail, then implement until they pass.
3. **Use the contracts.** Import types from `web/src/ai/types.ts`, `web/src/ai/classes.ts`, `web/src/content/types.ts`. Do not change them without the lead's approval.
4. **No fake AI.** Never hard-code, randomise or mock a prediction outside test files.
5. **Safety.** No pesticide/chemical names or doses. Every result screen keeps the disclaimer and 16123. No login, no location, no uploading the photo anywhere.
6. **No old code.** Do not copy from the earlier AgroLeaf AI / AIgnite project or any other repo. Write fresh code. Open-source libraries via npm/pip are fine and must be credited in the README.
7. **Git.** Work on your own branch, small commits like `test: failing tests for F2` then `feat: implement F2`. Never force-push, rebase `main`, squash or amend pushed commits. Never commit `.env`, keys or dataset images.
8. **Before you say "done":** run `cd web && npm run lint && npm test && npm run build` (and `cd ml && python -m pytest -q` if you touched ml/). All must pass.
9. **Explain.** End with a short summary in simple Bangla: what changed, which files, how it was tested, and one sentence the member can tell a judge.
