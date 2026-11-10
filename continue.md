# Latest verified release — real name and unique username, 2026-11-10

Production https://smartspend-save.vercel.app is READY as dpl_3rLww3XkdNaFBhcGhqGSBaY6RMJG on implementation f82491c476dced28b80b3e18c5ec00de7086ee0c. Root/status HTTP 200, database ready. Supabase migration profile_real_name was applied after deploying the UI; live rollback identity.sql AND permissions.sql passed, and zero synthetic Auth users remained. Confirmed real_name column and case-insensitive unique username index. New Auth signups require the real name. Existing accounts preserve data and may fill their real name in Settings; names are displayed on mobile/desktop, usernames/email are for login. No identity or financial rows were printed.

CI https://github.com/carlospeter582011-prog/SmartSpend/actions/runs/42894275373 passed TypeScript, lint, 50 tests (including server username/email login mocks, name validation, signup metadata and logout identity isolation), four emitted API imports, production build, 18 browser tests and SQL uniqueness/RLS tests on both migrated and combined-setup databases. Downloaded and visually reviewed 360px portrait and 1440px landscape signup screenshots. Security advisors retain the same intentional server-only quota-table INFO and seven guarded SECURITY DEFINER RPC WARN notices; no claim of warning-free review. References: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy and https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable .

Synthetic SQL and mocked login checks do not verify email delivery/confirmation or real account Auth/session/recovery end-to-end. Remaining project scope below still applies. AI remains disabled with three configured Google keys; no key values were read and no live Google generation was run.

# Latest verified release — button overlap fix, 2026-11-10

Live https://smartspend-save.vercel.app . Implementation e5ffadc27ce1f21d5944b5b63c6205cf73acee03 is deployed READY as dpl_8zFwwRTrpdkkFZU3vBoJaTz5jBFV. Root and /api/status HTTP 200, database ready; AI disabled with three configured keys, values never retrieved. CI https://github.com/carlospeter582011-prog/SmartSpend/actions/runs/42892081928 passed TypeScript, lint, 44 unit/component tests, emitted API import smoke, build, all 16 Chromium browser cases and SQL migration/permission tests. Downloaded and visually reviewed mobile Plans/Settings LTR+RTL, desktop Settings, and compact mobile dashboard screenshots. Earlier password eyes, eight-character app minimum, confirmation and per-visit install suggestion remain included.


## Remaining work after this release

Implemented but still requiring live end-to-end verification: signup/email confirmation, username/email login, session restoration/expiry, password recovery/change and actual Supabase Auth Site URL/redirect/password policy; offline queue/conflict replay and multi-device sync; family creation/invites/roles/sharing/budgets with separate real test accounts; actual Google key/model generation/fallback/caching/quotas and error responses; Android PWA install/update/relaunch. Backend database readiness is not proof these flows work.

Implementation gaps still open: complete Arabic translations, adaptive AI onboarding follow-up questions, richer shared family charts, separate actual payment dates, sufficient-balance validation for transfers, client bundle splitting/performance, broader accessibility and security regression review. Do not mark the full project complete from passing demo UI/SQL tests. Google keyCount=3 is configuration presence only; AI_ENABLED remains false and actual Google key validity is not yet tested. Supabase Auth Dashboard configuration is unavailable through the connector and must be verified by the owner or an authenticated dashboard session.

# Latest release — password controls and PWA suggestion, 2026-11-10

Live: https://smartspend-save.vercel.app . Implementation 094d36c327a96bb7c5bea90c9cb130dcd71760bc deployed READY as dpl_6pTCc7FYV4iaCMQGebC7wWmeVTnY. Verified 44 tests + 12 browser cases (mobile portrait and desktop landscape), Node API import smoke, build, and SQL permissions: https://github.com/carlospeter582011-prog/SmartSpend/actions/runs/42854787060 . Root/status HTTP 200; database ready. Latest live status now reports three configured Google keys (values never read), AI_ENABLED remains false; live Google model calls remain unverified. This supersedes the earlier keyCount 0 status below.

New passwords require at least eight characters and matching confirmation in the app; independent show/hide eyes cover login/signup/password change. Install suggestion appears per page load, can be dismissed for that visit, and is hidden in standalone display mode; native install only after a click, with browser-menu fallback. Supabase Auth server policy and real account flows remain unverified; connector cannot change the policy. Earlier project gaps below remain open.

# Current verified status — 2026-11-10

