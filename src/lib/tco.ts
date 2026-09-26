import { MODEL_DATA, type ModelName } from "./models";

export interface ScenarioInputs {
  timeToGoLive: number;
  appLifespan: number;
  annualSaasCost: number;
  annualCostIncreasePct: number;
  appCriticality: number;
  selfCodingAppetite: number;
  customizationImportance: number;
  differentiationLevel: number;
  saasImplementationCost: number;
  buildEngineers: number;
  buildTimeframeMonths: number;
  costPerEngineerPerYear: number;
  supportReps: number;
  costPerRepPerYear: number;
}

export const MODEL_COST_COEFFICIENTS = Object.fromEntries(
  Object.entries(MODEL_DATA).map(([name, model]) => [name, model.coefficient])
) as Record<ModelName, number>;

export type ModelToolName = ModelName;

export type OutputIntensity = "low" | "medium" | "high" | "reasoning";

export const OUTPUT_INTENSITY_LABELS: Record<OutputIntensity, string> = {
  low: "Retrieval-heavy",
  medium: "Mixed workload",
  high: "Generation-heavy",
  reasoning: "Reasoning-heavy",
};

/**
 * Share of tokens that are OUTPUT for each workload preset. A token-priced
 * model is costed at its own input and output prices at this mix:
 *
 *   blended     = (1 − s) · inputPer1M + s · outputPer1M
 *   coefficient = blended / 10.0 * 1.2        // same anchor as models.ts
 *
 * so a model with cheap output is no longer charged like one with expensive
 * output. Mixed (25%) reproduces the previous calculation exactly.
 */
export const OUTPUT_SHARE: Record<OutputIntensity, number> = {
  low: 0.10,
  medium: 0.25,
  high: 0.50,
  reasoning: 0.70,
};

// Seat-priced tools have no input/output split, so they keep the previous flat
// multiplier: exact at the three original presets, linear between them, and
// clamped at the ends (Reasoning-heavy gets Generation-heavy's 1.55).
const SEAT_MULTIPLIER_POINTS: [share: number, multiplier: number][] = [
  [0.10, 0.75],
  [0.25, 1.0],
  [0.50, 1.55],
];

export function seatOutputMultiplier(share: number): number {
  const pts = SEAT_MULTIPLIER_POINTS;
  if (share <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [s1, m1] = pts[i]!;
    if (share <= s1) {
      const [s0, m0] = pts[i - 1]!;
      return m0 + ((share - s0) / (s1 - s0)) * (m1 - m0);
    }
  }
  return pts[pts.length - 1]![1];
}

/** What the calculator needs to cost one model; a catalog ModelOption fits. */
export interface CostedModel {
  kind: "tokens" | "seat";
  inputPer1M: number | null;
  outputPer1M: number | null;
  /** Used for seat-priced tools only. */
  coefficient: number;
}

/** Relative cost weight of one model at an output share (0–1). */
export function effectiveCoefficient(model: CostedModel, outputShare: number): number {
  if (model.kind === "tokens" && model.inputPer1M !== null && model.outputPer1M !== null) {
    const blended = (1 - outputShare) * model.inputPer1M + outputShare * model.outputPer1M;
    return (blended / 10.0) * 1.2;
  }
  return model.coefficient * seatOutputMultiplier(outputShare);
}

export type SecondaryModelToolName = ModelToolName | "none";

export interface EstimatedTokenSpendResult {
  primaryModel: string;
  secondaryModel: string;
  horizonYears: number;
  primaryModelWeight: number;
  outputIntensity: OutputIntensity;
  /** 0–1; the preset's share unless overridden. */
  outputShare: number;
  annualSaasProxySpend: number;
  /** Traffic-weighted effective coefficient, output mix included. */
  blendedModelCoefficient: number;
  differentiationMultiplier: number;
  estimatedAnnualTokenSpend: number;
  estimatedThreeYearTokenTco: number;
  threeYearSaasTco: number;
  deltaVsSaas: number;
  recommendation: "MODEL_STACK" | "VENDOR_SAAS";
}

