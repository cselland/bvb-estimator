export const MODEL_COST_WEIGHTS_2026 = {
  Opus: 1.0,
  Copilot: 0.85,
  Sonnet: 0.6,
} as const;

export type ModelCostWeightName = keyof typeof MODEL_COST_WEIGHTS_2026;

export interface ComparisonSchema {
  buy: {
    annualLicense: number;
    annualSupport: number;
    setupFee: number;
  };
  build: {
    primaryModel: ModelCostWeightName;
    secondaryModel: ModelCostWeightName;
    differentiation: number; // 1-5
    devSeats: number;
  };
}

export function isComparisonSchema(value: unknown): value is ComparisonSchema {
  if (!value || typeof value !== "object") return false;
  const root = value as Record<string, unknown>;
  if (!root.buy || typeof root.buy !== "object") return false;
  if (!root.build || typeof root.build !== "object") return false;

  const buy = root.buy as Record<string, unknown>;
  const build = root.build as Record<string, unknown>;

  const hasValidBuy =
    typeof buy.annualLicense === "number" &&
    Number.isFinite(buy.annualLicense) &&
    typeof buy.annualSupport === "number" &&
    Number.isFinite(buy.annualSupport) &&
    typeof buy.setupFee === "number" &&
    Number.isFinite(buy.setupFee);

  const modelNames = Object.keys(MODEL_COST_WEIGHTS_2026);
  const hasValidBuild =
    typeof build.primaryModel === "string" &&
    modelNames.includes(build.primaryModel) &&
    typeof build.secondaryModel === "string" &&
    modelNames.includes(build.secondaryModel) &&
    typeof build.differentiation === "number" &&
    Number.isFinite(build.differentiation) &&
    build.differentiation >= 1 &&
    build.differentiation <= 5 &&
    typeof build.devSeats === "number" &&
    Number.isFinite(build.devSeats);

  return hasValidBuy && hasValidBuild;
}
