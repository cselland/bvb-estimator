# Build vs. Buy — project notes

Two projects in one repo:
- **Calculator (Next.js)** — repo root (`src/`). TCO build-vs-buy UI, D1-backed
  scenarios/reports, deployed to Cloudflare via OpenNext (`pnpm run cf:deploy`).
  Live at https://bvb.differentialfactor.com.
- **Harry (Cloudflare Worker)** — `harry/`. Analyst agent. Currently **inside-only /
  not deployed**.

## Deploy
- Calculator: `pnpm run cf:deploy` (build + `wrangler deploy`).
- Secrets are Cloudflare Worker secrets (`wrangler secret put`), **not** `.env`.
  Live secrets: `RESEND_API_KEY`, `GEMINI_API_KEY`.

## Security follow-ups — READ BEFORE deploying Harry or changing auth/data handling
See **`harry/README.md` → "Pre-deploy hardening checklist"** for the authoritative
list. Summary:
- Harry's `/agents/*` routes require `HARRY_API_TOKEN` (fails closed); CORS is
  allowlisted. The token secret + placeholder bindings in `harry/wrangler.jsonc`
  must be set before its first deploy.
- Deferred (low-risk) main-app items: email HTML sanitization in
  `src/lib/markdown-email.ts`; data retention/TTL for `scenario` rows in D1.

## Conventions
- Per-IP rate limiting lives in `src/lib/rate-limit.ts` (used by the scenarios,
  share, and events API routes). Reuse it for any new write/AI/email endpoint.
- User email is stored in the `scenario.email` D1 column only — never rendered into
  report markdown or sent to the AI model (PII). Keep it that way.
- Session traceback: `session_id` is the join key across `scenario`, `event_log`,
  and `session_draft` (all indexed on it). Look up by email or report id, then pull
  the `event_log` history.
