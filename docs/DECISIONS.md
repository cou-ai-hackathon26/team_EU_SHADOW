# Decision log

| # | Date | Decision | Why | Trade-off / what we tell judges |
|---|---|---|---|---|
| D1 | 22 Nov | Run the model **in the browser** (ONNX Runtime Web, WASM) instead of a FastAPI + TensorFlow server | Organisers require a fully working **local** prototype and want Vercel hosting. TensorFlow CPU is far above Vercel's serverless size limit; a static site with in-browser inference deploys to Vercel as-is and runs locally with one command. The photo never leaves the phone (privacy promise), works offline after first load, no cold starts | The proposal said FastAPI. We changed it for reliability and privacy; the model, data, calibration and tiers are unchanged. Model must stay small (MobileNetV3-Small ≈ 6 MB) |
| D2 | 22 Nov | Train with **PyTorch + timm (`pretrained=False`)** instead of Keras | Reliable ONNX export, easy CAM head, same random-initialisation promise | Proposal said Keras `weights=None`; the scratch-training promise is kept |
| D3 | 22 Nov | TypeScript for the web app | Shared contracts (`Prediction`, `DiseaseCard`) let three people build in parallel without breaking each other | Slightly more typing |
| D4 | 22 Nov | Monorepo `web/` + `ml/`, Vercel root dir `web` | One public repo is a rule; simple to judge | — |
| D5 | 22 Nov | Merge commits only (`--no-ff`), no squash/rebase on shared branches | Rule 10: no squashing or rewritten history; per-member attribution stays visible | Busier history |
| D6 | 22 Nov | Heat-map via CAM (GAP → Linear head) exported as a 2nd ONNX output | Exact, cheap explanation in the browser, no gradients needed | Head design is fixed by this choice |