export function calculateEstimatedTokenSpend(args: {
  annualSaasCost: number;
  differentiationLevel: number;
  primaryModel: string;
  secondaryModel: string;
  /** From the current model catalog (live snapshot, last known good, or the table). */
  primaryPricing: CostedModel;
  /** null when no secondary model is selected. */
  secondaryPricing: CostedModel | null;
  primaryModelWeight?: number; // 0–100, share of traffic going to primary model
  outputIntensity?: OutputIntensity;
  /** Advanced override, 0–1. Replaces the preset's output share when set. */
  outputShareOverride?: number | null;
  horizonYears?: number;
}): EstimatedTokenSpendResult {
  const {
    annualSaasCost,
    differentiationLevel,
    primaryModel,
    secondaryModel,
    primaryPricing,
    secondaryPricing,
    primaryModelWeight = 70,
    outputIntensity = "medium",
    outputShareOverride = null,
    horizonYears = 3,
  } = args;
  const outputShare =
    outputShareOverride !== null && Number.isFinite(outputShareOverride)
      ? Math.min(1, Math.max(0, outputShareOverride))
      : OUTPUT_SHARE[outputIntensity];
  const primaryCoeff = effectiveCoefficient(primaryPricing, outputShare);
  // When no secondary model is selected, treat all traffic as primary.
  const blendedModelCoefficient = secondaryPricing === null
    ? primaryCoeff
    : primaryCoeff * (primaryModelWeight / 100) +
      effectiveCoefficient(secondaryPricing, outputShare) * (1 - primaryModelWeight / 100);
  const differentiationMultiplier = 0.55 + ((differentiationLevel - 1) / 4) * 1.1;
  const annualSaasProxySpend = annualSaasCost * 0.42;
  const estimatedAnnualTokenSpend =
    annualSaasProxySpend * blendedModelCoefficient * differentiationMultiplier;
  // Token costs stay flat (models get cheaper year-over-year); SaaS costs compound at 8%/year.
  // This makes horizon years meaningful: longer projects favor MODEL_STACK more.
  const saasSeries = Array.from({ length: horizonYears }, (_, idx) => 1.08 ** idx);
  const estimatedThreeYearTokenTco = estimatedAnnualTokenSpend * horizonYears;
  const threeYearSaasTco = saasSeries.reduce((sum, factor) => sum + annualSaasCost * factor, 0);
  const deltaVsSaas = estimatedThreeYearTokenTco - threeYearSaasTco;
  const recommendation: "MODEL_STACK" | "VENDOR_SAAS" =
    estimatedThreeYearTokenTco < threeYearSaasTco ? "MODEL_STACK" : "VENDOR_SAAS";

  return {
    primaryModel,
    secondaryModel,
    horizonYears,
    primaryModelWeight,
    outputIntensity,
    outputShare,
    annualSaasProxySpend,
    blendedModelCoefficient,
    differentiationMultiplier,
    estimatedAnnualTokenSpend,
    estimatedThreeYearTokenTco,
    threeYearSaasTco,
    deltaVsSaas,
    recommendation,
  };
}

export interface ScenarioResult {
  horizonYears: number;
  annualSupportCost: number;
  urgencyMultiplier: number;
  criticalityMultiplier: number;
  appetiteDiscount: number;
  buildDevCost: number;
  buildYearOneMaintenance: number;
  buildThreeYearTco: number;
  saasCustomizationMultiplier: number;
  saasThreeYearTco: number;
  verdict: "BUILD" | "BUY";
  chartData: {
    name: string;
    "Custom Build": number;
    "Vendor SaaS": number;
  }[];
}

export function computeScenario(inputs: ScenarioInputs): ScenarioResult {
  const {
    timeToGoLive,
    appLifespan,
    annualSaasCost,
    annualCostIncreasePct,
    appCriticality,
    selfCodingAppetite,
    customizationImportance,
    differentiationLevel,
    saasImplementationCost,
    buildEngineers,
    buildTimeframeMonths,
    costPerEngineerPerYear,
    supportReps,
    costPerRepPerYear,
  } = inputs;

  const annualSupportCost = supportReps * costPerRepPerYear;
  const horizonYears = Math.max(1, Math.ceil(appLifespan / 12));
  const urgencyMultiplier = 1 + Math.max(0, (12 - timeToGoLive) / 12) * 0.6;
  const criticalityMultiplier = 1 + (appCriticality - 1) * 0.25;
  const appetiteDiscount = 1 - (selfCodingAppetite - 1) * 0.1;

  const buildDevCost =
    buildEngineers *
    (costPerEngineerPerYear / 12) *
    buildTimeframeMonths *
    criticalityMultiplier *
    appetiteDiscount *
    urgencyMultiplier;
  const buildYearOneMaintenance = buildDevCost * 0.2;
  const buildYearOneCost = buildDevCost + buildYearOneMaintenance + annualSupportCost;
  const buildRecurringAnnualCost = buildYearOneMaintenance + 10_000 + annualSupportCost;
  const buildThreeYearTco =
    buildYearOneCost + Math.max(0, horizonYears - 1) * buildRecurringAnnualCost;

  // Higher differentiation = worse SaaS fit, so add a scaling premium to SaaS cost.
  // Range: 1.0 (level 1, commodity) → 1.40 (level 5, unique IP).
  const saasCustomizationMultiplier =
    1 + (customizationImportance - 1) * 0.1 + (differentiationLevel - 1) * 0.075;
  const annualGrowthFactor = 1 + annualCostIncreasePct / 100;
  const saasYearOne = annualSaasCost * saasCustomizationMultiplier;
  const saasAnnualCosts = Array.from({ length: horizonYears }, (_, idx) =>
    saasYearOne * annualGrowthFactor ** idx
  );
  const saasThreeYearTco = saasImplementationCost + saasAnnualCosts.reduce((sum, y) => sum + y, 0);

  const verdict: "BUILD" | "BUY" = buildThreeYearTco < saasThreeYearTco ? "BUILD" : "BUY";

  const chartData = Array.from({ length: horizonYears }, (_, idx) => ({
    name: `Year ${idx + 1}`,
    "Custom Build": Math.round(idx === 0 ? buildYearOneCost : buildRecurringAnnualCost),
    "Vendor SaaS": Math.round((idx === 0 ? saasImplementationCost : 0) + saasAnnualCosts[idx]),
  }));

  return {
    horizonYears,
    annualSupportCost,
    urgencyMultiplier,
    criticalityMultiplier,
    appetiteDiscount,
    buildDevCost,
    buildYearOneMaintenance,
    buildThreeYearTco,
    saasCustomizationMultiplier,
    saasThreeYearTco,
    verdict,
    chartData,
  };
}