Production: https://smartspend-save.vercel.app . Current implementation commit 1007330dad33da11e2864bb1bf9244e35efb9f33. Vercel production deployment dpl_29JSLJV4gRSvChWQ8z81qYLpprFD is READY. Live GET /api/status returned HTTP 200: database ready, AI disabled, keyCount 0, default models gemini-3.8-flash and gemini-3.5-flash-lite. Probe uses HEAD against server-only rate_buckets, validating the configured backend key can access the required table without returning rows. This does not verify Auth redirects, sessions, family UI or multi-device sync.

Latest CI: https://github.com/carlospeter582011-prog/SmartSpend/actions/runs/42841955814 — verify and database PASSED, including 36 unit/component tests, emitted Node ESM import smoke test for all four API handlers, production build, 10 browser tests covering mobile portrait/desktop landscape/RTL/offline, migrations and permissions. Initial live probe exposed extensionless ESM imports; fixed all API imports with .js and added the actual emitted-handler smoke test to CI. Local typecheck, lint, 36 tests, API smoke test and build also passed. Large client bundle warning remains.

Owner actions still required: configure Supabase Auth Site URL https://smartspend-save.vercel.app and allowed redirects https://smartspend-save.vercel.app/ plus https://smartspend-save.vercel.app/?recovery=1 in Dashboard. Supabase connector cannot inspect/change these settings. Add Google keys privately in Vercel Production as Sensitive GEMINI_API_KEYS, recommended JSON array; no keys in chat or source. After credentials exist, test actual Google generation before enabling AI_ENABLED=true. Current key count is zero; live AI generation and fallback remain unverified. Remaining application scope and end-to-end Auth/sync/family checks below are still open. Historical entries below describe earlier states; this section supersedes outdated domain, missing Supabase project and no-deployment statements.

# SmartSpend — canonical implementation handoff

Date: 2026-11-10 (Africa/Cairo). Version 0.1.0, build 001.
Specification: https://app.notion.com/p/413edc0cac2381328d6ec43d3c8c1737

## Current state

Specification read in full. Repository now exists: https://github.com/carlospeter582011-prog/SmartSpend (public, created by owner). Remote main was inspected: only `README.md` containing `# SmartSpend`, initial commit `9dafed0ba0a6b5cee37958b3e02755ea7af43400`. No existing implementation to preserve. 45 source files uploaded through the GitHub connector in commit `c548d90236243d9c6851e9dd2b6de5999a153916`. Remote tree verified. NOT deployed.

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
- Shared cloud browser fallback attempted localhost preview; ERR_CONNECTION_REFUSED. This local limitation remains, but remote GitHub Actions subsequently ran the browser successfully. See current remote evidence below; offline shell/installability are not yet verified.
- SQL permission fixture PASSED in isolated PostgreSQL 16 CI. No live Supabase URL, keys, project connection or test accounts were supplied, so actual Supabase integration is not verified.
- GitHub Actions initial run 42822463127: install, typecheck, lint, 24 unit tests and build passed. Browser E2E: eight viewport tests and keyboard/zoom passed (9/10 total); offline reload failed. Screenshots were downloaded and inspected. Fixed Vary-aware public asset cache lookups, made worker-control readiness explicit, disabled chart animation for stable rendering and applied compact currency formatting to prevent digit splitting. Replacement run 42823730084 passed all 10 browser tests, including offline reload and all eight widths. Updated mobile screenshot visually inspected: charts render and currency values no longer split digits. Vercel remains undeployed: team authorization returned 403; a team-access consent link was supplied to the owner.
- Gemini: official model listing + structured output inspected; no key, free-tier eligibility/quota or real generation verified. Gateway disabled by default.

## Blockers and exact requirements

1. Repository provisioning is resolved; inspect initial source push and GitHub Actions. Repository is public, so never commit secrets or actual financial data.
2. Supabase project and environment bindings required: public URL/anon configuration plus server-only service-role key in Vercel. Apply migration using phone SQL editor, run isolated permission fixtures and multi-account tests. Never request secrets in chat.
3. Vercel project connected to repository; exact APP_ORIGIN, Auth redirect URLs, email delivery configured. Deployment verification requires actual URL and authenticated tests.
4. Optional Gemini key in server environment, provider quota/tier review, official documented adapter smoke test; no free quota assumed.
5. Browser execution is resolved through GitHub Actions. Keep live Supabase/auth/multi-device checks separate from passing local-demo E2E.

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

Local asset/schema tests passed. Update this handoff only when results or blockers change. Initial source is uploaded. Offline cache fix passed on GitHub Actions. Verify the latest run 42824099753, then obtain Vercel team authorization and configure live Supabase before checking Phase 1 complete. Then live database/auth permissions and deployment verification before checking Phase 1 tasks. Work through all remaining Notion phases with evidence; no complete-project declaration until real deployed flows pass.

