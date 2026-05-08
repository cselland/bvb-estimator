import { Agent, callable } from "agents";
import { postScenario, type PostScenarioBody } from "../tools/build-vs-buy";

// 1. Broadening all bindings to 'any' to satisfy the rigid Cloudflare.Env constraint
interface Env {
  HARRY_MEMORY: any; 
  MARKET_DB: any;
  CALCULATOR_BASE_URL: any; // Changed to 'any' to bypass the string-literal check
  HarryAgent: any; 
  [key: string]: any; 
}

export type HarryState = {
  displayName: "Harry";
  role: "analyst";
  lastTopic: string | null;
};

/**
 * Harry — analyst agent.
 */
export class HarryAgent extends Agent<Env, HarryState> {
  env!: Env;

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

  @callable()
  async runBuildVsBuyScenario(body: PostScenarioBody) {
    return postScenario(this.env, body);
  }

  @callable()
  rememberTopic(topic: string) {
    this.setState({ ...this.state, lastTopic: topic });
    return this.state;
  }

  @callable()
  async listMarketSeries(limit = 20) {
    const cap = Math.min(Math.max(limit, 1), 100);
    const { results } = await this.env.MARKET_DB.prepare(
      "SELECT id, symbol, name, currency, updated_at FROM market_series ORDER BY updated_at DESC LIMIT ?"
    )
      .bind(cap)
      .all();
    return results ?? [];
  }

  @callable()
  async indexMemoryChunk(args: {
    id: string;
    values: number[];
    metadata?: Record<string, any>;
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