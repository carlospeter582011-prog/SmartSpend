# SmartSpend

Private-by-default, manual-entry personal finance PWA. React + TypeScript + Vite, Tailwind, Recharts, Dexie, Supabase and Vercel Functions.

**Development build, not a verified production release.** Read `continue.md` for tests, blocked integrations and remaining work. No real user financial data or credentials are included.

## Run and test

Node 24: `npm ci`, `npm run dev`. `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

`npm run test:e2e` tests the production preview. CI installs Chromium and uploads evidence. Local config uses `/usr/bin/chromium`; adjust only for your development machine. The owner does not need a desktop: all setup below is possible in Android Chrome.

## Phone-only deployment

1. Open the existing **SmartSpend** GitHub repository. The owner created it as public; it contains source and fictional demo data only. The source is now uploaded at https://github.com/carlospeter582011-prog/SmartSpend; use that repository.
2. In https://supabase.com/dashboard create a project. Use SQL Editor to apply `supabase/migrations/001_smartspend.sql` in a fresh project. Review before applying to existing databases. Apply migrations 002, 003 and 004 in order, too.
3. Configure Auth Site URL and allowed redirect URLs for the eventual Vercel domain. Keep email confirmation enabled; disabling it reduces proof of email ownership and is a separate deliberate admin decision. Configure SMTP, captcha and auth rate limits in Supabase before release. Username uniqueness is enforced case-insensitively in Postgres. Recovery redirects back to Settings after Supabase emits PASSWORD_RECOVERY.
4. Import the repository at https://vercel.com/new with Vite preset. Build `npm run build`, output `dist`. Add environment variables from `.env.example` using Vercel Settings, never chat or GitHub source.
5. `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are public client configuration; service role and Gemini keys must NEVER use the `VITE_` prefix. Server functions use `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_ORIGIN` (exact HTTPS origin without trailing slash). The anonymous key is designed to be public; RLS is the security boundary.
6. Leave `AI_ENABLED=false`. After `docs/GOOGLE_AI.md` checks pass, set `GEMINI_API_KEY`, optional `GEMINI_MODELS`, and enable explicitly. Core calculations work without AI.
7. Run CI, review `supabase/tests/permissions.sql` in a disposable project and complete the real multi-account release matrix. Only then mark matching Notion checkboxes complete.

## Architecture

- `src/finance.ts`: integer minor-unit calculations, validation, CSV escaping, recurrence.
- `src/schedules.ts`: deterministic IDs for manual installment generation and explicit 30-day forecast.
- `src/storage.ts`: per-user IndexedDB, queue coalescing, tombstones, compare-and-swap cloud sync and explicit conflicts.
- `src/main.tsx`: real record CRUD, dashboard, plans, family sharing, auth forms, preferences, backups, report UI and responsive layouts. Hash navigation persists current section. Sample data requires explicit demo choice.
- `api/login.ts`: rate-limited server-only username resolution. Generic failures, session tokens returned without resolved email.
- `api/analyze.ts`: verified Supabase bearer identity, authorized data retrieval, deterministic calculations, quota/cache, schema-validated Google explanations.
- `api/delete-account.ts`: authenticated confirmed deletion, cascading owned rows.
- `supabase/migrations`: RLS and server-enforced ownership, family membership, hashed single-use invitations, atomic compare-and-swap writes.
- `public/sw.js`: app shell/hashed asset cache only. Never caches APIs or Supabase responses. New worker waits for existing clients to close; deployment must not silently replace a running offline shell.

Financial storage uses a unified versioned `records` table with typed `payload.kind` and security-invoker domain views for wallets/categories/transactions/bills/budgets/recurring_rules/goals/debts (migration 003). The physical sync store is unified rather than separate physical tables; RLS is inherited through these views. Profiles, households, members, invitations, transaction_shares, ai_reports and audit metadata are separate tables.

## Privacy and limits

Logout clears the current user's local finance store and warns before discarding queued data. Backups are plaintext sensitive files downloaded only on request. No passwords are saved in Dexie; Supabase manages sessions. The browser device cache is not encrypted at rest. Export before clearing browser data. All amount inputs use two minor-unit decimal places for the six supported currencies; no FX conversion. Account deletion removes owned cloud rows; exported files and other devices' offline caches cannot be remotely guaranteed erased.

Family totals use only explicit share snapshots; private rows never enter family queries. Shares are immutable snapshots that require unshare/re-share to update. No double counting across record IDs inside a household. A deliberate snapshot can be different from a subsequently edited private entry. Household budgets, assignments, contribution summaries and shared-only aggregate AI are implemented in source but await live permission tests.

