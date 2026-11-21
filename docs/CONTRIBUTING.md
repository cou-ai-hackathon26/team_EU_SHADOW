# How we work (3 members, one repo)

## One-time setup (each member on their own PC)
```bash
git config --global user.name  "Your Name"        # must be YOUR GitHub account
git config --global user.email "you@example.com"  # email linked to YOUR GitHub
git clone https://github.com/masumcit44/AgroLeaf_AI-.git agroleaf-ai
cd agroleaf-ai/web && npm ci && npm test          # must be green
```

## Every feature
```bash
git checkout main && git pull origin main
git checkout -b feat/F2-photo-input               # feat/<ID>-<short-name>
# 1) ask Antigravity to write TESTS FIRST for the feature ID (see AGENTS.md prompt below)
# 2) run them: they must FAIL
# 3) ask Antigravity to implement until tests PASS
cd web && npm run lint && npm test && npm run build
git add -A && git commit -m "test: failing tests for F2"   # then later: git commit -m "feat: implement F2"
git push -u origin feat/F2-photo-input
# open a Pull Request on GitHub into main, fill the template
```
Then tell the lead. The lead (Claude Code) reviews, may push fixes or request changes, and merges with a merge commit.

If `main` moved while you worked: `git checkout main && git pull && git checkout your-branch && git merge main` (merge, never rebase).

## Prompt template for Antigravity
> Read AGENTS.md, CLAUDE.md, docs/FEATURES.md and docs/specs/<ID>.md. Feature **<ID>** only. First write failing tests in <path> covering: <acceptance criteria>. Show me they fail. Then implement in <files> until `npm run lint && npm test && npm run build` pass. Do not touch other features or the contracts. Finish with a Bangla summary.

## Never
`git push --force`, `git rebase main` on a pushed branch, squash merge, committing `.env`/keys/dataset images, copying old project code.

The full guide for each member (Bangla) is in their PDF; feature specs live in `docs/specs/`.
