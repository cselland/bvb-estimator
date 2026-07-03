import { Hono } from "hono";
import { agentsMiddleware } from "hono-agents";
import { cors } from "hono/cors";

export { HarryAgent } from "./agents/harry";

// HARRY_API_TOKEN is a Worker secret (wrangler secret put HARRY_API_TOKEN), so it
// isn't part of the generated Env type — declare it on the Hono bindings here.
type Bindings = Env & { HARRY_API_TOKEN?: string };

const app = new Hono<{ Bindings: Bindings }>();

// Browser calls are only allowed from the calculator's own origins. Server-to-
// server callers don't send an Origin header and are gated by the bearer token
// on /agents/* instead.
const ALLOWED_ORIGINS = new Set<string>([
  "https://bvb.differentialfactor.com",
  "http://127.0.0.1:3000",
  "http://localhost:3000",
]);

app.use(
  "*",
  cors({
    origin: (origin) => (origin && ALLOWED_ORIGINS.has(origin) ? origin : null),
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// All agent invocation routes require a shared secret. Without HARRY_API_TOKEN
// set, every agent call is rejected (fail closed) rather than left open.
app.use("/agents/*", async (c, next) => {
  const expected = c.env.HARRY_API_TOKEN;
  const provided = c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !provided || provided !== expected) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});

app.use("*", agentsMiddleware());

app.get("/", (c) =>
  c.json({
    service: "harry",
    agent: "Harry",
    relatedProject: "build-vs-buy Next app (repo root — tool via CALCULATOR_BASE_URL)",
    routes: {
      health: "/health",
      agents: "/agents/harry-agent/:instanceId",
    },
  })
);

app.get("/health", (c) => c.json({ ok: true }));

export default app;
