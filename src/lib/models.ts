/**
 * Model and tool cost reference for the TCO engine.
 *
 * `coefficient` is the relative cost weight consumed by `src/lib/tco.ts`.
 * For token-priced models it is DERIVED from list price so the two can't drift:
 *
 *   blended     = 0.75 * inputPer1M + 0.25 * outputPer1M   // mixed workload
 *   coefficient = blended / 10.0 * 1.2                     // Opus tier = 1.20 anchor
 *
 * The 0.75/0.25 split is the "Mixed workload" baseline. Retrieval-heavy vs
 * generation-heavy workloads are adjusted separately by
 * OUTPUT_INTENSITY_MULTIPLIERS in tco.ts — don't double-count them here.
 *
 * Seat-priced tools have no $/MTok, so their coefficients stay hand-tuned.
 *
 * Prices are USD list, standard tier, per 1M tokens (or per seat/month).
 * Verified against first-party pricing pages 2026-08-01 — see PRICING_AS_OF.
 */
export const PRICING_AS_OF = "2026-08-01";

export type ModelPricing =
  | { kind: "tokens"; inputPer1M: number; outputPer1M: number }
  | { kind: "seat"; perSeatPerMonth: number };

export const MODEL_DATA = {
  // ---- Anthropic (token-priced) ----
  "Claude Fable 5": {
    coefficient: 2.40,
    provider: "Anthropic",
    pricing: { kind: "tokens", inputPer1M: 10, outputPer1M: 50 },
  },
  "Claude Opus 5": {
    coefficient: 1.20,
    provider: "Anthropic",
    pricing: { kind: "tokens", inputPer1M: 5, outputPer1M: 25 },
  },
  "Claude Opus 4.8": {
    coefficient: 1.20,
    provider: "Anthropic",
    pricing: { kind: "tokens", inputPer1M: 5, outputPer1M: 25 },
  },
  "Claude Sonnet 5": {
    coefficient: 0.72,
    provider: "Anthropic",
    pricing: { kind: "tokens", inputPer1M: 3, outputPer1M: 15 },
  },
  "Claude Haiku 4.5": {
    coefficient: 0.24,
    provider: "Anthropic",
    pricing: { kind: "tokens", inputPer1M: 1, outputPer1M: 5 },
  },

  // ---- OpenAI (token-priced) ----
  "GPT-5.6 Sol": {
    coefficient: 1.35,
    provider: "OpenAI",
    pricing: { kind: "tokens", inputPer1M: 5, outputPer1M: 30 },
  },
  "GPT-5.6 Terra": {
    coefficient: 0.54,
    provider: "OpenAI",
    pricing: { kind: "tokens", inputPer1M: 2, outputPer1M: 12 },
  },
  "GPT-5.6 Luna": {
    coefficient: 0.05,
    provider: "OpenAI",
    pricing: { kind: "tokens", inputPer1M: 0.20, outputPer1M: 1.20 },
  },
  "GPT-4o": {
    coefficient: 0.53,
    provider: "OpenAI",
    pricing: { kind: "tokens", inputPer1M: 2.50, outputPer1M: 10 },
  },
  "GPT-4o mini": {
    coefficient: 0.03,
    provider: "OpenAI",
    pricing: { kind: "tokens", inputPer1M: 0.15, outputPer1M: 0.60 },
  },

  // ---- Google (token-priced; Pro rates are the <=200K-token band) ----
  "Gemini 3.1 Pro": {
    coefficient: 0.54,
    provider: "Google",
    pricing: { kind: "tokens", inputPer1M: 2, outputPer1M: 12 },
  },
  "Gemini 3.6 Flash": {
    coefficient: 0.36,
    provider: "Google",
    pricing: { kind: "tokens", inputPer1M: 1.50, outputPer1M: 7.50 },
  },
  "Gemini 3.5 Flash-Lite": {
    coefficient: 0.10,
    provider: "Google",
    pricing: { kind: "tokens", inputPer1M: 0.30, outputPer1M: 2.50 },
  },
  "Gemini 2.5 Pro": {
    coefficient: 0.41,
    provider: "Google",
    pricing: { kind: "tokens", inputPer1M: 1.25, outputPer1M: 10 },
  },
  "Gemini 2.5 Flash": {
    coefficient: 0.10,
    provider: "Google",
    pricing: { kind: "tokens", inputPer1M: 0.30, outputPer1M: 2.50 },
  },

  // ---- Seat-priced tools (coefficients hand-tuned, not price-derived) ----
  "Microsoft Copilot (Enterprise)": {
    coefficient: 0.80,
    provider: "Microsoft",
    pricing: { kind: "seat", perSeatPerMonth: 30 },
  },
  "Cursor": {
    coefficient: 0.45,
    provider: "Anysphere",
    pricing: { kind: "seat", perSeatPerMonth: 40 },
  },
  "Replit Agent": {
    coefficient: 0.30,
    provider: "Replit",
    pricing: { kind: "seat", perSeatPerMonth: 20 },
  },
  "Bolt.new": {
    coefficient: 0.28,
    provider: "StackBlitz",
    pricing: { kind: "seat", perSeatPerMonth: 30 },
  },
  "Lovable": {
    coefficient: 0.25,
    provider: "Lovable",
    pricing: { kind: "seat", perSeatPerMonth: 25 },
  },
  "v0 (Vercel)": {
    coefficient: 0.20,
    provider: "Vercel",
    pricing: { kind: "seat", perSeatPerMonth: 20 },
  },
} as const satisfies Record<
  string,
  { coefficient: number; provider: string; pricing: ModelPricing }
>;

export type ModelName = keyof typeof MODEL_DATA;

/** Blended $/1M tokens on the mixed-workload split used to derive coefficients. */
export function blendedPricePer1M(model: ModelName): number | null {
  const { pricing } = MODEL_DATA[model];
  if (pricing.kind !== "tokens") return null;
  return 0.75 * pricing.inputPer1M + 0.25 * pricing.outputPer1M;
}
