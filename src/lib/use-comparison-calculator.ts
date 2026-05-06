import { useMemo } from "react";
import {
  MODEL_COST_WEIGHTS_2026,
  type ComparisonSchema,
} from "./comparison-schema";

export interface ComparisonCalculatorResult {
  weightedModelAverage: number;
  tokenSpend: number;
  maintenance: number;
  buyTco3Year: number;
  buildTco3Year: number;
}

/**
 * Computes real-time Build vs Buy TCO from ComparisonSchema inputs.
 *
 * TokenSpend = (annualLicense * 0.15) * differentiation * weightedModelAverage
 * Buy TCO (3yr) = (annualLicense + annualSupport) * 3 + setupFee
 * Build TCO (3yr) = (tokenSpend * 1.5 for labor) + (maintenance * 2)
 */
export function useComparisonCalculator(
  comparison: ComparisonSchema,
  options?: { maintenanceMultiplier?: number }
): ComparisonCalculatorResult {
  return useMemo(() => {
    const { annualLicense, annualSupport, setupFee } = comparison.buy;
    const { primaryModel, secondaryModel, differentiation } = comparison.build;

    const primaryWeight = MODEL_COST_WEIGHTS_2026[primaryModel];
    const secondaryWeight = MODEL_COST_WEIGHTS_2026[secondaryModel];
    const weightedModelAverage = (primaryWeight + secondaryWeight) / 2;

    const tokenSpend = annualLicense * 0.15 * differentiation * weightedModelAverage;
    const maintenanceMultiplier = options?.maintenanceMultiplier ?? 0.2;
    const maintenance = tokenSpend * maintenanceMultiplier;

    const buyTco3Year = (annualLicense + annualSupport) * 3 + setupFee;
    const buildTco3Year = tokenSpend * 1.5 + maintenance * 2;

    return {
      weightedModelAverage,
      tokenSpend,
      maintenance,
      buyTco3Year,
      buildTco3Year,
    };
  }, [comparison, options?.maintenanceMultiplier]);
}
