/**
 * The model picker's contents, from whichever price source is current.
 *
 * Client-safe: pure data shaping, no bindings. The server resolves WHICH
 * source to use (src/lib/model-catalog.server.ts); this file turns that source
 * into groups of options. The calculation only ever sees a coefficient per
 * option, derived by the same formula as the hardcoded table (models.ts), so
 * a live snapshot changes the inputs, never the math.
 */
import { MODEL_DATA, PRICING_AS_OF, coefficientFromPrices, type ModelName } from "./models";

// ---- Overshoot price snapshot (schema_version 1) ----------------------------
// Mirrors overshoot-index/src/snapshot/price-snapshot.ts. Received over the
// OVERSHOOT service binding, never from a public endpoint.

export type SnapshotTierKey = "low_cost" | "mid" | "premium";

export interface SnapshotModel {
  id: string;
  display_name: string;
  provider: string;
  tier: SnapshotTierKey;
  input_per_1m: number;
  output_per_1m: number;
  open_weights: boolean;
  tokens_7d: number | null;
  volume_rank_7d: number | null;
  first_seen: string | null;
}

export interface SnapshotPayload {
  schema_version: number;
  generated_at: string;
  window: { start: string; end: string; days: number };
  source_as_of: string;
  attribution: string;
  tier_basis: string;
  tiers: { key: SnapshotTierKey; label: string; range: string; eligible_count: number; models: SnapshotModel[] }[];
  open_weight: { label: string; partial: true; note: string; eligible_count: number; models: SnapshotModel[] };
}

export interface StoredSnapshot {
  snapshot_id: number;
  generated_at: string;
  window_start: string;
  window_end: string;
  source_as_of: string;
  attribution: string;
  schema_version: number;
  payload: SnapshotPayload;
}

export const SUPPORTED_SNAPSHOT_SCHEMA = 1;

// ---- Catalog ----------------------------------------------------------------

/** Where the prices on screen came from. Recorded with every saved scenario. */
export type PriceSource = "snapshot" | "last_known_good" | "hardcoded";

export interface ModelOption {
  /** Stable id: OpenRouter permaslug for snapshot models, the table name otherwise. */
  id: string;
  label: string;
  provider: string;
  kind: "tokens" | "seat";
  inputPer1M: number | null;
  outputPer1M: number | null;
  perSeatPerMonth: number | null;
  coefficient: number;
}

export interface ModelGroup {
  key: string;
  label: string;
  note?: string;
  /** Option ids, in display order. */
  ids: string[];
}

export interface PricingProvenance {
  source: PriceSource;
  snapshotId: number | null;
  generatedAt: string | null;
  sourceAsOf: string | null;
  attribution: string | null;
}

export interface ModelCatalog {
  provenance: PricingProvenance;
  groups: ModelGroup[];
  models: Record<string, ModelOption>;
  defaults: { primary: string; secondary: string };
}

/** Select values are group-scoped so one model can sit in a tier AND the open-weight list. */
export function optionValue(groupKey: string, id: string): string {
  return `${groupKey}|${id}`;
}

export function idFromValue(value: string): string {
  const i = value.indexOf("|");
  return i === -1 ? value : value.slice(i + 1);
}

export function findValue(catalog: ModelCatalog, id: string): string | null {
  const group = catalog.groups.find((g) => g.ids.includes(id));
  return group ? optionValue(group.key, id) : null;
}

// Pre-snapshot defaults, kept when the model is still offered.
const PREFERRED_PRIMARY = "Claude Opus 5";
const PREFERRED_SECONDARY = "Gemini 3.1 Pro";

const TIER_LABELS: Record<SnapshotTierKey, string> = {
  low_cost: "Low-cost price tier",
  mid: "Mid-price tier",
  premium: "Premium-price tier",
};

function seatGroup(): { group: ModelGroup; models: Record<string, ModelOption> } {
  const models: Record<string, ModelOption> = {};
  const ids: string[] = [];
  for (const [name, m] of Object.entries(MODEL_DATA) as [ModelName, (typeof MODEL_DATA)[ModelName]][]) {
    if (m.pricing.kind !== "seat") continue;
    ids.push(name);
    models[name] = {
      id: name,
      label: name,
      provider: m.provider,
      kind: "seat",
      inputPer1M: null,
      outputPer1M: null,
      perSeatPerMonth: m.pricing.perSeatPerMonth,
      coefficient: m.coefficient,
    };
  }
  return {
    group: { key: "seat", label: "Seat-priced tools", note: "Per-seat list prices; not token-priced.", ids },
    models,
  };
}

function pickDefaults(catalog: Omit<ModelCatalog, "defaults">): ModelCatalog["defaults"] {
  const tokenIds = catalog.groups.filter((g) => g.key !== "seat").flatMap((g) => g.ids);
  const byLabel = (label: string) => tokenIds.find((id) => catalog.models[id]?.label === label);
  const firstIn = (key: string, not?: string) =>
    catalog.groups.find((g) => g.key === key)?.ids.find((id) => id !== not);
  const primary = byLabel(PREFERRED_PRIMARY) ?? firstIn("premium") ?? tokenIds[0]!;
  const secondary =
    byLabel(PREFERRED_SECONDARY) ?? firstIn("mid", primary) ?? tokenIds.find((id) => id !== primary) ?? primary;
  return { primary, secondary };
}

