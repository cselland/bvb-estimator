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

export interface EstimatedTokenSpendResult {
  primaryModel: ModelToolName;
  secondaryModel: ModelToolName;
  horizonYears: number;
  annualSaasProxySpend: number;
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
  primaryModel: ModelToolName;
  secondaryModel: ModelToolName;
  horizonYears?: number;
}): EstimatedTokenSpendResult {
  const { annualSaasCost, differentiationLevel, primaryModel, secondaryModel, horizonYears = 3 } = args;
  const primaryCoeff = MODEL_COST_COEFFICIENTS[primaryModel];
  const secondaryCoeff = MODEL_COST_COEFFICIENTS[secondaryModel];
  const blendedModelCoefficient = primaryCoeff * 0.7 + secondaryCoeff * 0.3;
  const differentiationMultiplier = 0.55 + ((differentiationLevel - 1) / 4) * 1.1;
  const annualSaasProxySpend = annualSaasCost * 0.42;
  const estimatedAnnualTokenSpend =
    annualSaasProxySpend * blendedModelCoefficient * differentiationMultiplier;
  const growthSeries = Array.from({ length: horizonYears }, (_, idx) => 1.08 ** idx);
  const estimatedThreeYearTokenTco = growthSeries.reduce(
    (sum, factor) => sum + estimatedAnnualTokenSpend * factor,
    0
  );
  const threeYearSaasTco = growthSeries.reduce((sum, factor) => sum + annualSaasCost * factor, 0);
  const deltaVsSaas = estimatedThreeYearTokenTco - threeYearSaasTco;
  const recommendation: "MODEL_STACK" | "VENDOR_SAAS" =
    estimatedThreeYearTokenTco < threeYearSaasTco ? "MODEL_STACK" : "VENDOR_SAAS";

  return {
    primaryModel,
    secondaryModel,
    horizonYears,
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

  const saasCustomizationMultiplier = 1 + (customizationImportance - 1) * 0.1;
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
