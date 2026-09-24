import type { PriceSource, PricingProvenance } from "./model-catalog";
import type { ScenarioInputs } from "./tco";

/** One moment in the user’s exploration (inputs + model picks at that time). */
export type ScenarioTimelineEntry = {
  at: string;
  inputs: ScenarioInputs;
  /** Display labels, as shown in the picker (what reports print). */
  primaryTool?: string;
  secondaryTool?: string;
  /** Stable model ids (OpenRouter permaslug, or the table name). */
  primaryModelId?: string;
  secondaryModelId?: string;
  /** Overshoot price snapshot the estimate was priced with; null = hardcoded table. */
  priceSnapshotId?: number | null;
};

const PRICE_SOURCES: readonly PriceSource[] = ["snapshot", "last_known_good", "hardcoded"];

/** Validate client-supplied pricing provenance; anything malformed is dropped, not trusted. */
export function parsePricingProvenance(v: unknown): PricingProvenance | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  if (typeof o.source !== "string" || !PRICE_SOURCES.includes(o.source as PriceSource)) return undefined;
  const str = (x: unknown) => (typeof x === "string" && x.length <= 300 ? x : null);
  const id = typeof o.snapshotId === "number" && Number.isSafeInteger(o.snapshotId) && o.snapshotId > 0 ? o.snapshotId : null;
  return {
    source: o.source as PriceSource,
    snapshotId: id,
    generatedAt: str(o.generatedAt),
    sourceAsOf: str(o.sourceAsOf),
    attribution: str(o.attribution),
  };
}

/** Stored in `Scenario.payloadJson` (v1 wrapped object). */
export type ScenarioPayloadV1 = {
  v: 1;
  inputs: ScenarioInputs;
  inputTimeline: ScenarioTimelineEntry[];
  appName?: string;
  appDescription?: string;
  summarySource?: "ai" | "fallback";
  summaryError?: string;
  /** Which prices the model-stack estimate used, so a result can be reproduced. */
  pricing?: PricingProvenance;
  finalPrimaryModelId?: string;
  finalSecondaryModelId?: string;
};

export function isScenarioInputs(v: unknown): v is ScenarioInputs {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  const nums = [
    "timeToGoLive",
    "appLifespan",
    "annualSaasCost",
    "annualCostIncreasePct",
    "appCriticality",
    "selfCodingAppetite",
    "customizationImportance",
    "differentiationLevel",
    "saasImplementationCost",
    "buildEngineers",
    "buildTimeframeMonths",
    "costPerEngineerPerYear",
    "supportReps",
    "costPerRepPerYear",
  ];
  if (!nums.every((k) => typeof o[k] === "number" && Number.isFinite(o[k] as number))) return false;
  // Prevent OOM from unbounded array allocation in computeScenario
  if ((o.appLifespan as number) < 1 || (o.appLifespan as number) > 600) return false;
  if ((o.buildTimeframeMonths as number) < 0 || (o.buildTimeframeMonths as number) > 120) return false;
  return true;
}

export function isScenarioTimelineEntry(v: unknown): v is ScenarioTimelineEntry {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (typeof o.at !== "string") return false;
  if (!isScenarioInputs(o.inputs)) return false;
  if (o.primaryTool !== undefined && typeof o.primaryTool !== "string") return false;
  if (o.secondaryTool !== undefined && typeof o.secondaryTool !== "string") return false;
  if (o.primaryModelId !== undefined && typeof o.primaryModelId !== "string") return false;
  if (o.secondaryModelId !== undefined && typeof o.secondaryModelId !== "string") return false;
  if (
    o.priceSnapshotId !== undefined &&
    o.priceSnapshotId !== null &&
    !(typeof o.priceSnapshotId === "number" && Number.isSafeInteger(o.priceSnapshotId))
  ) {
    return false;
  }
  return true;
}

/** Parse DB payload: legacy flat `ScenarioInputs` JSON or wrapped v1 object. */
export function parseScenarioPayload(raw: string): {
  inputs: ScenarioInputs;
  inputTimeline: ScenarioTimelineEntry[] | null;
  appName: string | null;
  appDescription: string | null;
  summarySource: "ai" | "fallback" | null;
  summaryError: string | null;
} {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && (parsed as ScenarioPayloadV1).v === 1) {
      const p = parsed as ScenarioPayloadV1;
      if (!isScenarioInputs(p.inputs)) throw new Error("invalid v1 inputs");
      const timeline = Array.isArray(p.inputTimeline) ? p.inputTimeline.filter(isScenarioTimelineEntry) : [];
      return {
        inputs: p.inputs,
        inputTimeline: timeline,
        appName: typeof p.appName === "string" && p.appName.trim() ? p.appName.trim() : null,
        appDescription:
          typeof p.appDescription === "string" && p.appDescription.trim() ? p.appDescription.trim() : null,
        summarySource: p.summarySource === "ai" || p.summarySource === "fallback" ? p.summarySource : null,
        summaryError: typeof p.summaryError === "string" && p.summaryError.trim() ? p.summaryError.trim() : null,
      };
    }
    if (isScenarioInputs(parsed)) {
      return {
        inputs: parsed,
        inputTimeline: null,
        appName: null,
        appDescription: null,
        summarySource: null,
        summaryError: null,
      };
    }
  } catch {
    /* fall through */
  }
  throw new Error("Invalid scenario payload");
}
