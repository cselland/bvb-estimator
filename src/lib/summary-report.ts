import type { ScenarioTimelineEntry } from "./scenario-payload";
import type { ScenarioInputs, ScenarioResult } from "./tco";
import { computeScenario } from "./tco";
import { formatCurrency, formatMonths, formatSaasCost } from "./format";

function inputsParameterTableRows(inputs: ScenarioInputs): string[] {
  return [
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
  ];
}

export type SummaryMarkdownOptions = {
  /** Ordered history of parameter sets (and model picks) as the user explored the calculator. */
  inputTimeline?: ScenarioTimelineEntry[];
  finalPrimaryTool?: string;
  finalSecondaryTool?: string;
};

export function generateSummaryMarkdown(
  sessionId: string,
  inputs: ScenarioInputs,
  r: ScenarioResult,
  email: string | null,
  opts?: SummaryMarkdownOptions,
): string {
  const inputTimeline = opts?.inputTimeline?.length ? opts.inputTimeline : undefined;

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
    `## Final inputs (saved)`,
    ``,
    `These are the **primary calculator fields** at the moment the report was generated.`,
    ``,
    `| Input | Value |`,
    `| --- | --- |`,
    ...inputsParameterTableRows(inputs),
  ];

  if (opts?.finalPrimaryTool && opts?.finalSecondaryTool) {
    lines.push(`| Primary AI tool (estimator) | ${opts.finalPrimaryTool} |`);
    lines.push(`| Secondary AI tool (estimator) | ${opts.finalSecondaryTool} |`);
  }
  lines.push(``);

  if (inputTimeline && inputTimeline.length > 0) {
    lines.push(`## Exploration timeline`);
    lines.push(``);
    lines.push(
      `Full stream of **${inputTimeline.length}** distinct state(s) while using the calculator (order preserved). Each block is the full parameter set at that moment, with the model's verdict at that point.`,
    );
    lines.push(``);

    inputTimeline.forEach((entry, i) => {
      const step = i + 1;
      const snap = computeScenario(entry.inputs);
      lines.push(`### Step ${step} — ${entry.at}`);
      lines.push(``);
      lines.push(
        `- **Verdict then:** **${snap.verdict}** — build ${formatCurrency(snap.buildThreeYearTco)} vs SaaS ${formatCurrency(snap.saasThreeYearTco)} (${snap.horizonYears}-yr TCO)`,
      );
      if (entry.primaryTool || entry.secondaryTool) {
        lines.push(
          `- **AI tools:** ${entry.primaryTool ?? "—"} (primary), ${entry.secondaryTool ?? "—"} (secondary)`,
        );
      }
      lines.push(``);
      lines.push(`| Input | Value |`);
      lines.push(`| --- | --- |`);
      lines.push(...inputsParameterTableRows(entry.inputs));
      lines.push(``);
    });
  }

  lines.push(
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
  );

  return lines.join("\n");
}
