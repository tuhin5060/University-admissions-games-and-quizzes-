# ক্যাম্পাস পথে — Admission Practice & Games

A Bangla-first university admission companion restored from the project files shared in this chat.

## Restored content

- **273 English questions across 7 topics** — original question bank, answers, explanations, and source labels retained in `assets/questions.js`.
- Practice mode: learning sessions, immediate explanations, batch sizes of 10/20/30, timed model tests, score review, resume, and local progress backup/import.
- **Tense Express 🚂** — the original fun MCQ game with 20-question rounds, timer, streak bonuses, 50:50/time-freeze lifelines, confetti, sound, CSV export, and a shared leaderboard.
- Eight university profiles, official admission resource links, checklist, campus profiles, light/dark theme, campus images, and search.
- The separate **Previous Year Questions** archive and **Study Guides** sections are intentionally removed from site navigation and routing, as requested. Their practice-relevant question bank remains in the games; no questions were dropped.

## Vercel deployment

- Framework: Other / static site
- Root directory: repository root
- Build command: empty
- Output directory: `.`
- Package dependency: `@vercel/blob` for Tense Express score API (`api/scores.js`)

Required Vercel environment variables:

- `BLOB_STORE_ID` — Blob store ID for the connected Vercel Blob store.
- `BLOB_READ_WRITE_TOKEN` — Blob read/write token. Keep encrypted/sensitive in Vercel environment settings; never commit it or send it to client-side JavaScript.

The API at `GET /api/scores` returns the shared game leaderboard. `POST /api/scores` saves one score as an individual JSON blob in `scores/`, so concurrent submissions do not overwrite one shared file. The question bank and Campus Companion progress do not require Blob; progress for that app remains browser-local. Tense Express leaderboard is shared online through Blob.

## Question editing and checks

Edit `assets/questions.js` to change the 273-question bank. `assets/app.js` contains the English practice and Campus Companion UI. `tense-express/index.html` contains the separate timed game. Do not delete or reword existing questions without a deliberate question-bank review.

Run:

```bash
npm run check
```

This validates JavaScript syntax, all 273 MCQs, all topic routes, practice/test scoring, timeout submission, backup validation, theme behavior, and university content. It is not a substitute for checking the deployed URL on a real mobile browser.