Automatic recurrence/payment is deliberately absent. Users generate planned installments explicitly and mark each paid manually. Generated recurrence preserves the original day-of-month anchor (Jan 31 → Feb 28 → Mar 31). Per-wallet balances include transfers. Full Arabic translation, adaptive AI onboarding, anomaly detection, comprehensive chart accessibility remains pending; cash-flow data table and modal focus trapping are implemented but need browser verification. AI-generated text needs semantic guardrails beyond JSON schema. Auth, RLS and all cloud behavior require live integration verification.

## Release evidence

See `continue.md`. Do not equate a passing build or demo with verified cloud authentication, authorization, synchronization, installability or production deployment.

The CI database job uses disposable PostgreSQL 16 with a minimal auth.uid/role compatibility fixture. It validates migration execution and SQL permission cases without real account data. It does not replace live Supabase Auth, PostgREST, signup/recovery, session or multi-device tests. `supabase/tests/bootstrap.sql` must never be run against an existing Supabase project.

## Multiple Google keys

In Vercel Production, set server-only `GEMINI_API_KEYS` to a JSON array of your keys. Do not put keys in source, chat, or a VITE-prefixed variable. The plural variable overrides `GEMINI_API_KEY`. Maximum eight unique keys; one is randomly selected per uncached request. `GEMINI_MODELS` accepts one or two comma-separated model IDs, tried in order using the selected key. Provider 429 stops attempts and activates a shared cooldown; key pooling cannot increase per-project quota. Keep AI_ENABLED=false until configuration and live behavior are verified. No Google keys are currently provided by this repository.

The production domain was changed by the owner to https://smartspend-save.vercel.app . APP_ORIGIN now points there. Supabase Auth Site URL and root/recovery redirects must also point to that domain.

### Account identity

Signup requires a real/display name (2–100 characters) and a separate unique username (3–30 ASCII letters, numbers or underscores), email and password confirmation. Usernames are unique ignoring case at the database level. Sign in with username or email plus password; this does not add Google OAuth. Real names may repeat, are shown on the account, and remain protected by owner-only profile RLS. Existing accounts can add their name in Settings. Existing databases apply migration `20261110201713_profile_real_name.sql`; use setup.sql only once for a new empty database. Profile identity is cached per owner for offline display and removed on logout. Do not use user-editable name metadata for authorization.

### Signup confirmation, family invitation links and enabled AI

Signup replaces the form with an explicit Confirm your email screen, visible progress, inbox/spam steps and a 60-second resend cooldown; an already-authenticated signup session is handled without an incorrect confirmation demand. Mail delivery still depends on Supabase Auth settings. Opening a family invite before login preserves it in that tab; joining needs the invitation link and an explicit Accept invitation. There is no family membership dropdown; membership/role still come from the guarded database RPC. The active authorized family restores automatically from owner-scoped preferences.

Production AI was enabled and all three configured Google credentials passed a synthetic structured-output smoke test via gemini-3.5-flash-lite on 2026-11-10. This is provider connectivity proof, not a complete user-session/finance flow test. AI requires a signed-in account and explicit consent; demo mode retains deterministic local calculations. Optional AI_VERIFY_ON_BUILD=true runs the secret-safe synthetic verification during build; leave false for ordinary builds, as it is now in Production. Never print credentials or feed real records into that check.


### Readable AI insights and budget chat

Assistant now renders readable summaries/steps instead of JSON and supports free questions plus follow-ups based on current synchronized personal financial data. Example chips only prefill text. Sign in, sync records and explicitly consent to the chat context before sending. Conversation is held only in page memory. The gateway excludes expense/income titles/private notes and account identity; selected financial labels and the user's own question are included under chat consent. Budgeting-only, no action tools. Visible waiting, cancellation, timeout, quota countdown and retained drafts cover errors. See docs/GOOGLE_AI.md and continue.md for verified scope and limits.


### Unified temporary Assistant (2026-11-11)

Assistant is now one full-page conversation with an anchored composer. Budget analysis, insights and purchase questions use that same chat; the separate analysis form and Insights panel were removed. Existing recorded calculations remain available in an expandable disclosure inside the chat empty state. There is no Google consent checkbox: pressing Send explicitly requests AI. No provider call happens just from opening Assistant. Privacy details remain in Settings. Conversation stays only in memory across app-section navigation; closing/reloading/pagehide, New chat, logout or account/currency/language change clears it. This ends the chat, not the authenticated account session. No chat history is stored server-side or in browser storage. Sending still requires a real account, connectivity and synchronized records. Existing quotas and errors remain.
