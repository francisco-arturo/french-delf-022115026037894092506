# Demo — Cedille (french-delf-022115026037894092506)

**One sentence:** A mobile-first DELF/DALF study app that turns a short daily lesson and a timed exam sprint into one visible readiness score.

- **Live URL:** pending approval. Planned host: `https://french-delf-022115026037894092506.vercel.app`
- **Local fallback:** `node dev-server.mjs` → <http://127.0.0.1:5055>
- **Deploy (after approval):** `node .harness/deploy.mjs french-delf-022115026037894092506` from the workspace root
- **Verify:** `node verify.mjs` or `powershell -ExecutionPolicy Bypass -File .\init.ps1`
- **Last verified:** 2026-10-27

## The 60-second path

| # | Do this | The visitor should see |
|---|---|---|
| 1 | Open the local URL | Seeded B1 learner dashboard: 6-day streak, 68/100 readiness, today's "At the market" lesson, exam countdown. |
| 2 | Click "Start today's session" | Three-part lesson: four vocabulary cards with French audio, a listening question, and a usage quiz. |
| 3 | Answer the listening question and check it | Immediate correct/incorrect feedback, transcript reveal, then a completion screen with XP and updated readiness. |
| 4 | Click "Take a timed sprint" or open Exam studio | Six-question DELF B1 sprint with a five-minute clock, no hints, then a score, section breakdown, and answer review. |
| 5 | Open Path → "Check my level" | Five-question placement check and an A2/B1/B2 suggestion. |
| 6 | Open Progress | Readiness trend, skill bars, weekly minutes, lesson and word totals, and exam history. |

## What to say about it

> "This is the daily loop a DELF candidate actually needs: a short lesson, a timed paper, and one clear score that tells them whether they are getting ready."

## What is deliberately fake

- **Seeded learner.** Léa, her 6-day streak, 184 words, 12 lessons, 68/100 readiness, and exam history are sample data in `data.js` / `localStorage`.
- **No account.** There is no auth, payment, tutor, or cloud sync. Progress resets with the "Reset demo data" button.
- **Browser audio.** French listening uses the browser's `speechSynthesis` voice. It is a real pronunciation aid, not a recorded exam track. A browser without a French voice still speaks with the `fr-FR` language tag; the transcript is always available.
- **Practice scoring.** The sprint score is a practice estimate. It is not official DELF/DALF scoring and does not include a human examiner.
- **Partial exam coverage.** The sprint samples listening, reading, language, and writing. Speaking is shown in the skill profile but is not recorded or assessed.
- **Two playable lessons.** Café survival and At the market are complete. The other three path modules are visible roadmap items, clearly locked.

## If something fails while they look

- Open <http://127.0.0.1:5055> again. If the server stopped, run `node dev-server.mjs` from this directory.
- Click "Reset demo data" on Profile to return to the seeded state.
- If audio is silent, check the browser's sound and try Chrome or Edge; the transcript is available on every listening question.

## Not built (next, if the user wants it)

- A full A2/B2 path with more playable lessons.
- Recorded speaking drills with a rubric and playback.
- A writing workshop with model answers and inline corrections.
- Spaced repetition for missed vocabulary.
- Accounts, sync, and a real exam-date plan generator.
