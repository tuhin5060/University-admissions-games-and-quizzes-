# University Admissions Games & Quizzes

A continuously updated English-practice and university-admission test project for Bangladeshi university applicants.

## Project direction

- **English topic practice:** grammar topics such as Noun & Determiner, Article, Number, Gender, Tense, Pronoun, and other admission-relevant topics.
- **Previous-year question papers:** timed mock tests grouped by university and admission unit, prioritizing verified past questions from DU (Dhaka University) and CU (University of Chittagong).
- **Exam mode:** full-paper simulation with timer, question navigation, answer review, score, and explanations where available.
- **Practice mode:** smaller batches (for example, 10 questions) with immediate feedback and explanations.
- **Leaderboard:** rank by score, with full-name display and optional roll number.
- **Continuous question-bank updates:** add new source PDFs and question sets without duplicating existing questions. Preserve university, year, unit, topic, answer, explanation, and source metadata.
- **No student account/password required** for the current product direction.

## Important current status

The repository was empty when first inspected on 12 October 2026. This repository currently contains project documentation and an upgrade brief; the latest playable HTML file is attached in the ChatGPT conversation as `CU_Admission_English_Practice_Game_v2.html`. Add that file as `index.html` (or split it into app modules) when moving the game source into this repository.

The current HTML version uses browser local storage for progress. Cross-device score history and a shared leaderboard require a database-backed API; do not claim those features work until the database and API are configured and tested.

## Question quality rules

1. Prefer source-confirmed DU/CU previous-year questions.
2. Do not label practice questions as previous-year questions.
3. Reduce repetitive, very easy noun-classification items (proper/common/material/abstract noun).
4. Prioritize applied questions on countability, determiners, noun forms, article usage, irregular plurals, and high-frequency exam patterns.
5. Keep the answer key and explanations aligned with the source; flag uncertain scans instead of guessing.
6. Deduplicate repeated questions while preserving distinct university/year/unit metadata.

## Suggested workflow

1. Add the latest game HTML as `index.html`.
2. Keep questions in a structured JSON file rather than mixing all content into UI code.
3. Validate options and answer indexes whenever the question bank changes.
4. Test practice mode, timed exam mode, result review, responsive layout, and persistence before deployment.
5. Use a server-side API plus a database for shared results. Never put database service-role secrets in client-side code.
