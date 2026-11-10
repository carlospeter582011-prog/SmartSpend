# Google adapter verification — 2026-11-10

Official sources inspected before adapter implementation:

- https://ai.google.dev/gemini-api/docs/models — lists `gemini-3.8-flash` and `gemini-3.5-flash-lite` as stable model IDs; advises latest models for new projects rather than legacy 2.5 models.
- https://ai.google.dev/gemini-api/docs/structured-output — current JavaScript example uses `client.interactions.create`, `response_format: {type: 'text', mime_type: 'application/json', schema: ...}` and `interaction.output_text`. Direct retrieval followed the official redirect to AI Studio and returned Markdown. No reliance on an assumed legacy candidates envelope.
- https://ai.google.dev/gemini-api/docs/pricing — the current Standard tables list free-tier input/output for both selected Flash models; free-tier data is marked as used to improve Google products. Availability is model-specific. A production key's eligibility and billing state have NOT been verified. No fixed free allowance is promised.
- https://ai.google.dev/gemini-api/docs/rate-limits — effective quotas depend on project/tier and must be viewed in AI Studio. Quotas are not per API key.
- Official installed SDK `@google/genai` 3.0.0 type declarations corroborate Interactions request fields, `store:false`, `output_text`, timeout and retry options. Lockfile pins resolved dependencies.

The gateway defaults to `gemini-3.8-flash,gemini-3.5-flash-lite`, bounded to two attempts. 429/401/403 stop fallback immediately. No key or project rotation. Set `AI_ENABLED=false` until a real provider smoke test, tier review and privacy review pass. Google free-tier data usage terms must be considered before enabling personal finance explanations. The UI requires consent and sends aggregate numbers only, without merchant names, notes, usernames or emails.

The provider only explains a fixed financial task; it receives no arbitrary chat instructions or user record text. Zod validates strict output. No payment/action tools exist. Affordability calculations are server recomputed from authorized private rows, not trusted from browser totals. Per-user daily quota 5 and global daily quota 50 are stored in Postgres; a one-hour cache is keyed by user and computed snapshot. Admin must set a provider project spend cap too. This app quota does not replace a provider billing cap.

Still required before release: verify the actual project's free-tier eligibility/limits, run authenticated live generation, verify the real provider envelope, review outputs for domain safety in both languages, exercise timeout/403/429 and blocked-content responses. Schema-valid text can still contain incorrect advice; production semantic-output review remains open.
