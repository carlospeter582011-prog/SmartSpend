# SmartSpend — canonical implementation handoff

Date: 2026-11-10 (Africa/Cairo). Version 0.1.0, build 001.
Specification: https://app.notion.com/p/413edc0cac2381328d6ec43d3c8c1737

## Current state

Specification read in full. Repository now exists: https://github.com/carlospeter582011-prog/SmartSpend (public, created by owner). Remote main was inspected: only `README.md` containing `# SmartSpend`, initial commit `9dafed0ba0a6b5cee37958b3e02755ea7af43400`. No existing implementation to preserve. Initial source upload is being prepared through the GitHub connector. NOT deployed.

Phase 0 repository inspection is verified. Phase 1 live infrastructure remains blocked by missing Supabase/Vercel environment configuration. Later code is implemented without representing it as verified complete.

## Implemented source

- Foundation: package/lockfile, tsconfig, Vite, Tailwind, lint, Vitest, Playwright, GitHub CI, Vercel headers/routing, README, environment-name template.
- Original vector identity and 192/512/maskable PNGs, PWA manifest and app-shell service worker.
- Exact monetary parsing/summing, income/expense/transfer records, editable plans, categories, wallet labels, debts/goals, paid/unpaid/canceled bills, opt-in planned installment generation, forecasts, trends, CSV/backups.
- User-scoped Dexie records/queue/preferences, stable IDs, versions/tombstones, mutation coalescing, CAS RPC, explicit conflict decisions, retry and logout clearing.
- Cloud source: Supabase profile trigger, case-insensitive username index, RLS, memberships, hashed 48-hour single-use invites and revocation, explicit share snapshots; server username login, account deletion, consent-bound aggregate AI gateway and provider adapter.
- Auth forms, persistent Supabase sessions, password recovery/settings, onboarding, dashboards, mobile navigation, theme, partial Arabic/RTL, family create/join/share UI.

Exact source inventory: package.json/package-lock.json, tsconfig.json, vite.config.ts, vitest.config.ts, playwright.config.ts, eslint.config.js, index.html, vercel.json, .env.example, .gitignore, .github/workflows/ci.yml; src/{main.tsx,style.css,finance.ts,schedules.ts,storage.ts,client.ts,demo.ts,ai.ts,remote.ts}; api/{_server.ts,login.ts,analyze.ts,delete-account.ts}; public/{logo.svg,icon-192.png,icon-512.png,icon-maskable.png,manifest.webmanifest,sw.js}; tests/{finance.test.ts,storage.test.ts,schedules.test.ts,ai.test.ts,assets.test.ts,e2e/app.spec.ts}; supabase/migrations/{001_smartspend.sql,002_family_management.sql,003_domain_views.sql,004_report_access.sql}; supabase/tests/permissions.sql; docs/GOOGLE_AI.md; README.md and this file.

## Verification actually run

- npm install: success, dependency lock generated; @google/genai 3.0.0 inspected against official current docs.
- TypeScript: passed.
- ESLint: passed after removing an unused import.
- Vitest: 24 tests passed across finance, scheduling, offline persistence/conflicts/isolation and AI schema/fallback. Real cloud integrations are not covered by these unit tests.
- Production build: passed. Bundle-size warning (~1.09 MB raw entry) remains to improve with code splitting.
- PWA PNG dimensions 192/512/512 and manifest maskable declaration passed asset tests.
- Playwright attempted at all eight requested widths. **Browser launch blocked before page checks**, Linux `socket() failed: Operation not permitted`; no viewport results/screenshots were obtained. Vite needed loopback host because 0.0.0.0 network interface enumeration failed in this runtime.
- Shared cloud browser fallback attempted localhost preview; ERR_CONNECTION_REFUSED. Therefore UI, responsiveness, offline shell and installability are **not verified**. Do not invent screenshots or claim E2E passed.
- Supabase permission SQL fixture is provided but NOT RUN. No Supabase URL, keys, project connection or test accounts were supplied.
- Vercel production: NOT RUN. GitHub Actions will start on the initial source push; inspect the actual run before claiming success.
- Gemini: official model listing + structured output inspected; no key, free-tier eligibility/quota or real generation verified. Gateway disabled by default.

## Blockers and exact requirements

1. Repository provisioning is resolved; inspect initial source push and GitHub Actions. Repository is public, so never commit secrets or actual financial data.
2. Supabase project and environment bindings required: public URL/anon configuration plus server-only service-role key in Vercel. Apply migration using phone SQL editor, run isolated permission fixtures and multi-account tests. Never request secrets in chat.
3. Vercel project connected to repository; exact APP_ORIGIN, Auth redirect URLs, email delivery configured. Deployment verification requires actual URL and authenticated tests.
4. Optional Gemini key in server environment, provider quota/tier review, official documented adapter smoke test; no free quota assumed.
5. Browser E2E needs runner allowed to launch Chromium (e.g. GitHub Actions), then resolve observed failures, not merely rerun unmodified tests and assume success.

## Open implementation work (independent of credentials)

- Full Arabic translation (RTL toggle implemented; many labels still English), browser verification of focus trapping/keyboard dialogs and chart data table, slow-network states.
- Logical domain views now added (migration 003, security_invoker). Physical CAS store is unified; verify view RLS in live database.
- Per-wallet balances, explainable spending/anomaly rules, family budgets/assignments/contribution summaries/member management and shared-only AI source added. Live permission tests and richer family charts remain pending.
- Onboarding answer editing and cloud profile restoration added; verify across devices.
- Anchor-aware recurring dates implemented. Separate payment date and transfer balance validation remain pending; attachments optional and absent.
- Bounded adaptive AI onboarding followups, broader semantic output checks (strict request schema and regulated-term rejection added), full auth/session and password reset tests, expired invite and sync replay integration cases.
- Database audit writes and stronger RPC payload validation added; run PostgreSQL/Supabase migration and adversarial tests before production.
- External SIGNED_OUT now clears prior account cache. Verify logout across tabs/token expiry; server rate limit IP accounting and test authentication error timing.
- Bundle splitting, service-worker update interaction and real offline asset verification.

## Next actions in order

Local asset/schema tests passed. Update this handoff only when results or blockers change. Upload the inspected source via connector, then inspect CI and fix any failures. Then live database/auth permissions and deployment verification before checking Phase 1 tasks. Work through all remaining Notion phases with evidence; no complete-project declaration until real deployed flows pass.

## Notion synchronization

Three verified foundation tasks checked in place: official AI documentation/fallback research; TypeScript/design/routing/error/test/CI/README scaffold; original SVG/PWA icon assets. All other checkboxes remain unchecked. Implementation handoff appended to the original specification page with blockers, passed tests and explicitly unsuccessful browser verification.