/** A snapshot the calculator can use, or null if it is malformed or empty. */
export function catalogFromSnapshot(snap: StoredSnapshot, source: "snapshot" | "last_known_good"): ModelCatalog | null {
  const p = snap.payload;
  if (!p || snap.schema_version !== SUPPORTED_SNAPSHOT_SCHEMA || !Array.isArray(p.tiers)) return null;

  const models: Record<string, ModelOption> = {};
  const groups: ModelGroup[] = [];
  const add = (m: SnapshotModel) => {
    if (!(m.input_per_1m > 0) || !(m.output_per_1m > 0)) return false;
    models[m.id] ??= {
      id: m.id,
      label: m.display_name,
      provider: m.provider,
      kind: "tokens",
      inputPer1M: m.input_per_1m,
      outputPer1M: m.output_per_1m,
      perSeatPerMonth: null,
      coefficient: coefficientFromPrices(m.input_per_1m, m.output_per_1m),
    };
    return true;
  };

  // Premium first: the enterprise models most buyers come to compare.
  for (const key of ["premium", "mid", "low_cost"] as const) {
    const tier = p.tiers.find((t) => t.key === key);
    const ids = (tier?.models ?? []).filter(add).map((m) => m.id);
    if (ids.length > 0) groups.push({ key, label: `${TIER_LABELS[key]} · ${tier!.range}`, ids });
  }
  if (groups.length === 0) return null;

  const openIds = (p.open_weight?.models ?? []).filter((m) => m.open_weights && add(m)).map((m) => m.id);
  if (openIds.length > 0) {
    groups.push({
      key: "open_weight",
      label: "Open-weight models (partial list)",
      note: p.open_weight.note,
      ids: openIds,
    });
  }

  const seats = seatGroup();
  groups.push(seats.group);
  Object.assign(models, seats.models);

  const base = {
    provenance: {
      source,
      snapshotId: snap.snapshot_id,
      generatedAt: snap.generated_at,
      sourceAsOf: snap.source_as_of,
      attribution: snap.attribution,
    },
    groups,
    models,
  };
  return { ...base, defaults: pickDefaults(base) };
}

/** The pre-snapshot table. Always available; the picker is never empty. */
export function hardcodedCatalog(): ModelCatalog {
  const models: Record<string, ModelOption> = {};
  const tiers: Record<SnapshotTierKey, string[]> = { premium: [], mid: [], low_cost: [] };
  for (const [name, m] of Object.entries(MODEL_DATA) as [ModelName, (typeof MODEL_DATA)[ModelName]][]) {
    if (m.pricing.kind !== "tokens") continue;
    const { inputPer1M, outputPer1M } = m.pricing;
    tiers[inputPer1M >= 5 ? "premium" : inputPer1M >= 1 ? "mid" : "low_cost"].push(name);
    models[name] = {
      id: name,
      label: name,
      provider: m.provider,
      kind: "tokens",
      inputPer1M,
      outputPer1M,
      perSeatPerMonth: null,
      // The table's own (rounded) coefficient, so fallback results match the
      // pre-snapshot calculator exactly.
      coefficient: m.coefficient,
    };
  }
  const ranges: Record<SnapshotTierKey, string> = {
    premium: "$5+ / 1M input tokens",
    mid: "$1–5 / 1M input tokens",
    low_cost: "under $1 / 1M input tokens",
  };
  const groups: ModelGroup[] = (["premium", "mid", "low_cost"] as const)
    .filter((k) => tiers[k].length > 0)
    .map((k) => ({ key: k, label: `${TIER_LABELS[k]} · ${ranges[k]}`, ids: tiers[k] }));
  const seats = seatGroup();
  groups.push(seats.group);
  Object.assign(models, seats.models);

  const base = {
    provenance: {
      source: "hardcoded" as const,
      snapshotId: null,
      generatedAt: null,
      sourceAsOf: PRICING_AS_OF,
      attribution: null,
    },
    groups,
    models,
  };
  return { ...base, defaults: pickDefaults(base) };
}

/** "Prices updated Sep 23, 2026 · Source: OpenRouter", from the snapshot's own attribution. */
export function pricingLabel(p: PricingProvenance): { text: string; title: string | null } {
  const date = p.sourceAsOf ? formatDate(p.sourceAsOf) : null;
  if (p.source === "hardcoded" || !p.attribution) {
    return { text: `Prices as of ${date ?? "—"} · first-party list prices`, title: null };
  }
  // Attribution reads "Source: OpenRouter (openrouter.ai/rankings), as of …".
  const source = /^Source:\s*([^(,]+?)\s*(?:\(|,|$)/.exec(p.attribution)?.[1] ?? "OpenRouter";
  return { text: `Prices updated ${date ?? "—"} · Source: ${source}`, title: p.attribution };
}

function formatDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
