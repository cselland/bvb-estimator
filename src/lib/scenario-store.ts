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

/** Shown when running `next dev` without a D1 binding (use `pnpm run dev:cf` for saves/reports). */
export const D1_UNAVAILABLE_MESSAGE =
  "D1 is not available (plain `next dev` has no D1 binding). " +
  "Run `pnpm run dev:cf` to use Wrangler with local D1, or test against the deployed Worker.";

function isCloudflareRuntime(): boolean {
  return (
    typeof (globalThis as { WebSocketPair?: unknown }).WebSocketPair !== "undefined" ||
    Boolean(process.env.CF_PAGES) ||
    Boolean(process.env.WORKERS_RS_VERSION)
  );
}

export function isD1UnavailableError(e: unknown): boolean {
  return e instanceof Error && e.message.includes("D1 is not available");
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
  batch: (statements: D1Prepared[]) => Promise<unknown[]>;
};

async function getD1(): Promise<D1DatabaseLike | null> {
  if (!isCloudflareRuntime()) return null;
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as Record<string, unknown>).DB;
  if (!db) throw new Error("Cloudflare D1 binding `DB` is missing. Add [[d1_databases]] binding = \"DB\".");
  return db as D1DatabaseLike;
}

async function requireD1(): Promise<D1DatabaseLike> {
  const d1 = await getD1();
  if (!d1) throw new Error(D1_UNAVAILABLE_MESSAGE);
  return d1;
}

// Schema setup is idempotent but billed per statement. Run it at most once per
// Worker isolate instead of on every request. A key is marked done only after
// its DDL succeeds, so a transient failure will retry on the next request.
const schemaReady = new Set<string>();
async function once(key: string, fn: () => Promise<void>): Promise<void> {
  if (schemaReady.has(key)) return;
  await fn();
  schemaReady.add(key);
}

async function ensureScenarioTable(db: D1DatabaseLike): Promise<void> {
  await once("scenario", async () => {
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
  });
}

export async function insertScenario(row: ScenarioRecord): Promise<{ id: string }> {
  const d1 = await requireD1();
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

type SessionDraftRecord = {
  sessionId: string;
  payloadJson: string;
  verdict: string;
  buildThreeYearTco: number;
  saasThreeYearTco: number;
  updatedAt: string;
};

async function ensureSessionDraftTable(db: D1DatabaseLike): Promise<void> {
  await once("session_draft", async () => {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS session_draft (
          session_id TEXT PRIMARY KEY,
          payload_json TEXT NOT NULL,
          verdict TEXT NOT NULL,
          build_three_year_tco REAL NOT NULL,
          saas_three_year_tco REAL NOT NULL,
          updated_at TEXT NOT NULL
        )`,
      )
      .run();
  });
}

export async function upsertSessionDraft(row: SessionDraftRecord): Promise<void> {
  const d1 = await requireD1();
  await ensureSessionDraftTable(d1);
  await d1
    .prepare(
      `INSERT INTO session_draft (session_id, payload_json, verdict, build_three_year_tco, saas_three_year_tco, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(session_id) DO UPDATE SET
         payload_json = excluded.payload_json,
         verdict      = excluded.verdict,
         build_three_year_tco = excluded.build_three_year_tco,
         saas_three_year_tco  = excluded.saas_three_year_tco,
         updated_at   = excluded.updated_at`,
    )
    .bind(
      row.sessionId,
      row.payloadJson,
      row.verdict,
      row.buildThreeYearTco,
      row.saasThreeYearTco,
      row.updatedAt,
    )
    .run();
}

type EventRow = {
  sessionId: string;
  seq: number;
  control: string;
  value: string;
  occurredAt: string;
};

async function ensureEventLogTable(db: D1DatabaseLike): Promise<void> {
  await once("event_log", async () => {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS event_log (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id  TEXT    NOT NULL,
          seq         INTEGER NOT NULL,
          control     TEXT    NOT NULL,
          value       TEXT    NOT NULL,
          occurred_at TEXT    NOT NULL
        )`,
      )
      .run();
    await db
      .prepare(`CREATE INDEX IF NOT EXISTS event_log_session_idx ON event_log(session_id)`)
      .run();
  });
}

export async function insertEvents(rows: EventRow[]): Promise<void> {
  if (rows.length === 0) return;
  const d1 = await requireD1();
  await ensureEventLogTable(d1);
  const stmt = `INSERT INTO event_log (session_id, seq, control, value, occurred_at) VALUES (?, ?, ?, ?, ?)`;
  await d1.batch(
    rows.map((r) => d1.prepare(stmt).bind(r.sessionId, r.seq, r.control, r.value, r.occurredAt)),
  );
}

async function ensureShareCountColumn(db: D1DatabaseLike): Promise<void> {
  await once("scenario.share_count", async () => {
    try {
      await db.prepare(`ALTER TABLE scenario ADD COLUMN share_count INTEGER NOT NULL DEFAULT 0`).run();
    } catch {
      // Column already exists — expected after first run
    }
  });
}

export async function checkAndIncrementShareCount(id: string, max: number): Promise<{ ok: boolean }> {
  const d1 = await requireD1();
  await ensureScenarioTable(d1);
  await ensureShareCountColumn(d1);
  const row = await d1
    .prepare(`SELECT share_count FROM scenario WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<{ share_count: number }>();
  if (!row) return { ok: false };
  if ((row.share_count ?? 0) >= max) return { ok: false };
  await d1.prepare(`UPDATE scenario SET share_count = share_count + 1 WHERE id = ?`).bind(id).run();
  return { ok: true };
}

export async function getScenarioById(id: string): Promise<ScenarioRecord | null> {
  const d1 = await requireD1();
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

// ---- Price snapshot, last known good ---------------------------------------
// Copies of the Overshoot price snapshots this Worker has served, keyed by the
// Overshoot snapshot_id. Two jobs: the fallback when the service binding fails
// or returns something stale, and reproduction -- a saved scenario records the
// snapshot_id it was priced with, and the exact payload is here.

export type LastKnownGoodSnapshot = {
  snapshotId: number;
  generatedAt: string;
  payloadJson: string;
};

async function ensurePriceSnapshotTable(db: D1DatabaseLike): Promise<void> {
  await once("price_snapshot", async () => {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS price_snapshot (
          snapshot_id INTEGER PRIMARY KEY,
          generated_at TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          fetched_at TEXT NOT NULL
        )`,
      )
      .run();
  });
}

/** Store a snapshot once. Returns without writing if the id is already held. */
export async function saveLastKnownGoodSnapshot(snapshotId: number, generatedAt: string, payloadJson: string): Promise<void> {
  const d1 = await getD1();
  if (!d1) return;
  await ensurePriceSnapshotTable(d1);
  await d1
    .prepare(
      `INSERT OR IGNORE INTO price_snapshot (snapshot_id, generated_at, payload_json, fetched_at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(snapshotId, generatedAt, payloadJson, new Date().toISOString())
    .run();
}

/** Newest held snapshot: one rowid seek. */
export async function getLastKnownGoodSnapshot(): Promise<LastKnownGoodSnapshot | null> {
  const d1 = await getD1();
  if (!d1) return null;
  await ensurePriceSnapshotTable(d1);
  return d1
    .prepare(
      `SELECT snapshot_id AS snapshotId, generated_at AS generatedAt, payload_json AS payloadJson
         FROM price_snapshot ORDER BY snapshot_id DESC LIMIT 1`,
    )
    .first<LastKnownGoodSnapshot>();
}
