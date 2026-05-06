import type { ScenarioInputs, ScenarioResult } from "./tco";
import { formatCurrency, formatMonths, formatSaasCost } from "./format";

export function generateSummaryMarkdown(
  sessionId: string,
  inputs: ScenarioInputs,
  r: ScenarioResult,
  email: string | null,
): string {
  const lines: string[] = [
    `# Build vs. Buy — scenario summary`,
    ``,
    `- **Session:** ${sessionId}`,
    `- **Generated:** ${new Date().toISOString()}`,
    email ? `- **Email:** ${email}` : `- **Email:** (not provided)`,
    ``,
    `## Verdict: **${r.verdict}**`,
    ``,
    r.verdict === "BUILD"
      ? `Estimated **${r.horizonYears}-year TCO** favors a **custom build** over vendor SaaS for the parameters below.`
      : `Estimated **${r.horizonYears}-year TCO** favors **vendor SaaS** over a custom build for the parameters below.`,
    ``,
    `| Metric | Value |`,
    `| --- | --- |`,
    `| ${r.horizonYears}-year TCO (custom build) | ${formatCurrency(r.buildThreeYearTco)} |`,
    `| ${r.horizonYears}-year TCO (vendor SaaS) | ${formatCurrency(r.saasThreeYearTco)} |`,
    `| Spread | ${formatCurrency(Math.abs(r.buildThreeYearTco - r.saasThreeYearTco))} |`,
    ``,
    `## Parameters`,
    ``,
    `| Input | Value |`,
    `| --- | --- |`,
    `| Time to go live | ${formatMonths(inputs.timeToGoLive)} |`,
    `| Expected app lifespan | ${formatMonths(inputs.appLifespan)} |`,
    `| Annual SaaS cost | ${formatSaasCost(inputs.annualSaasCost)}/yr |`,
    `| Annual SaaS increase | ${inputs.annualCostIncreasePct.toFixed(1)}% |`,
    `| SaaS implementation (one-time) | ${formatCurrency(inputs.saasImplementationCost)} |`,
    `| Differentiation level | ${inputs.differentiationLevel.toFixed(1)} / 5 |`,
    `| Customization importance | ${inputs.customizationImportance} / 5 |`,
    `| App criticality | ${inputs.appCriticality} / 5 |`,
    `| Self-coding appetite | ${inputs.selfCodingAppetite} / 5 |`,
    `| Engineers to build | ${inputs.buildEngineers} |`,
    `| Build timeframe | ${formatMonths(inputs.buildTimeframeMonths)} |`,
    `| Cost / engineer / year | ${formatCurrency(inputs.costPerEngineerPerYear)} |`,
    `| Support reps | ${inputs.supportReps} |`,
    `| Cost / rep / year | ${formatCurrency(inputs.costPerRepPerYear)} |`,
    ``,
    `## Model notes`,
    ``,
    `- Urgency multiplier (vs. 12 mo baseline): **${r.urgencyMultiplier.toFixed(2)}×**`,
    `- Criticality multiplier: **${r.criticalityMultiplier.toFixed(2)}×**`,
    `- Self-coding discount factor: **${r.appetiteDiscount.toFixed(2)}×**`,
    `- SaaS customization multiplier: **${r.saasCustomizationMultiplier.toFixed(2)}×**`,
    ``,
    `## ${r.horizonYears}-year cost breakdown (chart values)`,
    ``,
    ...r.chartData.map(
      (row) =>
        `- **${row.name}:** build ${formatCurrency(row["Custom Build"])}, SaaS ${formatCurrency(row["Vendor SaaS"])}`,
    ),
    ``,
    `---`,
    `*Differential Factor — Build vs. Buy calculator. Estimates are illustrative; validate with your finance and engineering teams.*`,
  ];

  return lines.join("\n");
}
