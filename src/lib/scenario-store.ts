import { prisma } from "@/lib/prisma";
import { withTimeout } from "@/lib/with-timeout";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export type ScenarioRecord = {
  id: string;
  sessionId: string;
  email: string | null;
  payloadJson: string;
  summaryMarkdown: string;
  verdict: string;
  buildThreeYearTco: number;
  saasThreeYearTco: number;
  createdAt: string;
};

function isCloudflareRuntime(): boolean {
  return (
    typeof (globalThis as { WebSocketPair?: unknown }).WebSocketPair !== "undefined" ||
    Boolean(process.env.CF_PAGES) ||
    Boolean(process.env.WORKERS_RS_VERSION)
  );
}

type D1ResultRow = {
  id: string;
  sessionId: string;
  email: string | null;
  payloadJson: string;
  summaryMarkdown: string;
  verdict: string;
  buildThreeYearTco: number | string;
  saasThreeYearTco: number | string;
  createdAt: string;
};

type D1Prepared = {
  run: () => Promise<unknown>;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  bind: (...values: unknown[]) => D1Prepared;
};

type D1DatabaseLike = {
  prepare: (query: string) => D1Prepared;
};

async function getD1(): Promise<D1DatabaseLike | null> {
  if (!isCloudflareRuntime()) return null;
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as Record<string, unknown>).DB;
  if (!db) throw new Error("Cloudflare D1 binding `DB` is missing. Add [[d1_databases]] binding = \"DB\".");
  return db as D1DatabaseLike;
}

async function ensureScenarioTable(db: D1DatabaseLike): Promise<void> {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS scenario (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        email TEXT,
        payload_json TEXT NOT NULL,
        summary_markdown TEXT NOT NULL,
        verdict TEXT NOT NULL,
        build_three_year_tco REAL NOT NULL,
        saas_three_year_tco REAL NOT NULL,
        created_at TEXT NOT NULL
      )`,
    )
    .run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS scenario_session_idx ON scenario(session_id)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS scenario_created_idx ON scenario(created_at)`).run();
}

export async function insertScenario(row: ScenarioRecord): Promise<{ id: string }> {
  const d1 = await getD1();
  if (!d1) {
    const created = await withTimeout(
      prisma.scenario.create({
        data: {
          id: row.id,
          sessionId: row.sessionId,
          email: row.email,
          payloadJson: row.payloadJson,
          summaryMarkdown: row.summaryMarkdown,
          verdict: row.verdict,
          buildThreeYearTco: row.buildThreeYearTco,
          saasThreeYearTco: row.saasThreeYearTco,
          createdAt: new Date(row.createdAt),
        },
        select: { id: true },
      }),
      12_000,
      "Scenario insert",
    );
    return { id: created.id };
  }

  await ensureScenarioTable(d1);
  await d1
    .prepare(
      `INSERT INTO scenario (
        id, session_id, email, payload_json, summary_markdown, verdict,
        build_three_year_tco, saas_three_year_tco, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      row.id,
      row.sessionId,
      row.email,
      row.payloadJson,
      row.summaryMarkdown,
      row.verdict,
      row.buildThreeYearTco,
      row.saasThreeYearTco,
      row.createdAt,
    )
    .run();
  return { id: row.id };
}

export async function getScenarioById(id: string): Promise<ScenarioRecord | null> {
  const d1 = await getD1();
  if (!d1) {
    const found = await withTimeout(
      prisma.scenario.findUnique({
        where: { id },
      }),
      12_000,
      "Scenario lookup",
    );
    if (!found) return null;
    return {
      id: found.id,
      sessionId: found.sessionId,
      email: found.email,
      payloadJson: found.payloadJson,
      summaryMarkdown: found.summaryMarkdown,
      verdict: found.verdict,
      buildThreeYearTco: found.buildThreeYearTco,
      saasThreeYearTco: found.saasThreeYearTco,
      createdAt: found.createdAt.toISOString(),
    };
  }

  await ensureScenarioTable(d1);
  const d = await d1
    .prepare(
      `SELECT
         id,
         session_id AS sessionId,
         email,
         payload_json AS payloadJson,
         summary_markdown AS summaryMarkdown,
         verdict,
         build_three_year_tco AS buildThreeYearTco,
         saas_three_year_tco AS saasThreeYearTco,
         created_at AS createdAt
       FROM scenario
       WHERE id = ?
       LIMIT 1`,
    )
    .bind(id)
    .first<D1ResultRow>();
  if (!d) return null;
  return {
    id: String(d.id),
    sessionId: String(d.sessionId ?? ""),
    email: d.email == null ? null : String(d.email),
    payloadJson: String(d.payloadJson ?? ""),
    summaryMarkdown: String(d.summaryMarkdown ?? ""),
    verdict: String(d.verdict ?? ""),
    buildThreeYearTco: Number(d.buildThreeYearTco ?? 0),
    saasThreeYearTco: Number(d.saasThreeYearTco ?? 0),
    createdAt: String(d.createdAt ?? new Date().toISOString()),
  };
}
