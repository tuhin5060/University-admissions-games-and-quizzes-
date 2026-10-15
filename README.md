# ক্যাম্পাস পথে — Admission Practice & Games

A Bangla-first university admission companion restored from the project files shared in this chat.

## Restored content

- **273 English questions across 7 topics** — original question bank, answers, explanations, and source labels retained in `assets/questions.js`.
- Practice mode: learning sessions, immediate explanations, batch sizes of 10/20/30, timed model tests, score review, resume, and local progress backup/import.
- **Embedded Fun MCQ Challenge** — game mechanics integrated directly into the same MCQ bank: 10/20/30-question rounds, per-question timer, live points, streak multipliers, 50:50 and Freeze Timer lifelines, sound/emoji celebration, and shared MongoDB leaderboard.
- Eight university profiles, official admission resource links, checklist, campus profiles, light/dark theme, campus images, and search.
- The separate **Previous Year Questions** archive and **Study Guides** sections are intentionally removed from site navigation and routing, as requested. Their practice-relevant question bank remains in the games; no questions were dropped.

## Vercel deployment

- Framework: Other / static site
- Root directory: repository root
- Build command: empty (Vercel serves the static frontend and discovers the `/api` functions)
- Output directory: `.`
- Runtime dependencies: `mongodb`, `@vercel/functions`, `@vercel/analytics`

Required Vercel environment variables:

- `MONGODB_URI` — **Sensitive** MongoDB Atlas connection string; server-side only.
- `MONGODB_DB` — database name, set to `admission_companion`.

MongoDB Atlas Network Access must allow the Vercel deployment to connect. Never commit the URI or include it in browser JavaScript.

The Fun Challenge stores a student profile once using the full name only (no password or roll number). A UUID is saved in browser storage and an HttpOnly cookie; the profile itself is stored in MongoDB, and the leaderboard aggregates the best score per student ID. A stable `attemptId` prevents a retry from duplicating the same submitted round. Other practice history, checklist and saved university items remain local to the browser. The connected Vercel Blob store remains configured but is not the active database for student profiles or leaderboard rows.

The static HTML includes the Vercel Web Analytics script. Enable Web Analytics in the Vercel project dashboard to view traffic reports.

## Question editing and checks

Edit `assets/questions.js` to change the 273-question bank. `assets/app.js` contains the English practice and Campus Companion UI. `tense-express/index.html` is a compatibility redirect to `/#practice`; the game mechanics now live in the core MCQ session. Do not delete or reword existing questions without a deliberate question-bank review.

Run:

```bash
npm run check
```

This validates JavaScript syntax, all 273 MCQs, all topic routes, practice/test scoring, timeout submission, backup validation, theme behavior, and university content. It is not a substitute for checking the deployed URL on a real mobile browser.


## Database and student profiles

The primary database is MongoDB Atlas. Add `MONGODB_URI` as a **Sensitive** Vercel environment variable and `MONGODB_DB=admission_companion`. The URI must stay server-side; never place it in `index.html`, `assets/`, or any browser code. The APIs in `api/profile.js` and `api/scores.js` save registered student profiles and score attempts. The first visit asks for a full name only; a generated student ID is saved in browser storage and an HttpOnly cookie, and the saved profile is restored from MongoDB when possible. Clearing all cookies and site data removes the browser's identity token; name-only recovery cannot reliably distinguish two students with the same name.

- `GET /api/profile`: restore the profile associated with the browser cookie.
- `POST /api/profile`: create or update the student's full name and avatar.
- `GET /api/scores`: return the best score per registered student for the global leaderboard.
- `POST /api/scores`: persist one score attempt, idempotently keyed by `attemptId`.

## Analytics and dependencies

The project uses `@vercel/analytics` for the static-site analytics script and `@vercel/functions` to manage the MongoDB pool in Vercel's runtime. Enable Web Analytics for this project in the Vercel dashboard to view visitor data. Local browser history remains local; registered profiles and Fun Challenge scores are database-backed.

## Recent UX updates

- The home page starts with a simple English MCQ test setup: name, topic, and question count.
- Submitting a test shows the answer key, explanation, Bengali summary, and elapsed time.
- Scores are ranked within each topic; the home leaderboard highlights the highest score and most frequent tester.
- The preparation checklist was replaced with practical daily revision and previous-question tips.
- Chittagong University and Dhaka University profiles include historical context and session-labelled unit information with official source links.
