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

export type OutputIntensity = "low" | "medium" | "high";

export const OUTPUT_INTENSITY_LABELS: Record<OutputIntensity, string> = {
  low: "Retrieval-heavy",
  medium: "Mixed workload",
  high: "Generation-heavy",
};

// Output tokens cost 3-5× more than input tokens. This multiplier reflects
// the effective cost shift as generation ratio increases.
const OUTPUT_INTENSITY_MULTIPLIERS: Record<OutputIntensity, number> = {
  low: 0.75,
  medium: 1.0,
  high: 1.55,
};

export type SecondaryModelToolName = ModelToolName | "none";

export interface EstimatedTokenSpendResult {
  primaryModel: ModelToolName;
  secondaryModel: SecondaryModelToolName;
  horizonYears: number;
  primaryModelWeight: number;
  outputIntensity: OutputIntensity;
  annualSaasProxySpend: number;
  blendedModelCoefficient: number;
  outputIntensityMultiplier: number;
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
  primaryModel: ModelToolName;
  secondaryModel: SecondaryModelToolName;
  primaryModelWeight?: number; // 0–100, share of traffic going to primary model
  outputIntensity?: OutputIntensity;
  horizonYears?: number;
}): EstimatedTokenSpendResult {
  const {
    annualSaasCost,
    differentiationLevel,
    primaryModel,
    secondaryModel,
    primaryModelWeight = 70,
    outputIntensity = "medium",
    horizonYears = 3,
  } = args;
  const primaryCoeff = MODEL_COST_COEFFICIENTS[primaryModel];
  // When no secondary model is selected, treat all traffic as primary.
  const blendedModelCoefficient = secondaryModel === "none"
    ? primaryCoeff
    : primaryCoeff * (primaryModelWeight / 100) + MODEL_COST_COEFFICIENTS[secondaryModel] * (1 - primaryModelWeight / 100);
  const outputIntensityMultiplier = OUTPUT_INTENSITY_MULTIPLIERS[outputIntensity];
  const differentiationMultiplier = 0.55 + ((differentiationLevel - 1) / 4) * 1.1;
  const annualSaasProxySpend = annualSaasCost * 0.42;
  const estimatedAnnualTokenSpend =
    annualSaasProxySpend * blendedModelCoefficient * outputIntensityMultiplier * differentiationMultiplier;
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
    annualSaasProxySpend,
    blendedModelCoefficient,
    outputIntensityMultiplier,
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
