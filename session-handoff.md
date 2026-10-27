# Session Handoff — Prototype: french-delf-022115026037894092506

## Last Updated

- 2026-10-27 — Cedille MVP built, verified, pushed, and deployed live.

## Current Objective

A mobile-first DELF/DALF study MVP: seeded B1 dashboard, two playable French lessons with listening and vocabulary, timed B1/B2/C1 exam sprints with scored review, a five-question level check, and a progress/profile layer on localStorage.

**Live:** https://french-delf-022115026037894092506.vercel.app  
**Repository:** https://github.com/francisco-arturo/french-delf-022115026037894092506

## Recommended Next Step

1. Send the proposal with the live URL and collect the client's reaction.
2. For the next product slice, implement `proto-002` from `feature_list.json`.

## Files

- `index.html` — app shell, navigation, icon sprite, manifest and stylesheet hooks.
- `styles.css` — responsive editorial design system, mobile tab bar, lesson/exam/progress layouts.
- `data.js` — seeded learner, two lessons, B1/B2 question banks, placement questions.
- `app.js` — hash routing, localStorage state, lesson player, exam timer/scoring, placement, progress, profile.
- `dev-server.mjs` — local static preview on port 5055; excluded from deployment.
- `verify.mjs` — 111-check static and HTTP verification.
- `smoke.mjs` — 24-check DOM-stub walkthrough of the main user flows.
- `manifest.webmanifest`, `icon.svg` — installable mobile metadata.
- `README.md` — product vision, scope, run and verification commands.
- `DEMO.md` — click path, one-sentence pitch, deliberate limits, next scope.
- `init.ps1` / `init.sh` — real verification entrypoints, both calling `verify.mjs`.
- `feature_list.json`, `progress.md` — scope and evidence.

## Decisions

- **No build step.** Plain HTML/CSS/JS keeps the deployment static and the review simple.
- **State in `localStorage`.** No login wall and no backend in the MVP; reset is in Profile.
- **Browser speech synthesis.** Real French audio without a recorded asset pipeline; the transcript is always available.
- **Port 5055.** 4173 was occupied by another prototype's preview, so this build uses a deterministic free port.
- **Honest partial coverage.** The sprint samples listening, reading, language, and writing; speaking is shown in the skill profile but not scored.

## Blockers

- No current blocker.
- Push, deploy, and the live URL are complete.
- Headless screenshots were blocked by the agent sandbox; functional coverage is via `smoke.mjs`.

## Next Session

- If the verification entrypoint is red on arrival, repair that before adding scope.
- Do not create a second directory or a second prototype for this job.
- Keep the demo path in `DEMO.md` truthful when the next feature ships.
- Retirement, if ever needed, goes through the workspace `retire-prototype.ps1`.
