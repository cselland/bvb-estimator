"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ModelGroups } from "@/components/model-groups";
import { findValue, idFromValue, optionValue, pricingLabel, type ModelCatalog } from "@/lib/model-catalog";

export default function Comparison({ catalog }: { catalog: ModelCatalog }) {
  const [annualLicenseCost, setAnnualLicenseCost] = useState(120000);
  const [annualSupportCost, setAnnualSupportCost] = useState(25000);
  const [oneTimeSetupFee, setOneTimeSetupFee] = useState(40000);

  const firstValue = optionValue(catalog.groups[0]!.key, catalog.groups[0]!.ids[0]!);
  const [primaryTool, setPrimaryTool] = useState<string>(() => findValue(catalog, catalog.defaults.primary) ?? firstValue);
  const [secondaryTool, setSecondaryTool] = useState<string>(
    () => findValue(catalog, "Microsoft Copilot (Enterprise)") ?? findValue(catalog, catalog.defaults.secondary) ?? firstValue,
  );
  const primaryModel = catalog.models[idFromValue(primaryTool)]!;
  const secondaryModel = catalog.models[idFromValue(secondaryTool)]!;
  const priceLabel = pricingLabel(catalog.provenance);
  const [differentiation, setDifferentiation] = useState(3);
  const [developerResourceCount, setDeveloperResourceCount] = useState(4);

  const primaryProvider = primaryModel.provider;
  const secondaryProvider = secondaryModel.provider;
  const primaryWeight = primaryModel.coefficient;
  const secondaryWeight = secondaryModel.coefficient;
  const weightedAverage = (primaryWeight + secondaryWeight) / 2;
  const tokenSpend = annualLicenseCost * 0.15 * differentiation * weightedAverage;
  const labor = tokenSpend * 1.5 * Math.max(1, developerResourceCount / 4);
  const buildYear1 = tokenSpend + labor;
  const buildMaintenanceAnnual = buildYear1 * 0.1;
  const buyAnnual = annualLicenseCost + annualSupportCost;
  const buyYear1 = buyAnnual + oneTimeSetupFee;
  const chartData = [
    { year: "Year 1", Buy: Math.round(buyYear1), Build: Math.round(buildYear1) },
    { year: "Year 2", Buy: Math.round(buyYear1 + buyAnnual), Build: Math.round(buildYear1 + buildMaintenanceAnnual) },
    {
      year: "Year 3",
      Buy: Math.round(buyYear1 + buyAnnual * 2),
      Build: Math.round(buildYear1 + buildMaintenanceAnnual * 2),
    },
  ];
  const buyTco3Year = chartData[2].Buy;
  const buildTco3Year = chartData[2].Build;
  const winner = buildTco3Year < buyTco3Year ? "Proprietary (Build)" : "Vendor (Buy)";
  const winnerSavings = Math.abs(buyTco3Year - buildTco3Year);

  const differentiationLabel = useMemo(() => {
    if (differentiation <= 2) return "Low differentiation";
    if (differentiation >= 4) return "High differentiation";
    return "Moderate differentiation";
  }, [differentiation]);

  return (
    <main className="min-h-screen bg-df-paper text-df-body">
      <SiteHeader />
      <div className="mx-auto max-w-df-canvas px-8 md:px-df-inset pt-[92px] pb-16">
        <header className="mb-12 flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <span className="block h-px w-[56px] bg-df-oxblood" aria-hidden="true" />
            <p className="df-eyebrow text-df-oxblood">Executive dashboard</p>
          </div>
          <h1 className="df-display">Build vs buy comparison inputs</h1>
          <p className="df-lead">
            Configure vendor-side and proprietary build-side assumptions with side-by-side controls.
          </p>
        </header>

        <div className="border-t border-df-ink" />

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-x-[72px] gap-y-12 pt-[72px]">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h2 className="df-h2">Vendor (Buy)</h2>
              <p className="df-dek">Recurring software costs and one-time onboarding assumptions.</p>
            </div>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="df-eyebrow text-df-meta">Annual license cost</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={annualLicenseCost}
                  onChange={(e) => setAnnualLicenseCost(Math.max(0, Number(e.target.value)))}
                  className="df-field df-field-num"
                  aria-label="Annual license cost"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="df-eyebrow text-df-meta">Annual support cost</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={annualSupportCost}
                  onChange={(e) => setAnnualSupportCost(Math.max(0, Number(e.target.value)))}
                  className="df-field df-field-num"
                  aria-label="Annual support cost"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="df-eyebrow text-df-meta">One-time setup fee</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={oneTimeSetupFee}
                  onChange={(e) => setOneTimeSetupFee(Math.max(0, Number(e.target.value)))}
                  className="df-field df-field-num"
                  aria-label="One-time setup fee"
                />
              </div>

              <div className="df-tool-card flex flex-col gap-2">
                <div className="df-eyebrow text-df-ink">Buy baseline (3-year)</div>
                <div className="df-mono text-[33px] leading-none text-df-ink">
                  ${buyTco3Year.toLocaleString("en-US")}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h2 className="df-h2">Proprietary (Build)</h2>
              <p className="df-dek">Model choices, differentiation, and team resourcing assumptions.</p>
            </div>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="df-eyebrow text-df-meta">Primary AI tool</label>
                <Select value={primaryTool} onValueChange={(v) => setPrimaryTool(v)}>
                  <SelectTrigger aria-label="Primary AI Tool">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <ModelGroups catalog={catalog} />
                  </SelectContent>
                </Select>
                <p className="df-meta text-[12px]">Provider: {primaryProvider}</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="df-eyebrow text-df-meta">Secondary AI tool</label>
                <Select value={secondaryTool} onValueChange={(v) => setSecondaryTool(v)}>
                  <SelectTrigger aria-label="Secondary AI Tool">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <ModelGroups catalog={catalog} />
                  </SelectContent>
                </Select>
                <p className="df-meta text-[12px]">Provider: {secondaryProvider}</p>
              </div>

              <p className="df-meta text-[11px]" title={priceLabel.title ?? undefined}>
                {priceLabel.text}
              </p>

              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <label className="df-eyebrow text-df-meta">Differentiation</label>
                  <span className="df-mono text-[13px] text-df-ink">{differentiation} / 5</span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[differentiation]}
                  onValueChange={(v) => setDifferentiation(v[0] ?? 3)}
                  aria-label="Differentiation"
                />
                <div className="df-meta text-[12px]">{differentiationLabel}</div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="df-eyebrow text-df-meta">Developer resource count</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={developerResourceCount}
                  onChange={(e) => setDeveloperResourceCount(Math.max(0, Number(e.target.value)))}
                  className="df-field df-field-num"
                  aria-label="Developer resource count"
                />
              </div>
            </div>
          </div>

          <div className="col-span-full flex flex-col gap-5 border-t border-df-ink pt-[72px]">
            <h2 className="df-h2">3-year cumulative cost</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                  <CartesianGrid stroke="#DAD5CB" vertical={false} />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: "#65616B", fontSize: 12, fontFamily: "var(--font-jetbrains-mono)" }}
                    axisLine={{ stroke: "#141414" }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${Number(v).toLocaleString("en-US")}`}
                    tick={{ fill: "#65616B", fontSize: 11, fontFamily: "var(--font-jetbrains-mono)" }}
                    axisLine={false}
                    tickLine={false}
                    width={95}
                  />
                  <Tooltip
                    cursor={{ fill: "#ECE7DE" }}
                    contentStyle={{
                      background: "#F7F5F0",
                      border: "1px solid #141414",
                      borderRadius: 0,
                      color: "#141414",
                      fontFamily: "var(--font-jetbrains-mono)",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => `$${value.toLocaleString("en-US")}`}
                  />
                  {/* Motion is color-only in this system (spec §6) — no grow-in. */}
                  <Bar dataKey="Buy" fill="#141414" isAnimationActive={false} />
                  <Bar dataKey="Build" fill="#8C2B49" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <div className="df-tool-card mt-12 flex flex-col gap-2">
          <div className="df-eyebrow text-df-ink">Strategic recommendation</div>
          <p className="df-h4">Winner: {winner}</p>
          <p className="df-mono text-[19px] text-df-ink">
            3-year savings: ${winnerSavings.toLocaleString("en-US")}
          </p>
          {differentiation <= 2 && (
            <p className="df-meta text-[12px]">
              Standard workflow: buying may be safer for compliance.
            </p>
          )}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
