# Upskilling

A mobile-first SQL learning app built around practice, understanding, and repeated independent success. It runs in a browser and can be installed on a phone as a progressive web app (PWA).

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

- An adaptive five-question session, or focused practice on a chosen concept.
- **48 questions across 16 concepts**: SELECT, filtering, NULLs, aggregates, inner/self/outer joins, correlated subqueries, CTEs, ranking, window frames, set operations, recursion, indexes, transactions, schema modeling, and combined interview patterns.
- A real SQLite database powered by sql.js/WebAssembly, with sample data and schema exploration.
- SQL grading by result values, with additional fixture rows to catch hardcoded output, missing joins, NULL mistakes, and tie handling. Equivalent queries and different aliases are accepted. Column order matters; row order matters only when specified.
- SQL execution in a disposable Web Worker with a five-second deadline, 500-row result cap, and a read-only database. Practice starts from a fresh fixture each time.
- Concept explanations, hints, worked solutions, and follow-up practice when an answer shows a gap.
- Independent answers contribute to mastery. Hints, notes opened before solving, revealed solutions, and retries after incorrect checks count as guided practice.
- All three distinct questions must be solved independently for a concept to be mastered. An incorrect review removes that question's mastery evidence.
- Weak concepts are prioritized; independently answered concepts return on a growing review interval (up to 30 days).
- Local progress, daily goals, local-calendar streaks, history, and validated JSON export/import.
- Responsive desktop and phone navigation, keyboard support, reduced-motion support, and focus-contained dialogs.
- A PWA manifest, home screen icons, and service worker caching. Previously loaded assets and SQL tools can work offline after an online visit.

## Scope of this version

Adaptation is **rule-based**, with a curated question bank and explanations. There is no LLM integration or generated assessment of free-text answers. Explanations respond to a detected gap at the concept level; the app does not claim to diagnose the learner's exact thought process.

Coding exercises run in **SQLite**. PostgreSQL-specific concurrency behavior is explicitly labeled in theory questions. SQL dialect differences should be considered when using this material for a particular interview.

Progress belongs to this browser and origin. There is no account, server, or automatic synchronization; use backups to move between devices. Clearing browser storage removes local progress. Changing the hosted URL also changes the browser storage origin. The development server does not register the offline service worker.

Mastery is a practice signal for this question bank, not a certification or a guarantee of interview readiness. This first track is a working starting curriculum, not an exhaustive SQL course.

## Project structure

```text
src/
  components/       Overview, path, SQL practice, progress, shared UI
  data/
    curriculum.ts   Concepts, lessons, question bank, reference answers
    database.ts     Schema and visible/additional grading fixtures
  lib/
    progress.ts     Adaptive scheduling, mastery, local progress, validation
    sql-engine.ts   Real SQL execution and result comparison
    sql.worker.ts   WebAssembly engine in an isolated worker
    runner.ts       Worker lifecycle and timeout
    types.ts        Learning domain types
public/             PWA manifest and icons
scripts/            Icon renderer and build-injected service worker template
tests/              Core logic and browser interaction tests
```

React + TypeScript + Vite. The production output is static and can be served from any HTTPS static host. `.openai/hosting.json` retains the private Sites deployment identity.

## Extending the learning system

Add a concept and three independent exercises in `src/data/curriculum.ts`; the path, mastery map, and adaptive scheduler discover them automatically. Keep all question IDs stable because progress references them. A new technical field should have its own curriculum and execution/grading adapter.

For a future AI tutor, add a server-side API rather than placing provider credentials in the client. Keep executable SQL verification as the correctness authority; use the tutor to explain mistakes, generate validated variants, and ask diagnostic follow-up questions. Accounts and durable server-side progress are the next step for automatic mobile/web synchronization. Further SQL coverage can add query-plan labs, engine-specific exercises, gaps and islands, temporal analysis, and mock interview sessions with verbal reasoning.

## References

- [SQLite language reference](https://www.sqlite.org/lang.html)
- [SQLite window functions](https://www.sqlite.org/windowfunctions.html)
- [sql.js API](https://sql.js.org/documentation/)
- [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
