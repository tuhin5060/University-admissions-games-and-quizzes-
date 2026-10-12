# GPT Upgrade Brief — University Admission English Lab

Use this brief when asking GPT or another coding assistant to upgrade this project. Inspect the existing source first and preserve working features unless a change is explicitly needed.

## Product
A responsive English quiz and previous-year-question practice app for Bangladesh university admission candidates.

## Main user journeys
1. **Topic Practice** — select a topic (Noun & Determiner, Article, Number, Gender, Tense, Pronoun, etc.), then answer a batch of around 10 questions. Show immediate correctness and a concise explanation.
2. **Previous-Year Question Paper** — select university (start with DU and CU), admission unit, and available year; take a timed mock exam that resembles a full question paper.
3. **Test/Exam Mode** — no hints while the test is running; show score, correct answers, explanations, and review after submission.
4. **Leaderboard** — collect full name (required) and roll number (optional); show score/rank and attempt date. Avoid requiring student account/password.
5. **Question-bank maintenance** — add new PDFs/question sets over time, categorized by university, year, unit, topic, and source.

## Data and question quality
- Separate question content from UI, preferably in JSON.
- Recommended fields: id, question, options, correctAnswer, explanation, topic, university, unit, year, sourceType (previous-year/practice), sourcePage, difficulty.
- Label a question as previous-year only when its source supports that label.
- Prioritize DU and CU questions and important exam patterns.
- Reduce trivial, repetitive classification questions such as proper/common/material/abstract noun.
- Include more applied Noun & Determiner questions, countability, uncountable nouns, much/many/little/few/less/fewer, noun forms, articles, irregular plurals, and high-value Number/Gender questions.
- Deduplicate carefully; the same grammar concept may appear in different university/year papers, and those should retain separate source metadata.
- If the scanned source is ambiguous, flag it for review rather than inventing an answer.

## Persistence and privacy
- Current student identity fields: full name required, roll number optional.
- No student authentication/password requirement.
- Local storage is acceptable for a prototype only. It does not sync between devices.
- For shared history/leaderboard, use a database and server-side API. Validate inputs and add abuse protection because unauthenticated public submissions can be spoofed or spammed.
- Never expose service-role keys or database secrets in frontend code.
- Provide a teacher/admin history view only with an appropriate protected admin mechanism.

## Technical expectations
- Preserve a clean mobile-first interface.
- Keep keyboard accessibility and clear focus states.
- Ensure each question has four options where the source format supports MCQ.
- Validate every correct-answer index against the options array.
- Add a build/test checklist and clear deployment instructions.
- Keep changes incremental and document each question-bank update.
- Do not claim a feature is deployed or database-backed unless it has been configured and tested.

## Current source file
The latest HTML file from the ChatGPT conversation is `CU_Admission_English_Practice_Game_v2.html`. Copy it into this repository as `index.html` before making code-level changes. The current repo was empty when checked on 12 October 2026, so the HTML has not yet been committed here.
