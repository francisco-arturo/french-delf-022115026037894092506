# Cedille

A mobile-first French study app for DELF and DALF candidates. One focused session a day, exam-style practice under the clock, and a readiness score that tells the learner what to do next.

## Product vision

Most French apps stop at streaks and vocabulary. Exam candidates need something different: a daily habit that also teaches them how the paper behaves. Cedille combines short language lessons with timed DELF/DALF sprints, then turns the results into one honest readiness estimate.

The product promise is deliberately small: **one 18-minute session, one visible next step, no decision fatigue.**

## What this MVP does

- **Today** — a seeded B1 learner sees today's lesson, streak, weekly minutes, exam countdown, skill bars, and a clear readiness score.
- **Lesson player** — two complete lessons (Café survival, At the market) with vocabulary cards, browser French audio, listening comprehension, answer feedback, and a completion summary that updates progress.
- **Exam studio** — a five-minute, six-question timed sprint for DELF B1, DELF B2, or DALF C1, covering listening, reading, language, and writing. The result shows a 0–100 score, section breakdown, answer review, and updates readiness.
- **Level check** — a five-question placement flow with A2/B1/B2 suggestions and an honest note that the demo ships one full B1 path.
- **Progress** — readiness trend, skill bars, weekly minutes, lesson and word totals, and exam history.
- **Profile** — daily goal, exam date, reminder preference, level check, demo reset.
- **Mobile shape** — responsive layout with a bottom tab bar, installable manifest, safe-area padding, and no login wall.

State is stored in `localStorage`, so progress survives a refresh in the same browser. The deployment is fully static and Vercel-ready.

## Run locally

```powershell
node dev-server.mjs
```

Open <http://127.0.0.1:5055>.

## Verify

```powershell
node verify.mjs
node smoke.mjs
# or
powershell -ExecutionPolicy Bypass -File .\init.ps1
```

The verifier checks the data model, answer indexes, required files, app wiring, manifest, documentation, and the actual static routes over HTTP. The smoke test loads the app against a small DOM stub and walks the full lesson, exam, placement, progress, and profile flows.

## Stack

- Plain HTML, CSS, and JavaScript. No build step, no dependencies.
- `data.js` holds the seeded learner, lessons, exam banks, and placement questions.
- `app.js` holds state, routing, lesson/exam/placement flows, and French speech synthesis.
- `dev-server.mjs` is local only. `verify.mjs` is verification only. Both are excluded from deployment.

## Deliberately not built

This is an MVP, not a production LMS. There is no account system, payment, tutor marketplace, live speaking assessment, official DELF scoring, or cloud sync. Writing and speaking are sampled in the sprint but not deeply assessed; the interface says so rather than pretending otherwise.

The next build should be: spaced repetition for missed items, a recorded speaking drill with a rubric, a writing workshop with model answers, and accounts plus sync.
