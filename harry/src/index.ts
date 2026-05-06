import { Hono } from "hono";
import { agentsMiddleware } from "hono-agents";
import { cors } from "hono/cors";

export { HarryAgent } from "./agents/harry";

const app = new Hono<{ Bindings: Env }>();

app.use("*", agentsMiddleware());

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

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
