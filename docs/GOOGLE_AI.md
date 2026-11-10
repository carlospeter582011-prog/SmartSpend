# Google adapter verification — 2026-11-10

Official sources inspected before adapter implementation:

- https://ai.google.dev/gemini-api/docs/models — lists `gemini-3.8-flash` and `gemini-3.5-flash-lite` as stable model IDs; advises latest models for new projects rather than legacy 2.5 models.
- https://ai.google.dev/gemini-api/docs/structured-output — current JavaScript example uses `client.interactions.create`, `response_format: {type: 'text', mime_type: 'application/json', schema: ...}` and `interaction.output_text`. Direct retrieval followed the official redirect to AI Studio and returned Markdown. No reliance on an assumed legacy candidates envelope.
- https://ai.google.dev/gemini-api/docs/pricing — the current Standard tables list free-tier input/output for both selected Flash models; free-tier data is marked as used to improve Google products. Availability is model-specific. A production key's eligibility and billing state have NOT been verified. No fixed free allowance is promised.
- https://ai.google.dev/gemini-api/docs/rate-limits — effective quotas depend on project/tier and must be viewed in AI Studio. Quotas are not per API key.
- Official installed SDK `@google/genai` 3.0.0 type declarations corroborate Interactions request fields, `store:false`, `output_text`, timeout and retry options. Lockfile pins resolved dependencies.

The gateway defaults to `gemini-3.8-flash,gemini-3.5-flash-lite`, bounded to two attempts. 429/401/403 stop fallback immediately. No key or project rotation. Set `AI_ENABLED=false` until a real provider smoke test, tier review and privacy review pass. Google free-tier data usage terms must be considered before enabling personal finance explanations. Report generation requires consent and sends aggregate numbers only. The budget-chat exception and its separate expanded consent are documented below.

The report branch explains a fixed financial task. Budget chat accepts user questions and bounded recent conversation, with fixed server budgeting instructions and untrusted record labels as documented below. Zod validates strict output. No payment/action tools exist. Affordability calculations are server recomputed from authorized private rows, not trusted from browser totals. Per-user daily quota 5 and global daily quota 50 are stored in Postgres; a one-hour cache is keyed by user and computed snapshot. Admin must set a provider project spend cap too. This app quota does not replace a provider billing cap.

Still required before release: verify the actual project's free-tier eligibility/limits, run authenticated live generation, verify the real provider envelope, review outputs for domain safety in both languages, exercise timeout/403/429 and blocked-content responses. Schema-valid text can still contain incorrect advice; production semantic-output review remains open.

## Key pool and visible waiting (2026-11-10)

`GEMINI_API_KEYS` optionally accepts a JSON array (recommended), or comma/newline-separated keys, up to eight distinct keys. It overrides the legacy `GEMINI_API_KEY`; the legacy variable still works when no pool is supplied. One key is randomly selected for a fresh uncached request and retained across the maximum two model attempts. This distributes normal requests; it is not a persistent round-robin schedule across serverless workers. Use keys within the same authorized provider project; the pool does not multiply project quota. No fallback to another key/model occurs on 429/401/403.

Provider 429 maps to a sanitized 429 with Retry-After (provider value when exposed by SDK, otherwise 60-second minimum retry guidance). A shared server-side cooldown is saved in rate_buckets. App daily limits return a wait until the next UTC allowance boundary. The UI disables repeated requests during the cooldown, displays pending feedback/elapsed time and cancellation, and retains its deterministic report. Client timeout: 40 seconds. Cancellation stops browser waiting; it cannot guarantee cancellation of provider work already in flight.

`GET /api/status` performs a head-only server-only rate_buckets query to check server Supabase credentials. It returns readiness booleans, public model names and key count, never key values, tokens, user rows or financial data. This is a configuration check, not full Auth or sync verification.

## Production verification — 2026-11-10

Owner authorized activation with existing secret GEMINI_API_KEYS. AI_ENABLED=true is live. A one-release optional build check (AI_VERIFY_ON_BUILD=true) used synthetic nonfinancial text and normalized JSON output for each of three keys. All three succeeded via gemini-3.5-flash-lite after bounded fallback; no successful gemini-3.8-flash result is asserted. Only key position/model/status were logged. The check flag was reset to false afterward to avoid repeat calls. Production status returns enabled=true, keyCount=3, configurationValid=true; no key values were retrieved.

Rechecked official model/API documentation: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash , https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite , https://ai.google.dev/gemini-api/docs/get-started . Provider connectivity is now verified; user-authenticated finance requests and full household AI integration still need live account verification.


## Readable insights and conversational budgeting — 2026-11-10

Insights renders validated response fields as readable prose/lists, never raw JSON. Chat is a real Google generation for each question, not canned answers. The server validates the session, reads only authorized records, computes trusted integer-minor-unit figures and groups category/month data. Separate chat consent covers questions, up to eight recent messages and selected bill/budget/wallet/goal/debt labels; expense/income titles, private notes, account IDs, usernames and emails are excluded. User-entered labels/questions remain untrusted data. Family context is shared-only after membership verification. Chat UI currently uses the personal-account scope.

Chat is not persisted in ai_reports or local storage, and uses store:false; conversation clears on leaving/account/currency/language changes. Reports retain the owner-scoped cache. User daily allowance is shared with reports (5/day, app global 50/day). Quota exhaustion does not trigger credential rotation. A bounded alternative model may be tried on 408/404/5xx; 429/401/403 stop immediately. SDK Interactions requests explicitly use {timeout:15000,maxRetries:0}; constructor-only retry options do not bound this SDK pathway. Client waiting timeout remains 40 seconds, including request preparation.

A real synthetic chat check produced a valid natural-language answer with correct EGP 123.45 interpretation through gemini-3.5-flash-lite on deployment dpl_5UxewTgzPSdaeyeu1DKEF17dut3Q. A subsequent bounded-request check returned provider 503; a single repeat using the final explicit timeouts passed in 15,764ms on dpl_4FCg1FDC15ZnhDBnY8bhjc9gxhNv. AI_VERIFY_CHAT was then reset to false. No actual records or secret values were logged. AI_VERIFY_CHAT is a temporary opt-in build smoke flag; keep false for normal builds. These tests do not prove semantic correctness on all real financial questions or actual end-user session integration.


## Superseding conversation UX decision — 2026-11-11

Owner explicitly requested removing the separate Google consent checkbox and unifying Assistant into a full-page temporary chat. Sending a question is now the user action requesting AI; the authenticated strict API still receives consent:true for backward compatibility, with no auto-send or auto-analysis on page open. Older statements above that a separate checkbox is required are superseded. Financial-context scope/exclusions, authentication, server-only secrets, quotas, bounded model fallback, fixed system instructions and store:false remain unchanged. Settings explains what is sent.

The conversation remains in page memory across navigation between app sections, ends on close/reload/pagehide (including bfcache return), and is never persisted to local/session storage, Dexie or ai_reports. New chat cancels outstanding work; canceled/stale responses cannot repopulate a cleared session. Account/currency/language changes reset context. This affects chat history only, not Supabase login persistence. All prior analysis/insights are accessed through the same conversation; deterministic recorded calculations remain an optional disclosure in the empty chat.
