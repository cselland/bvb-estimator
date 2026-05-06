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
