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
  return nums.every((k) => typeof o[k] === "number" && Number.isFinite(o[k] as number));
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
} {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && (parsed as ScenarioPayloadV1).v === 1) {
      const p = parsed as ScenarioPayloadV1;
      if (!isScenarioInputs(p.inputs)) throw new Error("invalid v1 inputs");
      const timeline = Array.isArray(p.inputTimeline) ? p.inputTimeline.filter(isScenarioTimelineEntry) : [];
      return { inputs: p.inputs, inputTimeline: timeline };
    }
    if (isScenarioInputs(parsed)) {
      return { inputs: parsed, inputTimeline: null };
    }
  } catch {
    /* fall through */
  }
  throw new Error("Invalid scenario payload");
}
