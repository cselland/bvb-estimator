# Harry (Analyst Agent)

Separate **Cloudflare Worker** project: Harry is the agent; he is **not** the build-vs-buy web app.

## Relationship to the repo

| Project | Location | Role |
|--------|----------|------|
| **Build vs. buy (Next.js)** | Repository root (`src/`, `package.json`) | TCO / scenarios UI and `POST /api/scenarios` — a **tool** Harry can call over HTTP. |
| **Harry** | This directory (`harry/`) | Analyst agent: Durable Object state, Vectorize, D1, Hono API. |

Configure that app’s public URL in `wrangler.jsonc` → `vars.CALCULATOR_BASE_URL` (default `http://127.0.0.1:3000` for local dev). Harry calls it via `src/tools/build-vs-buy.ts` and the `@callable()` method `runBuildVsBuyScenario` on `HarryAgent`.

## Commands

```bash
npm install
npm run dev
```

From the **repo root**, you can run `npm run harry:dev`.

## ⚠️ Pre-deploy hardening checklist

Harry is currently **inside-only / not deployed** (the Worker does not exist on the
Cloudflare account). The `@callable()` methods (`runBuildVsBuyScenario`,
`indexMemoryChunk`, `listMarketSeries`) read/write D1 + Vectorize and can call back
into the calculator API, so they must not be exposed unauthenticated. Before the
first `wrangler deploy`, complete all of the following:

1. **Set the API token secret** (the `/agents/*` auth gate fails closed without it —
   every agent call returns 401 until this is set):
   ```bash
   cd harry
   pnpm exec wrangler secret put HARRY_API_TOKEN   # paste a long random string
   ```
   Callers must then send `Authorization: Bearer <HARRY_API_TOKEN>`.

2. **Fix the placeholder bindings in `wrangler.jsonc`:**
   - `d1_databases[0].database_id` is still the placeholder
     `00000000-0000-4000-8000-000000000001` — create the DB
     (`wrangler d1 create harry-market-data`) and paste the real id.
   - Create the Vectorize index `harry-memory` before remote deploy.
   - Point `vars.CALCULATOR_BASE_URL` at the production calculator URL
     (`https://bvb.differentialfactor.com`), not `http://127.0.0.1:3000`.

3. **Confirm CORS allowlist** in `src/index.ts` (`ALLOWED_ORIGINS`) matches the real
   front-end origin(s). Keep `origin: "*"` out of this file.

### Security posture already in place (src/index.ts)
- CORS restricted to an allowlist (calculator origin + localhost dev) — not `*`.
- All `/agents/*` routes require a bearer token and **fail closed** when the secret
  is unset. `/` and `/health` remain public.

### Known caveat — browser/WebSocket access
The bearer-token gate covers HTTP calls to callable methods (server-to-server, the
intended use). Browsers **cannot set custom headers on WebSocket handshakes**, so if
Harry is ever driven from a browser over WS, that path needs a different auth scheme
(query-param token or cookie). Not relevant while inside-only.

## Deferred (main app, not Harry) — tracked here for visibility
From the pre-launch security review, two low-risk items were intentionally deferred:
- **Email HTML sanitization** — `src/lib/markdown-email.ts` runs `marked` without
  sanitizing output. Low risk (content is our own AI), but add `isomorphic-dompurify`
  before sending if AI output ever becomes less trusted.
- **Data retention / TTL** — `scenario` rows (incl. `email`) persist forever in D1.
  Consider a periodic purge (e.g. rows older than N months) for a cleaner privacy
  posture.
