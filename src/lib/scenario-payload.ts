import type { ScenarioInputs } from "./tco";

/** One moment in the user’s exploration (inputs + model picks at that time). */
export type ScenarioTimelineEntry = {
  at: string;
  inputs: ScenarioInputs;
  primaryTool?: string;
  secondaryTool?: string;
};

/** Stored in `Scenario.payloadJson` (v1 wrapped object). */
export type ScenarioPayloadV1 = {
  v: 1;
  inputs: ScenarioInputs;
  inputTimeline: ScenarioTimelineEntry[];
  appName?: string;
  appDescription?: string;
  summarySource?: "ai" | "fallback";
  summaryError?: string;
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