## Notion synchronization

Three verified foundation tasks checked in place: official AI documentation/fallback research; TypeScript/design/routing/error/test/CI/README scaffold; original SVG/PWA icon assets. All other checkboxes remain unchecked. Implementation handoff appended to the original specification page with blockers, passed tests and explicitly unsuccessful browser verification.

## Database verification expansion

Added an isolated PostgreSQL 16 CI job and minimal auth.uid/role fixture (`supabase/tests/bootstrap.sql`). This fixture must NEVER run in an existing Supabase project. Expanded SQL tests cover domain-view RLS, owner-only private rows, explicitly shared snapshots, stale-write conflict/idempotent replay, expired/revoked/single-use invites, child privilege escalation, direct mutation bypass and anonymous quota access. Database job 129856708757 in run 42824099753 PASSED: all four migrations executed and expanded SQL permission fixture completed successfully. These tests validate PostgreSQL policies/functions, not live Supabase Auth/PostgREST integrations.

## Latest verified milestone

GitHub Actions run **42824099753** on implementation commit **78025b767af8e809c999a8aa227cda9a2cf56c52** completed successfully: BOTH `verify` and `database` jobs are green. The verification job passed npm ci, TypeScript, ESLint, 24 unit tests, production build, and all 10 Chromium E2E tests. Database job applied all four migrations and passed the expanded SQL permission cases. Browser evidence: https://github.com/carlospeter582011-prog/SmartSpend/actions/runs/42824099753 . Updated screenshots on the preceding identical frontend commit were downloaded and visually inspected.

Source integrity check matched all 45 uploaded files to remote Git blob SHA values before adding the PostgreSQL fixture. Browser bundle check found no server-only secret variable references, and secret example values are empty.

Current phase: Phase 0 foundation complete; Phase 1 source and isolated SQL verification implemented, but live Supabase Auth/PostgREST, auth recovery/session behavior, family interactions and multi-device synchronization NOT verified. No Vercel deployment exists. Team authorization returned 403 and remains an external requirement. Supabase project/configuration and optional server-side Google key are still required. Never ask for secret values in chat. Remaining independent implementation gaps above are not waived by passing CI.

Next concrete action: owner approves the Vercel team-access consent link; then inspect/create the intended SmartSpend Vercel project and configure live Supabase via secure environment settings. Continue real deployment/auth/sync tests before claiming completion. This documentation-only handoff update does not alter the verified application code.

## Phone-only initial SQL setup

Added `supabase/setup.sql`, combining migrations 001–004 in order inside a single atomic transaction for a NEW EMPTY project. Run once, or use individual migrations, never both. Existing Supabase auth schema is reused; the test bootstrap fixture must never run on Supabase. Added a CI step applying the combined file to a second empty PostgreSQL database and rerunning permissions.sql. Combined-script test PASSED in database job 129888159150, CI run 42833134001, on commit d5155967f8c82df71b8f1af017187702f3f9752d. It applied setup.sql to a second empty PostgreSQL database and reran permissions.sql successfully. Live Supabase setup remains pending. No credentials were added.

## Latest live Supabase milestone

Owner selected organization carlospeter582011 (peewsemzujtchyspvreu). Quoted project cost: $0/month. Created SmartSpend project `uhqunznswmedvoplngop` in eu-central-1; status ACTIVE_HEALTHY. API URL: https://uhqunznswmedvoplngop.supabase.co . Dashboard: https://supabase.com/dashboard/project/uhqunznswmedvoplngop .

Inspected public schema (empty), applied the verified combined schema as migration smartspend_initial_schema, then applied restrict_membership_helpers (source migration 005). Supabase live SQL permission fixture PASSED before and after hardening; rollback confirmed zero fixture auth users and all 11 app tables empty with RLS enabled. Anonymous execution of is_member/is_admin/consume_quota is false. No test bootstrap was applied to Supabase and no real financial data was inserted.

Security advisor anonymous-definer warnings were fixed. Remaining notices are intentional: rate_buckets has RLS with no client policies and privileges revoked; seven authenticated SECURITY DEFINER RPCs exist for guarded app operations and require continued security review alongside live auth integration. References: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy and https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable . Do not describe the advisor as warning-free.

Configured six production Vercel env entries without printing or committing key values: VITE_SUPABASE_URL, SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_ANON_KEY, APP_ORIGIN, AI_ENABLED=false. Publishable key selected from supported Supabase connector; all public config writes verified by env-name metadata. Existing production deployment has NOT been redeployed with partial configuration.

