# AGENTS.md

Angular 18 standalone SPA ("AikichunProgress") — a Wing Chun student-progress tracker. Data lives in Supabase; the built app is statically hosted on Firebase Hosting. An architecture map is available in `architecture.html` / `architecture.json`.

## Commands
- `npm start` — dev server on :4200
- `npm run build` — production build to `dist/aikichun-progress` (default config is `production`)
- `npm test` — Karma/Jasmine; needs Chrome. Only `app.component.spec.ts` exists and it is stale (asserts on a removed `<h1>`), so expect failures.
- No lint or formatter configured. Typecheck: `npx tsc -p tsconfig.app.json --noEmit`
- Deploy: GitHub Actions deploys on push to `master` (live) and on PRs (preview) — see `.github/workflows/`. Firebase project: `aikichun-progress`.

## Architecture
- 100% standalone components, no NgModules. Entry: `src/main.ts` → `app.config.ts` → `AppComponent` (only `<router-outlet>`).
- Routes in `src/app/app.routes.ts`: `/login` (lazy, no guard), `/admin` (lazy, `roleGuard` expects `admin`), `/roadmap` (lazy, `authGuard`). Guards in `src/app/core/guards/`.
- Layering: `src/app/core/` = services/guards/roadmap data; `src/app/features/` = `login`, `roadmap`, `admin-profiles`. All state via `signal`/`computed` + `inject()`; guards are functional.
- Supabase wiring in `src/app/core/services/supabase.service.ts`. Credentials are committed in `src/environments/environment.ts` (URL + publishable key — not a secret; single file, no `.prod`).
- Auth is code-based, NOT Supabase auth: `ADMIN123` hardcoded admin code; students log in with a `code` in the `profiles` table; session restored from localStorage key `aikichun_code`.
- Supabase client uses `persistSession: false` to avoid NavigatorLock issues — keep it.

## Data model
- Tables: `profiles` (`id`, `code`, `name`, `status{learning,developed,skilled}`, `last_update_date`, `updates_count`, `created_at`) and `roadmap_steps`.
- Roadmap hierarchy: Grade (1–4: PROTECTOR/FIGHTER/WARRIOR/MASTER) → Section (Striker/Grappler/Bladesman/Grounder; grade 4 = Mastery) → Level (Alpha/Beta/Omega) → Step. Types in `src/app/core/roadmap/roadmap.data.ts`.
- NOTE: the DB column is `spercentages` (typo, intentional) — `DbRoadmapStep` maps it to `percentage`.
- `RoadmapService` (`src/app/core/roadmap/roadmap.service.ts`) loads `roadmap_steps` in its constructor and replaces the static `ROADMAP_DATA` if any rows come back.

## Business rules
- Locking: a user can view up to 3 steps ahead of their max progress index (`getVisibilityState`).
- Save validation (`validateUpdate`): rate limit gates on `updates_count >= 50` with a 5-day reset (code comment says "3 updates" — reconcile if touching this); max 2 checkbox moves per save.
- Progress: the 3 pointers `status.learning/developed/skilled` hold `stepNumber`s; `getGradeProgress` counts a grade's steps at or below the max pointer index.

## Style & gotchas
- Styling is vanilla CSS + CSS variables in `src/styles.css` (aikido-green `#1a2f23`, aikido-red `#d92027`). Tailwind is installed and configured but NOT used (no `@tailwind`/`@apply` anywhere) — do not add Tailwind classes.
- Roadmap UI is a `ViewState` machine: GRADES → SECTIONS → LEVELS → STEPS with back-navigation; selection components are dumb (@Input/@Output), progress logic lives in `roadmap.component.ts` / `RoadmapService`.
- `SupabaseService` keeps an in-memory `profileCache` (Map); `clearCache()` on logout. Admin edits only update `name`/`code` (popup), not `status`.
- Most content is Arabic; percentages and grade names are English. Keep `stepNumber` values (e.g. `SG1-01`, `SG1-A48`) unchanged — they are the primary keys used for lock/progress logic.
