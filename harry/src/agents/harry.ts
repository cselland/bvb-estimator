import { Agent, callable } from "agents";
import { postScenario, type PostScenarioBody } from "../tools/build-vs-buy";

export type HarryState = {
  displayName: "Harry";
  role: "analyst";
  /** Last user-facing topic or thesis string for this DO instance */
  lastTopic: string | null;
};

/**
 * Harry — analyst agent. One Durable Object instance per `name` in
 * `/agents/harry-agent/:name`. State is persisted via Agents + SQLite;
 * long-term PDF/URL memory uses Vectorize (`HARRY_MEMORY`); tabular market
 * data uses D1 (`MARKET_DB`).
 */
export class HarryAgent extends Agent<Env, HarryState> {
  initialState: HarryState = {
    displayName: "Harry",
    role: "analyst",
    lastTopic: null,
  };

  @callable()
  meta() {
    return {
      name: "Harry" as const,
      role: "analyst" as const,
      bindings: {
        vectorize: Boolean(this.env.HARRY_MEMORY),
        d1: Boolean(this.env.MARKET_DB),
      },
      tools: {
        buildVsBuyScenarioApi: this.env.CALCULATOR_BASE_URL,
      },
    };
  }

  /** Runs a scenario via the build-vs-buy Next.js app at repo root (`POST /api/scenarios`). */
  @callable()
  async runBuildVsBuyScenario(body: PostScenarioBody) {
    return postScenario(this.env, body);
  }

  @callable()
  rememberTopic(topic: string) {
    this.setState({ ...this.state, lastTopic: topic });
    return this.state;
  }

  /**
   * Example D1 read — list recent market series rows (limit for safety).
   */
  @callable()
  async listMarketSeries(limit = 20) {
    const cap = Math.min(Math.max(limit, 1), 100);
    const { results } = await this.env.MARKET_DB.prepare(
      "SELECT id, symbol, name, currency, updated_at FROM market_series ORDER BY updated_at DESC LIMIT ?"
    )
      .bind(cap)
      .all<{ id: string; symbol: string; name: string | null; currency: string; updated_at: string }>();
    return results ?? [];
  }

  /**
   * Stub for PDF/URL memory: insert a vector + metadata into Vectorize.
   * Production flow would embed text chunks first (Workers AI / external API).
   */
  @callable()
  async indexMemoryChunk(args: {
    id: string;
    values: number[];
    metadata?: Record<string, VectorizeVectorMetadata>;
  }) {
    const index = this.env.HARRY_MEMORY;
    await index.insert([
      {
        id: args.id,
        values: args.values,
        metadata: args.metadata,
      },
    ]);
    return { ok: true as const, id: args.id };
  }
}
