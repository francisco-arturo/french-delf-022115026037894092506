# Progress — Prototype: french-delf-022115026037894092506

## Current State

- Built **Cedille**, a mobile-first French learning and DELF/DALF exam-prep MVP, on 2026-10-27.
- **Live:** https://french-delf-022115026037894092506.vercel.app (Vercel deployment `dpl_AZzG9CRgnurt3KescMSmbH4Fji8Q`, READY).
- Seeded learner: Léa, B1 candidate, 6-day streak, 68/100 readiness, DELF B1 exam date 12 June 2027.
- Playable: Café survival and At the market, each with vocabulary cards, French browser audio, a listening question with feedback, and a usage quiz.
- Exam studio: DELF B1, DELF B2, and DALF C1 banks, six questions each, five-minute clock, scored result, section breakdown, answer review, and readiness update.
- Level check: five questions with A2/B1/B2 guidance and an honest note that the MVP opens the B1 path.
- Progress and profile views render; daily goal, reminder setting, lesson completion, and exam history persist in `localStorage`.
- Static, dependency-free, Vercel-shaped. Local entrypoint is `dev-server.mjs`; it is excluded from deployment in `.vercelignore`.

## Current Objective

`proto-001` is complete: a client can walk the full daily loop (Today → lesson → completion → exam sprint → score review → progress) without an account or setup step.

## Last Updated

- **Last Updated**: 2026-10-27 (MVP built, verified, pushed, and deployed)
- **Recommended Next Step**: send the proposal with the live URL, then use client feedback to choose `proto-002`.

## What Ran

| Command | Result |
|---|---|
| `node verify.mjs` | 111 checks passed, 0 failed (data model, answer indexes, files, manifest, docs, static routes) |
| `node smoke.mjs` | 24 checks passed; walked lesson, exam, placement, progress, and profile flows; "DOM smoke complete." |
| `powershell -ExecutionPolicy Bypass -File .\init.ps1` | 111 checks passed, 0 failed, exit 0 |
| `node ..\.harness\validate.mjs --target . --min-score 70` | 100/100 after documenting the test command in AGENTS.md |
| `node .harness/gate.mjs` (workspace root) | PASSED: 80 prototypes, all scores above threshold, registry matches disk, workspace gate green |
| `git push -u origin main` | Pushed `8a7a89e` and `2840bef` to the supplied GitHub repository |
| `node .harness/deploy.mjs french-delf-022115026037894092506` | Vercel deployment `dpl_AZzG9CRgnurt3KescMSmbH4Fji8Q`, READY; live alias `https://french-delf-022115026037894092506.vercel.app` |
| Live route check | `/`, `/styles.css`, `/app.js`, `/data.js`, `/manifest.webmanifest`, `/icon.svg` all return 200; HTML contains `Cedille` |
| `node dev-server.mjs` (port 5055) | `GET /` 200, `GET /styles.css` 200, `GET /app.js` 200 |
| Headless Chrome / Edge screenshot | blocked by the agent sandbox (`OpenProcess: Access is denied`); optional QA skipped in favour of the DOM smoke test |

## Verification Evidence

- `node verify.mjs` ended with `111 checks passed, 0 failed.` and exercised `/`, `/styles.css`, `/app.js`, `/data.js`, `/manifest.webmanifest`, and `/icon.svg` over HTTP.
- `node smoke.mjs` ended with `DOM smoke complete.` after asserting dashboard render, market lesson start, listening feedback, completion XP, exam start and perfect-pass result, placement result, progress, profile, and localStorage persistence.
- `.\init.ps1` ended with `=== Verification Complete ===` and exit code 0.
- Local review server is a managed background job on port **5055**. Port 4173 was already occupied by the event-booking prototype, so this prototype uses 5055.
- The live deployment is public and returns 200 for the entry route and all assets. Vercel's auth token had expired on 2026-10-26; `vercel.cmd whoami` refreshed it before deployment.

## Next

1. Send the proposal with the live URL, then use the client's feedback to choose the next slice.
2. `proto-002` is the next product slice: more A2/B2/C2 lessons, recorded speaking with a rubric, a writing workshop, and spaced repetition.

## Blockers

- No current blocker. The live build is public and the repository is pushed.
- Visual screenshot QA could not run inside the agent sandbox; the DOM smoke test covers the functional flow instead.
