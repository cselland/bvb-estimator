"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { MODEL_DATA, type ModelName } from "@/lib/models";

const MODEL_OPTIONS = Object.keys(MODEL_DATA) as ModelName[];

export default function ComparisonPage() {
  const [annualLicenseCost, setAnnualLicenseCost] = useState(120000);
  const [annualSupportCost, setAnnualSupportCost] = useState(25000);
  const [oneTimeSetupFee, setOneTimeSetupFee] = useState(40000);

  const [primaryTool, setPrimaryTool] = useState<ModelName>("Claude 4.7 Opus");
  const [secondaryTool, setSecondaryTool] = useState<ModelName>("Microsoft Copilot (Enterprise)");
  const [differentiation, setDifferentiation] = useState(3);
  const [developerResourceCount, setDeveloperResourceCount] = useState(4);

  const primaryProvider = MODEL_DATA[primaryTool].provider;
  const secondaryProvider = MODEL_DATA[secondaryTool].provider;
  const primaryWeight = MODEL_DATA[primaryTool].coefficient;
  const secondaryWeight = MODEL_DATA[secondaryTool].coefficient;
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
    <main className="min-h-screen bg-df-canvas px-6 py-10 text-df-ink">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-df-mint">Executive dashboard</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Build vs Buy Comparison Inputs</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-600">
            Configure vendor-side and proprietary build-side assumptions with side-by-side controls.
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Vendor (Buy)</CardTitle>
              <p className="text-sm text-slate-600">Recurring software costs and one-time onboarding assumptions.</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Annual License Cost</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={annualLicenseCost}
                  onChange={(e) => setAnnualLicenseCost(Math.max(0, Number(e.target.value)))}
                  className="h-12 w-full rounded-lg border border-df-line bg-df-field px-3 text-base font-medium text-df-ink focus:border-df-mint focus:outline-none focus:ring-2 focus:ring-df-mint/20"
                  aria-label="Annual license cost"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Annual Support Cost</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={annualSupportCost}
                  onChange={(e) => setAnnualSupportCost(Math.max(0, Number(e.target.value)))}
                  className="h-12 w-full rounded-lg border border-df-line bg-df-field px-3 text-base font-medium text-df-ink focus:border-df-mint focus:outline-none focus:ring-2 focus:ring-df-mint/20"
                  aria-label="Annual support cost"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">One-Time Setup Fee</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={oneTimeSetupFee}
                  onChange={(e) => setOneTimeSetupFee(Math.max(0, Number(e.target.value)))}
                  className="h-12 w-full rounded-lg border border-df-line bg-df-field px-3 text-base font-medium text-df-ink focus:border-df-mint focus:outline-none focus:ring-2 focus:ring-df-mint/20"
                  aria-label="One-time setup fee"
                />
              </div>

              <div className="rounded-lg border border-df-line bg-df-canvas p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Buy baseline (3-year)</div>
                <div className="mt-1 text-2xl font-black tabular-nums">
                  ${buyTco3Year.toLocaleString("en-US")}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proprietary (Build)</CardTitle>
              <p className="text-sm text-slate-600">Model choices, differentiation, and team resourcing assumptions.</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Primary AI Tool</label>
                <Select value={primaryTool} onValueChange={(v) => setPrimaryTool(v as ModelName)}>
                  <SelectTrigger aria-label="Primary AI Tool">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_OPTIONS.map((tool) => (
                      <SelectItem key={tool} value={tool}>
                        {tool}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-slate-500">Provider: {primaryProvider}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Secondary AI Tool</label>
                <Select value={secondaryTool} onValueChange={(v) => setSecondaryTool(v as ModelName)}>
                  <SelectTrigger aria-label="Secondary AI Tool">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_OPTIONS.map((tool) => (
                      <SelectItem key={tool} value={tool}>
                        {tool}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-slate-500">Provider: {secondaryProvider}</p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Differentiation</label>
                  <span className="rounded-md border border-df-line bg-df-field px-2 py-0.5 text-sm font-semibold">
                    {differentiation} / 5
                  </span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[differentiation]}
                  onValueChange={(v) => setDifferentiation(v[0] ?? 3)}
                  aria-label="Differentiation"
                />
                <div className="mt-1 text-xs text-slate-500">{differentiationLabel}</div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Developer Resource Count</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={developerResourceCount}
                  onChange={(e) => setDeveloperResourceCount(Math.max(0, Number(e.target.value)))}
                  className="h-12 w-full rounded-lg border border-df-line bg-df-field px-3 text-base font-medium text-df-ink focus:border-df-mint focus:outline-none focus:ring-2 focus:ring-df-mint/20"
                  aria-label="Developer resource count"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>3-Year Cumulative Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tickFormatter={(v) => `$${Number(v).toLocaleString("en-US")}`}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={95}
                    />
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString("en-US")}`} />
                    <Bar dataKey="Buy" fill="#00c896" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Build" fill="#7075db" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        <div
          className={`mt-8 rounded-xl border px-6 py-5 ${
            winner === "Proprietary (Build)" ? "border-emerald-300 bg-emerald-50" : "border-df-line bg-white"
          }`}
        >
          <div className={`text-xl font-black ${winner === "Proprietary (Build)" ? "text-emerald-700" : "text-df-ink"}`}>
            Strategic Recommendation
          </div>
          <p className={`mt-1 text-sm font-semibold ${winner === "Proprietary (Build)" ? "text-emerald-700" : "text-slate-700"}`}>
            Winner: {winner}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            3-year savings: ${winnerSavings.toLocaleString("en-US")}
          </p>
          {differentiation <= 2 && <p className="mt-2 text-xs text-slate-600">Standard workflow: Buy may be safer for compliance.</p>}
        </div>
      </div>
    </main>
  );
}
