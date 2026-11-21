---
name: bangla-content-safety
description: Write or review Bangla and English disease cards and on-screen advice so they are accurate, sourced and safe. Use for H1, H2 and any user-facing farming advice.
---
- Sources: BRRI (Rice Knowledge Bank, Rice Solution), DAE, IRRI Rice Knowledge Bank. Each card lists at least one URL in `sources`.
- Allowed: symptoms, favourable conditions, general prevention (resistant varieties, balanced fertiliser in general terms, water management, field hygiene, removing infected plants), when to call 16123 or the Sub-Assistant Agriculture Officer.
- Not allowed: pesticide, fungicide or insecticide brand or chemical names, doses, mixing instructions, guaranteed cures.
- Language: short sentences and everyday Bangla words a farmer uses; avoid English jargon. The English text mirrors the meaning.
- The banned-words test (`web/src/content/content.test.ts`) must pass; extend its list when a new risky word appears.
- The `not_sure` and `not_rice` cards give photo tips (one leaf, daylight, close, in focus) and the 16123 referral.
