---
name: deploy-verify
description: Deploy web/ to Vercel and smoke-test the live and local builds. Use after every merge to main and before submission.
---
1. The Vercel project root is `web/` (framework Vite, build `npm run build`, output `dist`). Production deploys from `main` through the GitHub integration; manual fallback: `cd web && vercel --prod`.
2. Smoke-test the live URL at 375px and desktop: page loads, model loads (`agroleaf.onnx` returns 200), a sample photo gives a result, the "not sure" tier and disclaimer/16123 render, no console errors.
3. Local fallback: `cd web && npm run demo`, open `http://localhost:4173`, and open it from a phone on the same hotspot via the LAN IP. After the first load, turn Wi-Fi off and confirm it still works (once T8 is merged).
4. Record the URL, commit hash and result in `docs/PROJECT_STATE.md`.
