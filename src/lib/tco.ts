export interface ScenarioInputs {
  timeToGoLive: number;
  appLifespan: number;
  annualSaasCost: number;
  appCriticality: number;
  selfCodingAppetite: number;
  customizationImportance: number;
  saasImplementationCost: number;
  buildEngineers: number;
  buildTimeframeMonths: number;
  costPerEngineerPerYear: number;
  supportReps: number;
  costPerRepPerYear: number;
}

export interface ScenarioResult {
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
    annualSaasCost,
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
  const buildThreeYearTco =
    buildDevCost + buildYearOneMaintenance * 3 + 20_000 + annualSupportCost * 3;

  const saasCustomizationMultiplier = 1 + (customizationImportance - 1) * 0.1;
  const saasThreeYearTco =
    saasImplementationCost + annualSaasCost * saasCustomizationMultiplier * 3 * 1.08;

  const verdict: "BUILD" | "BUY" = buildThreeYearTco < saasThreeYearTco ? "BUILD" : "BUY";

  const chartData = [
    {
      name: "Year 1",
      "Custom Build": Math.round(buildDevCost + buildYearOneMaintenance + annualSupportCost),
      "Vendor SaaS": Math.round(saasImplementationCost + annualSaasCost * saasCustomizationMultiplier),
    },
    {
      name: "Year 2",
      "Custom Build": Math.round(buildYearOneMaintenance + 10_000 + annualSupportCost),
      "Vendor SaaS": Math.round(annualSaasCost * saasCustomizationMultiplier * 1.08),
    },
    {
      name: "Year 3",
      "Custom Build": Math.round(buildYearOneMaintenance + 10_000 + annualSupportCost),
      "Vendor SaaS": Math.round(annualSaasCost * saasCustomizationMultiplier * 1.08 * 1.08),
    },
  ];

  return {
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
