# Upskilling

A mobile-first database learning app built around SQL practice, database theory, and repeated independent success. It runs in a browser and can be installed on a phone as a progressive web app (PWA).

## Run locally

Use Node.js 22.12+ (Node 24 LTS is recommended).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. To test on a phone on the same Wi-Fi network, use the printed Network URL. Installing the PWA and offline caching require HTTPS or localhost; an ordinary HTTP LAN URL is suitable for testing the responsive interface.

```sh
npm test           # Curriculum, real SQL grading, adaptation, and backups
npm run build     # TypeScript checks and production build
npm run preview   # Serve the production build
npm run test:e2e  # Full browser flows at desktop and iPhone viewport sizes
TEST_PRODUCTION=1 npx playwright test pwa.spec.ts # Offline SQL and execution timeout
```

Browser tests use locally installed Google Chrome. To use Playwright's Chromium instead, install it with `npx playwright install chromium` and remove `channel: 'chrome'` from `playwright.config.ts`.

## What works

- A **database theory track with 40 lessons and 120 questions** across design, modelling, normalization, SQL reasoning, database internals, transactions, and operations.
- A source library mapping **all 16 chapters and three appendices** of BCcampus's _Database Design, 2nd Edition_ and **all eight major sections** of _Architecture of a Database System_ to lessons. Read the source alongside the app for the complete treatment and further exercises.
- Each theory lesson offers a simpler explanation, an original worked example, a three-step breakdown, a common mistake, and a self-explanation prompt. Wrong answers automatically open the simpler explanation; learners can request the other explanations or retry.
- Focused three-question theory practice and mixed five-question review. Missed and guided concepts stay due until the previously missed/guided questions have a later independent answer. Correctly answering a different question does not hide an unresolved gap. Independent answers grow review intervals up to 30 days; incorrect reviews remove that question's mastery evidence.
- Theory reading alone grants no mastery. Opening help before answering and retrying a revealed answer count as guided practice. Three distinct independently answered questions establish lesson mastery for this question bank.
- SQL and theory share the daily goal, streak, activity history, validated export/import, and offline bundle. Existing SQL-only version 1 progress remains compatible; theory uses stable `db-` identities and does not enter the SQL practice queue.
- An adaptive five-question session, or focused practice on a chosen concept.
- **48 questions across 16 concepts**: SELECT, filtering, NULLs, aggregates, inner/self/outer joins, correlated subqueries, CTEs, ranking, window frames, set operations, recursion, indexes, transactions, schema modeling, and combined interview patterns.
- A real SQLite database powered by sql.js/WebAssembly, with sample data and schema exploration.
- SQL grading by result values, with additional fixture rows to catch hardcoded output, missing joins, NULL mistakes, and tie handling. Equivalent queries and different aliases are accepted. Column order matters; row order matters only when specified.
- SQL execution in a disposable Web Worker with a five-second deadline, 500-row result cap, and a read-only database. Practice starts from a fresh fixture each time.
- **16 short lessons and 32 understanding checks**, available from the learning path and practice help. Each lesson includes a mental model, a SQL example, practical tips, a common mistake, and an official reference.
- Understanding checks explain both correct and incorrect answers and allow retries. They are learning aids, do not affect mastery or daily goals, and reset when the lesson is closed. Opening help during an unsolved exercise still makes that exercise guided practice.
- Concept explanations, hints, worked solutions, and follow-up practice when an answer shows a gap.
- Independent answers contribute to mastery. Hints, notes opened before solving, revealed solutions, and retries after incorrect checks count as guided practice.
- All three distinct questions must be solved independently for a concept to be mastered. An incorrect review removes that question's mastery evidence.
- Weak concepts are prioritized; independently answered concepts return on a growing review interval (up to 30 days).
- Local progress, daily goals, local-calendar streaks, history, and validated JSON export/import.
- Responsive desktop and phone navigation, keyboard support, reduced-motion support, and focus-contained dialogs.
- A PWA manifest, home screen icons, and service worker caching. Previously loaded assets and SQL tools can work offline after an online visit.

## Scope of this version

Adaptation is **rule-based**, with a curated question bank and explanations. There is no LLM integration, open-ended chat, or generated assessment of free-text answers. Self-explanation prompts are for reflection, not automatically graded responses. Explanations respond to a detected gap at the concept level; the app does not claim to diagnose the learner's exact thought process.

The theory track is an original **study guide**, with introductions and questions for every mapped chapter or major section. It does not reproduce every paragraph, proof, subtopic detail, or exercise from the books. Book coverage is visible under **Database theory → Books & coverage**. The sources are authoritative educational resources, not a formal industry certification standard. The architecture monograph dates to 2007, so product-specific behavior should be checked against current engine documentation; the app links to official PostgreSQL references for isolation, logging, and replication.

Coding exercises run in **SQLite**. PostgreSQL-specific concurrency behavior is explicitly labeled in theory questions. SQL dialect differences should be considered when using this material for a particular interview.

Progress belongs to this browser and origin. There is no account, server, or automatic synchronization; use backups to move between devices. Clearing browser storage removes local progress. Changing the hosted URL also changes the browser storage origin. The development server does not register the offline service worker.