Blockers: Supabase connector exposes only publishable keys, not backend secret keys. Owner must place the project's Secret key directly in Vercel SUPABASE_SERVICE_ROLE_KEY; never request it in chat. Supabase Auth Site URL/redirect settings also require Dashboard configuration (tool lacks Auth configuration capability). Set site https://smartspend-gamma.vercel.app with root and /?recovery=1 redirects. Optional Google GEMINI_API_KEY remains owner-entered; AI stays disabled until tested.

Source migration 005, updated initial setup.sql and this handoff are kept on branch supabase-provisioning-20261110 so that production does not auto-deploy with incomplete credentials. After the owner completes server/auth configuration: verify CI, merge branch, redeploy and test actual signup/login/recovery/session, sync and family flows. Live SQL policies passing does not mean end-to-end Auth is verified.

## AI waiting, rate limits, key pool and domain update

Owner changed the verified Vercel project domain to https://smartspend-save.vercel.app . APP_ORIGIN production env was updated to that exact origin. Supabase Auth Site URL plus root and /?recovery=1 redirects must be updated by owner to this new domain; connector lacks Auth configuration tools.

Vercel env metadata confirms SUPABASE_SERVICE_ROLE_KEY exists as Sensitive in Production. Its value was never retrieved or printed. No GEMINI_API_KEY/GEMINI_API_KEYS/GEMINI_MODELS env entry was found; AI is not configured yet. Added GET /api/status to perform a head-only Supabase credential check after deployment (readiness only, no user rows or secret values). Do not call key presence proof of validity until that probe succeeds.

AI now supports server-only GEMINI_API_KEYS: JSON array recommended, comma/newline list accepted, up to 8 distinct keys, overriding single-key legacy GEMINI_API_KEY. One randomly selected key is retained across the ordered two-model maximum fallback; this is per-request load distribution, not persistent round-robin. Models default gemini-3.8-flash then gemini-3.5-flash-lite. No fallback on 429/401/403, and no project/key rotation to evade provider quotas. Per-project limits are unchanged by adding keys. Official quota reference: https://ai.google.dev/gemini-api/docs/rate-limits .

Provider 429 returns sanitized structured error and Retry-After; shared provider cooldown stored in backend-only rate_buckets. App daily quotas return time until next UTC allowance boundary. Client preserves deterministic report and shows waiting spinner, elapsed time, slow-response message, cancellation, rate-limit countdown, disabled duplicate requests and a 40-second client timeout. Cancellation only stops local waiting and does not promise to abort provider computation already started. New messages support English/Arabic. Demo session preservation was fixed when Supabase is configured.

Local verification: TypeScript/lint, 36 tests including mounted React loading/cancel/429 UI tests and monetary/offline/SQL-independent tests, and production build passed. GitHub browser/database CI still required for this changed source before merging/releasing. No live Google generation is possible until the owner supplies keys through Vercel, never chat. No real financial data was used in tests.

## Password and install update — 2026-11-10

Owner requests minimum 8-character new passwords, visibility eyes, confirmation, and an install suggestion on each visit. Implemented reusable independent show/hide controls for login, signup and password change/recovery, 8-character minimum for signup/new passwords, confirmation with native validity plus pre-request checks; existing login credentials are accepted without introducing a new login minimum. Mode changes reset the password form. No passwords are stored or logged.

Install suggestion appears on each page load in browser mode, can be dismissed for the current visit, and is hidden in standalone mode or after appinstalled. It occupies normal document flow, not an overlay. Native prompt occurs only after user click and is consumed once; browsers without it get menu instructions. Settings uses the same install event. Supabase Auth server password policy cannot be inspected/changed through this connector; default Auth policy should accept eight characters, but actual server policy and a live account signup remain unverified.

Local verification passed: TypeScript, lint, 44 unit/component tests including matching eight-character mocked signup and rejected mismatch/short passwords; emitted API import smoke and production build. Added mobile portrait (360px) and desktop landscape (1440px) browser cases for password eyes, confirmation, overflow, install dismissal and revisit. Remote CI run 42854787060 PASSED both verify and database: 44 tests, emitted API imports, production build, all 12 browser tests including the new password/install mobile and desktop cases. Downloaded and visually reviewed password and install-banner screenshots at 360px and 1440px. Production deployment dpl_6pTCc7FYV4iaCMQGebC7wWmeVTnY is READY; live root and /api/status both returned HTTP 200. Database readiness remains ready. Actual Android OS installation and real-account signup/password recovery are not tested by these UI fixtures.