Mastery is a practice signal for this question bank, not a certification or a guarantee of interview readiness. This first track is a working starting curriculum, not an exhaustive SQL course.

## Project structure

```text
src/
  components/       Overview, path, SQL practice, progress, shared UI
  data/
    curriculum.ts   Concepts, lessons, question bank, reference answers
    lessons.ts      Mini lessons, tips, common mistakes, understanding checks
    theory*.ts      Theory lessons, original question bank, books, coverage map
    database.ts     Schema and visible/additional grading fixtures
  lib/
    progress.ts     Adaptive scheduling, mastery, local progress, validation
    theory-progress.ts Theory-specific question selection, mastery, review queue
    sql-engine.ts   Real SQL execution and result comparison
    sql.worker.ts   WebAssembly engine in an isolated worker
    runner.ts       Worker lifecycle and timeout
    types.ts        Learning domain types
public/             PWA manifest and icons
scripts/            Icon renderer and build-injected service worker template
tests/              Core logic and browser interaction tests
```

React + TypeScript + Vite. The production output is static and can be served from any HTTPS static host.

## Deploy to Vercel

The app runs independently of ChatGPT Sites. No API keys, server, or environment variables are required. The tracked `vercel.json` selects Vite, installs with `npm ci`, builds with `npm run build`, and serves `dist/`. It also makes the service worker revalidate so browsers can pick up app updates. Navigation uses URL hashes, so no SPA path rewrite is needed.

From this checkout, deploy with the Vercel CLI:

```sh
npx vercel login
npx vercel --prod
```

Choose the Vercel account/team, create or select the project, and use this directory as the project root. `.vercel/` stores the local project link and is ignored by Git. `.vercelignore` excludes the previous Sites metadata and local development artifacts from uploads.

For automatic deployments, push the app to GitHub and import `DarkoIOSG/Upskilling` at [Vercel New Project](https://vercel.com/new). Keep the root directory at the repository root; the checked-in configuration supplies the build settings. Vercel's [Vite deployment documentation](https://vercel.com/docs/frameworks/frontend/vite) describes the supported framework setup.

Before moving from the old URL, open **Settings → Export backup** in the old app. At the new Vercel URL, use **Settings → Import backup** to restore your progress. Progress is stored per browser and origin and does not transfer automatically. Use the stable production URL for daily learning and PWA installation.

The previous private Sites deployment identity remains in `.openai/hosting.json`; Vercel does not use it. Deploying to Vercel does not remove the old deployment or transfer its access restrictions.

## Extending the learning system

Add a concept and three independent exercises in `src/data/curriculum.ts`, plus its mini lesson in `src/data/lessons.ts`; the path, mastery map, and adaptive scheduler discover them automatically. Each mini lesson needs two tips, a common mistake, two understanding checks with explanations, and an official reference. Keep all question IDs stable because progress references them. A new technical field should have its own curriculum and execution/grading adapter.

For a future AI tutor, add a server-side API rather than placing provider credentials in the client. Keep executable SQL verification as the correctness authority; use the tutor to explain mistakes, generate validated variants, and ask diagnostic follow-up questions. Accounts and durable server-side progress are the next step for automatic mobile/web synchronization. Further SQL coverage can add query-plan labs, engine-specific exercises, gaps and islands, temporal analysis, and mock interview sessions with verbal reasoning.

Theory lessons are defined in `src/data/theory-design.ts` and `src/data/theory-systems.ts`, with their source units in `src/data/theory-sources.ts`. Keep the lesson and question ids stable because saved progress refers to them. Each lesson needs three distinct checks and separate simple, worked-example, and step-by-step explanations. Unit tests enforce chapter mapping and verify remediation, review intervals, and backup compatibility; desktop/mobile browser tests exercise every lesson, guided retries, shared backups, and offline theory practice.

## References

- [Database Design, 2nd Edition](https://opentextbc.ca/dbdesign01/) — Adrienne Watt and Nelson Eng, BCcampus, 2014. CC BY 4.0 except where otherwise noted. The app adapts the topic structure with rewritten explanations and original examples/questions. [License](https://creativecommons.org/licenses/by/4.0/).
- [Architecture of a Database System](https://dsf.berkeley.edu/papers/fntdb07-architecture.pdf) — Joseph M. Hellerstein, Michael Stonebraker, and James Hamilton, 2007, DOI 10.1561/1900000002. Author-hosted free reading; copyright retained by the authors. The PDF is linked, not redistributed. [MIT course reading assignment](https://ocw.mit.edu/courses/6-830-database-systems-fall-2010/pages/readings/lec4/).
- [SQLite language reference](https://www.sqlite.org/lang.html)
- [SQLite window functions](https://www.sqlite.org/windowfunctions.html)
- [sql.js API](https://sql.js.org/documentation/)
- [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [PostgreSQL write-ahead logging](https://www.postgresql.org/docs/current/wal-intro.html)
- [PostgreSQL replication solutions](https://www.postgresql.org/docs/current/different-replication-solutions.html)