## Button overlap correction — 2026-11-10

Owner screenshots show overlapping persistent outlines in Plans and Settings. Root cause confirmed in built CSS: Tailwind generates .outline { outline-style: var(--tw-outline-style); outline-width: 1px }, colliding with our custom .outline button name; global outline-offset expands this outside each button. Renamed custom buttons to secondary-button throughout app/install UI/CSS, preserving keyboard focus-visible indicators. Plans now uses a responsive grid with 12px gaps and 44px targets; Settings preference actions have a wrapping group with 12px gaps, and standalone card buttons have vertical separation from text. Compact dashboard numbers use smaller responsive sizes and stay on one line on mobile.

Added browser regression cases at 320/360/430/1440 in LTR and RTL, testing button rectangle separation, absent unwanted resting outlines, Plans gaps, Settings sync status clearance and overflow; screenshots for both pages/directions. Corrected the AI cancellation mock to reject signals already aborted, matching native fetch behavior. Local 44 tests, TypeScript/lint and API smoke passed; production build and remote browser checks PASSED in run 42892081928, including all 16 browser cases. Screenshots were downloaded and visually reviewed; production release and live root/readiness both verified.

## Unique username and real-name separation — 2026-11-10

Owner requests a unique username for username/email login and a separate real name for display. Confirmed existing database lower(username) unique index. Added real_name signup field, 2–100-character name validation, 3–30 ASCII username validation, real name in mobile account heading/desktop profile, Settings name editing and clear duplicate username update feedback. Names are rendered as escaped text and cached in owner-scoped preferences, cleared on logout. Profile RLS stays owner-only; real names are not exposed through a public availability/enumeration endpoint. Login accepts email directly or a validated case-insensitive username, treating underscores literally and rejecting wildcard/display-name input. Repeated real names are allowed; usernames are unique ignoring case.

Migration 20261110201713_profile_real_name.sql adds nullable real_name for existing accounts, preserves valid existing signup metadata names, and enforces a real name for new Auth signups via the existing profile trigger. Existing accounts retain all data and can set their name in Settings. Updated new-empty-project setup.sql and rollback identity tests for duplicate insert/update, repeated names, missing names, invalid usernames and RLS isolation. Rollout: verify CI, deploy UI first, then apply verified migration immediately so new signup metadata from the transition can be backfilled. Actual mailbox confirmation/login remains separate from synthetic tests.

Local verification: TypeScript/lint, 50 tests, all four emitted API imports and production build passed. Remote browser + SQL CI, live migration/rollback verification and production release PASSED as recorded at the top of this file. No credentials or real names were printed/read from user rows.

## AI activation, visible email confirmation and invitation-only joining — 2026-11-10

Owner authorized enabling AI using privately stored Google keys. Vercel Production GEMINI_API_KEYS exists as Sensitive; values never read/decrypted. Upserted AI_ENABLED=true and temporary AI_VERIFY_ON_BUILD=true for the next production build. Added opt-in build smoke script using only synthetic connectivity text and the same structured-response normalization; it validates each configured credential, logs only key position/model/sanitized status, and stops on 429/401/403 without key fallback. Remove/disable AI_VERIFY_ON_BUILD after verifying the release to avoid repeat provider calls. Rechecked current Google model IDs and Interactions response_format/output_text against official docs (https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash , https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite , https://ai.google.dev/gemini-api/docs/get-started ). Runtime consent, aggregate-only inputs, app quotas, cooldown and safe fallback remain in place. Actual production smoke still pending; env presence is not proof of key validity.

Signup now shows visible progress and prevents duplicate submissions, then replaces the form/passwords with a focused 'Confirm your email' screen, inbox/spam steps, back-to-sign-in and a 60-second resend cooldown. If Auth already returned a real session, it avoids falsely demanding confirmation. No password is persisted. Native Auth resend API is only called on user request.

Removed the family membership selector. Joining now requires a validated same-origin invitation link plus explicit Accept invitation; role and membership come from accept_invite only. Opening a link routes to Family after login, preserves the pending token only within the tab, then removes it from URL/session storage after acceptance. Existing authorized family context restores automatically from owner-scoped preferences; no arbitrary household ID becomes membership. Family data clears on account/context changes and stale requests are ignored. Auth email confirmations opened in a new tab may require reopening the original family invite link.

Local TypeScript/lint, 58 tests, API import smoke and production build passed. New browser cases use a synthetic Supabase signup response (no actual email) to test confirmation/progress in portrait and landscape. Remote CI, production Google smoke and deployed verification remain pending.
