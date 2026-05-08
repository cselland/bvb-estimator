"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatMonths, formatSaasCost } from "@/lib/format";
import type { ScenarioTimelineEntry } from "@/lib/scenario-payload";
import {
  MODEL_COST_COEFFICIENTS,
  calculateEstimatedTokenSpend,
  computeScenario,
  type ModelToolName,
  type ScenarioInputs,
} from "@/lib/tco";

interface RangeSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  minLabel?: string;
  maxLabel?: string;
  tooltip?: string;
  onChange: (v: number) => void;
}

function RangeSlider({ label, value, min, max, step, displayValue, minLabel, maxLabel, tooltip, onChange }: RangeSliderProps) {
  const defaultMinLabel = min === 1 ? "1" : formatSaasCost(min);
  const defaultMaxLabel = max <= 12 ? String(max) : formatSaasCost(max);
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1.5">
          <label className="text-sm font-medium text-slate-700">{label}</label>
          {tooltip && (
            <div className="relative group">
              <svg
                className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="absolute left-0 bottom-full mb-2 w-56 z-10 pointer-events-none
                opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <div className="bg-white border border-df-line rounded-lg px-3 py-2 text-xs text-slate-600 shadow-xl leading-relaxed">
                  {tooltip}
                </div>
                <div className="w-2 h-2 bg-white border-r border-b border-df-line rotate-45 ml-1.5 -mt-1.5" />
              </div>
            </div>
          )}
        </div>
        <span className="text-sm font-semibold text-df-ink bg-df-field border border-df-line px-2 py-0.5 rounded-md">
          {displayValue}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        aria-label={label}
      />
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>{minLabel ?? defaultMinLabel}</span>
        <span>{maxLabel ?? defaultMaxLabel}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const modelOptions = Object.keys(MODEL_COST_COEFFICIENTS) as ModelToolName[];
  const [timeToGoLive, setTimeToGoLive] = useState(6);
  const [appLifespan, setAppLifespan] = useState(36);
  const [annualSaasLicenseCost, setAnnualSaasLicenseCost] = useState(80_000);
  const [annualSaasSupportCost, setAnnualSaasSupportCost] = useState(20_000);
  const [annualCostIncreasePct, setAnnualCostIncreasePct] = useState(8);
  const [appCriticality, setAppCriticality] = useState(3);
  const [selfCodingAppetite, setSelfCodingAppetite] = useState(3);
  const [customizationImportance, setCustomizationImportance] = useState(3);
  const [differentiationLevel, setDifferentiationLevel] = useState(3.0);
  const [primaryTool, setPrimaryTool] = useState<ModelToolName>("Claude 4.7 Opus");
  const [secondaryTool, setSecondaryTool] = useState<ModelToolName>("Gemini 3.1 Pro");
  const [saasImplementationCost, setSaasImplementationCost] = useState(25_000);
  const [buildEngineers, setBuildEngineers] = useState(2);
  const [buildTimeframeMonths, setBuildTimeframeMonths] = useState(6);
  const [costPerEngineerPerYear, setCostPerEngineerPerYear] = useState(150_000);
  const [supportReps, setSupportReps] = useState(0);
  const [costPerRepPerYear, setCostPerRepPerYear] = useState(85_000);
  const [email, setEmail] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reportPath, setReportPath] = useState<string | null>(null);
  const [emailQueued, setEmailQueued] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  /** Recharts measures parent width; mounting after paint avoids an empty / broken chart. */
  const [chartReady, setChartReady] = useState(false);
  /** Full history of calculator state for reports (distinct snapshots only). */
  const inputTimelineRef = useRef<ScenarioTimelineEntry[]>([]);
  const annualSaasCost = annualSaasLicenseCost + annualSaasSupportCost;

  function getDifferentiationLabel(value: number) {
    if (value <= 1.5) return "Pure Commodity/Standard CRUD";
    if (value >= 4.5) return "Unique IP/Custom Intelligence";
    return "High Business Logic";
  }

  useEffect(() => {
    setSessionId(`SCN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setChartReady(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const inputs: ScenarioInputs = {
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
  };

  const inputsKey = useMemo(
    () => JSON.stringify(inputs),
    [
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
    ],
  );

  useEffect(() => {
    const parsed = JSON.parse(inputsKey) as ScenarioInputs;
    const timeline = inputTimelineRef.current;
    const last = timeline[timeline.length - 1];
    if (
      last &&
      JSON.stringify(last.inputs) === inputsKey &&
      last.primaryTool === primaryTool &&
      last.secondaryTool === secondaryTool
    ) {
      return;
    }
    timeline.push({
      at: new Date().toISOString(),
      inputs: parsed,
      primaryTool,
      secondaryTool,
    });
    if (timeline.length > 250) {
      inputTimelineRef.current = timeline.slice(-250);
    }
  }, [inputsKey, primaryTool, secondaryTool]);

  const {
    horizonYears,
    annualSupportCost,
    buildThreeYearTco,
    saasThreeYearTco,
    verdict,
    chartData,
  } = computeScenario(inputs);
  const cheaperOption = buildThreeYearTco <= saasThreeYearTco ? "Proprietary (Build)" : "Vendor (Buy)";
  const savingsAmount = Math.abs(buildThreeYearTco - saasThreeYearTco);
  const primaryCoefficient = MODEL_COST_COEFFICIENTS[primaryTool];
  const tokenSpendEstimate = calculateEstimatedTokenSpend({
    annualSaasCost,
    differentiationLevel,
    primaryModel: primaryTool,
    secondaryModel: secondaryTool,
    horizonYears,
  });

  async function handleSaveReport(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId) return;
    setSaveError(null);
    setReportPath(null);
    setEmailQueued(false);
    setSaveLoading(true);
    try {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          email: email.trim() || null,
          inputs,
          inputTimeline: inputTimelineRef.current,
          finalPrimaryTool: primaryTool,
          finalSecondaryTool: secondaryTool,
        }),
        signal: AbortSignal.timeout(60_000),
      });
      let data: { error?: string; reportUrl?: string; emailQueued?: boolean };
      try {
        data = (await res.json()) as { error?: string; reportUrl?: string; emailQueued?: boolean };
      } catch {
        throw new Error(
          res.ok
            ? "Server returned non-JSON (check deployment logs)."
            : `Save failed (${res.status}). The API may be down or misconfigured.`
        );
      }
      if (!res.ok) throw new Error(data.error || "Could not save scenario");
      setReportPath(data.reportUrl ?? null);
      setEmailQueued(Boolean(data.emailQueued));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setSaveError("Request timed out after 60s — the server may be stuck on the database or network.");
      } else {
        setSaveError(err instanceof Error ? err.message : "Could not save scenario");
      }
    } finally {
      setSaveLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-df-canvas text-df-ink">
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-32 flex items-center justify-between gap-4">
          <a href="https://differentialfactor.com" className="flex items-center min-w-0 hover:opacity-90 transition-opacity">
            <img
              src="/images/df-logo-full.jpg"
              alt="Differential Factor"
              width={1024}
              height={340}
              className="h-[4.5rem] sm:h-[5.25rem] md:h-[6rem] w-auto max-w-[min(100%,calc(100vw-11rem))] sm:max-w-[840px] md:max-w-[1020px] object-contain object-left"
            />
          </a>
          <div className="text-right shrink-0">
            <div className="text-sm sm:text-base font-bold tracking-tight text-white">
              Build vs. Buy calculator
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16 relative">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-df-mint/10 blur-[120px] rounded-full pointer-events-none" aria-hidden />
        <header className="mb-12 md:mb-16 relative z-10 max-w-4xl">
          <p className="text-df-mint font-bold tracking-[0.3em] uppercase text-sm mb-6">
            Strategic decision tool
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-[0.95] text-df-ink">
            Build vs.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-df-mint to-df-iris">
              Buy calculator
            </span>
          </h1>
          <p className="text-lg text-slate-700 mt-8 max-w-3xl font-light leading-relaxed">
            This tool is designed for customers evaluating a SaaS purchase or renewal and wanting to assess
            the feasibility and long-term total cost of ownership of building the capability in-house. Adjust
            the parameters below to model your TCO and get a strategic recommendation.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 relative z-10">
          <div className="bg-white p-6 md:p-8 shadow-sm border border-df-line border-l-4 border-l-df-mint">
            <h2 className="text-df-mint font-bold tracking-[0.3em] uppercase text-sm mb-8">
              Parameters
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="border border-df-line rounded-xl p-5 bg-df-canvas/40">
                <h2 className="text-df-mint font-black tracking-wide text-2xl mb-5">Buy</h2>
                <RangeSlider
                  label="Expected App Lifespan"
                  value={appLifespan}
                  min={12}
                  max={60}
                  step={12}
                  minLabel="1 yr"
                  maxLabel="5 yrs"
                  tooltip="How long do you expect this solution to remain in active use? Longer lifespans increase total SaaS spend and can shift buy economics."
                  displayValue={`${Math.round(appLifespan / 12)} yr${appLifespan === 12 ? "" : "s"}`}
                  onChange={setAppLifespan}
                />
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-700">Proposed Annual SaaS License ($)</label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base">$</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={annualSaasLicenseCost}
                      onChange={(e) => setAnnualSaasLicenseCost(Math.max(0, Number(e.target.value)))}
                      aria-label="Proposed annual SaaS license in dollars"
                      className="w-full bg-df-field border border-df-line rounded-xl pl-9 pr-4 py-4 text-xl font-semibold text-df-ink focus:outline-none focus:border-df-mint focus:ring-2 focus:ring-df-mint/20"
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-700">Proposed Annual Support Cost ($)</label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base">$</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={annualSaasSupportCost}
                      onChange={(e) => setAnnualSaasSupportCost(Math.max(0, Number(e.target.value)))}
                      aria-label="Proposed annual support cost in dollars"
                      className="w-full bg-df-field border border-df-line rounded-xl pl-9 pr-4 py-4 text-xl font-semibold text-df-ink focus:outline-none focus:border-df-mint focus:ring-2 focus:ring-df-mint/20"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Annual SaaS Cost Total: {formatCurrency(annualSaasCost)}
                  </p>
                </div>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-700">Annual Cost Increase (%)</label>
                    <span className="text-xs text-slate-500">compounded over lifespan</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={annualCostIncreasePct}
                      onChange={(e) => setAnnualCostIncreasePct(Math.max(0, Number(e.target.value)))}
                      aria-label="Annual SaaS cost increase percentage"
                      className="w-full bg-df-field border border-df-line rounded-lg pl-4 pr-10 py-2 text-sm text-df-ink focus:outline-none focus:border-df-mint focus:ring-2 focus:ring-df-mint/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-1.5">
                      <label className="text-sm font-medium text-slate-700">SaaS Implementation Cost</label>
                    </div>
                    <span className="text-xs text-slate-500">one-time</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={saasImplementationCost}
                      onChange={(e) => setSaasImplementationCost(Math.max(0, Number(e.target.value)))}
                      aria-label="SaaS implementation cost in dollars"
                      className="w-full bg-df-field border border-df-line rounded-lg pl-7 pr-4 py-2 text-sm text-df-ink focus:outline-none focus:border-df-mint focus:ring-2 focus:ring-df-mint/20"
                    />
                  </div>
                </div>
                <RangeSlider
                  label="Customization Importance"
                  value={customizationImportance}
                  min={1}
                  max={5}
                  step={1}
                  tooltip="How much does this app need to be tailored to your specific business?"
                  displayValue={`${customizationImportance} / 5`}
                  onChange={setCustomizationImportance}
                />
                <RangeSlider
                  label="Differentiation"
                  value={differentiationLevel}
                  min={1}
                  max={5}
                  step={0.1}
                  minLabel="1.0"
                  maxLabel="5.0"
                  tooltip="How differentiating is this app to your business?"
                  displayValue={`${differentiationLevel.toFixed(1)} - ${getDifferentiationLabel(differentiationLevel)}`}
                  onChange={setDifferentiationLevel}
                />
                <RangeSlider
                  label="App Criticality"
                  value={appCriticality}
                  min={1}
                  max={5}
                  step={1}
                  tooltip="Higher criticality increases required quality and resilience."
                  displayValue={`${appCriticality} / 5`}
                  onChange={setAppCriticality}
                />
              </div>

              <div className="border border-df-line rounded-xl p-5 bg-white">
                <h2 className="text-df-iris font-black tracking-wide text-2xl mb-5">Build</h2>
                <RangeSlider
                  label="Time to Go Live"
                  value={timeToGoLive}
                  min={1}
                  max={24}
                  step={1}
                  minLabel="1 mo"
                  maxLabel="2 yrs"
                  tooltip="Short delivery windows can add a rush premium to build cost."
                  displayValue={formatMonths(timeToGoLive)}
                  onChange={setTimeToGoLive}
                />
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">Primary AI Tool</label>
                    <Select value={primaryTool} onValueChange={(value) => setPrimaryTool(value as ModelToolName)}>
                      <SelectTrigger aria-label="Primary AI tool">
                        <SelectValue placeholder="Select primary model" />
                      </SelectTrigger>
                      <SelectContent>
                        {modelOptions.map((tool) => (
                          <SelectItem key={tool} value={tool}>
                            {tool}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {primaryTool.includes("Microsoft Copilot") && (
                      <div className="mt-2 w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                        Uses existing Azure/M365 Credits - High Compliance Tier.
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">Secondary AI Tool</label>
                    <Select value={secondaryTool} onValueChange={(value) => setSecondaryTool(value as ModelToolName)}>
                      <SelectTrigger aria-label="Secondary AI tool">
                        <SelectValue placeholder="Select secondary model" />
                      </SelectTrigger>
                      <SelectContent>
                        {modelOptions.map((tool) => (
                          <SelectItem key={tool} value={tool}>
                            {tool}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <RangeSlider
                  label="Self-Coding Appetite"
                  value={selfCodingAppetite}
                  min={1}
                  max={5}
                  step={1}
                  tooltip="Higher appetite means faster AI-assisted build velocity."
                  displayValue={`${selfCodingAppetite} / 5`}
                  onChange={setSelfCodingAppetite}
                />
                <RangeSlider
                  label="Engineers Needed to Build"
                  value={buildEngineers}
                  min={1}
                  max={20}
                  step={1}
                  minLabel="1"
                  maxLabel="20"
                  tooltip="Dedicated engineering headcount for build delivery."
                  displayValue={`${buildEngineers} engineer${buildEngineers !== 1 ? "s" : ""}`}
                  onChange={setBuildEngineers}
                />
                <RangeSlider
                  label="Build Timeframe"
                  value={buildTimeframeMonths}
                  min={1}
                  max={24}
                  step={1}
                  minLabel="1 mo"
                  maxLabel="2 yrs"
                  tooltip="Planned implementation window for proprietary build."
                  displayValue={formatMonths(buildTimeframeMonths)}
                  onChange={setBuildTimeframeMonths}
                />
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-700">Cost per Engineer / Year</label>
                    <span className="text-xs text-slate-500">
                      {formatCurrency(buildEngineers * costPerEngineerPerYear)}/yr total
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      min={0}
                      step={5000}
                      value={costPerEngineerPerYear}
                      onChange={(e) => setCostPerEngineerPerYear(Math.max(0, Number(e.target.value)))}
                      aria-label="Cost per engineer per year in dollars"
                      className="w-full bg-df-field border border-df-line rounded-lg pl-7 pr-4 py-2 text-sm text-df-ink focus:outline-none focus:border-df-mint focus:ring-2 focus:ring-df-mint/20"
                    />
                  </div>
                </div>
                <RangeSlider
                  label="Support Reps Needed"
                  value={supportReps}
                  min={0}
                  max={20}
                  step={1}
                  minLabel="0"
                  maxLabel="20"
                  tooltip="Dedicated support/ops staffing for the built solution."
                  displayValue={`${supportReps} rep${supportReps !== 1 ? "s" : ""}`}
                  onChange={setSupportReps}
                />
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-700">Cost per Rep / Year</label>
                    {annualSupportCost > 0 && (
                      <span className="text-xs text-slate-500">{formatCurrency(annualSupportCost)}/yr total</span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={costPerRepPerYear}
                      onChange={(e) => setCostPerRepPerYear(Math.max(0, Number(e.target.value)))}
                      aria-label="Cost per support rep per year in dollars"
                      className="w-full bg-df-field border border-df-line rounded-lg pl-7 pr-4 py-2 text-sm text-df-ink focus:outline-none focus:border-df-mint focus:ring-2 focus:ring-df-mint/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-df-canvas border border-df-line border-l-4 border-l-df-iris rounded-xl p-5">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em] mb-2">
                Executive Summary
              </div>
              <div className="text-2xl font-black tracking-tight mb-2 text-df-ink">
                {tokenSpendEstimate.recommendation === "MODEL_STACK" ? "MODEL STACK" : "VENDOR SAAS"}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Using <span className="font-semibold">{primaryTool}</span> as primary and{" "}
                <span className="font-semibold">{secondaryTool}</span> as secondary at differentiation{" "}
                <span className="font-semibold">{differentiationLevel.toFixed(1)} / 5</span>, the estimator updates
                your {horizonYears}-year Build vs Buy view in real time.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-white border border-df-line rounded-lg p-3">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">{horizonYears}-Year Build Cost</div>
                  <div className="text-base font-bold text-df-ink tabular-nums">
                    {formatCurrency(tokenSpendEstimate.estimatedThreeYearTokenTco)}
                  </div>
                </div>
                <div className="bg-white border border-df-line rounded-lg p-3">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">{horizonYears}-Year Buy Cost</div>
                  <div className="text-base font-bold text-df-ink tabular-nums">
                    {formatCurrency(tokenSpendEstimate.threeYearSaasTco)}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-600">
                Delta (Build - Buy):{" "}
                <span className={`font-semibold ${tokenSpendEstimate.deltaVsSaas <= 0 ? "text-df-mint" : "text-df-iris"}`}>
                  {tokenSpendEstimate.deltaVsSaas <= 0 ? "-" : "+"}
                  {formatCurrency(Math.abs(tokenSpendEstimate.deltaVsSaas))}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Applied primary model weight: <span className="font-semibold">{primaryCoefficient.toFixed(2)}</span> (
                {primaryTool})
              </div>
            </div>
          </div>

        </div>

        <Card className="overflow-hidden mt-10 relative z-10">
          <CardHeader className="pb-4 border-b border-df-line bg-df-canvas/40">
            <CardTitle>Build vs Buy Comparison</CardTitle>
            <p className="text-sm text-slate-600">
              Side-by-side {horizonYears}-year TCO comparison for vendor purchase vs proprietary build.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-df-line bg-white p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-[0.18em] mb-2">
                  Vendor (Buy)
                </div>
                <div className="text-3xl font-black text-df-mint tabular-nums">
                  {formatCurrency(saasThreeYearTco)}
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Includes license, implementation, and support-linked SaaS spend.
                </p>
              </div>
              <div className="rounded-lg border border-df-line bg-white p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-[0.18em] mb-2">
                  Proprietary (Build)
                </div>
                <div className="text-3xl font-black text-df-iris tabular-nums">
                  {formatCurrency(buildThreeYearTco)}
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Includes development, maintenance, and ongoing support costs.
                </p>
              </div>
            </div>

            <div className="mt-5 h-[260px] w-full min-w-0 rounded-lg border border-df-line bg-white p-3">
              {chartReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tickFormatter={(v) => formatCurrency(v)}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        color: "#161b22",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", color: "#64748b" }} />
                    <Bar dataKey="Custom Build" fill="#7075db" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Vendor SaaS" fill="#00c896" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-400 border border-dashed border-df-line rounded-lg bg-df-canvas/50">
                  Loading chart…
                </div>
              )}
            </div>

            <div
              className={`mt-5 rounded-xl border px-5 py-4 ${
                cheaperOption === "Proprietary (Build)"
                  ? "border-df-iris/30 bg-df-iris/10"
                  : "border-df-mint/30 bg-df-mint/10"
              }`}
            >
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                {horizonYears}-Year Savings
              </div>
              <div className="mt-1 flex items-end justify-between gap-3">
                <div className="text-3xl md:text-4xl font-black tabular-nums text-df-ink">
                  {formatCurrency(savingsAmount)}
                </div>
                <div className="text-2xl md:text-3xl font-black text-slate-700 text-right leading-tight">
                  Recommended option: {cheaperOption}
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Build estimate assumes 5x velocity via Vibe Coding.
            </p>
          </CardContent>
        </Card>

        <div className="mt-10 bg-white p-6 md:p-8 shadow-sm border-t border-[#161b22]/10 relative z-10">
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-sm font-semibold text-df-ink mb-1">
                Optional: save scenario &amp; generate report
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                Saves your inputs and a markdown summary to the database. Add your email if you want a copy sent
                (requires <span className="font-mono text-slate-600">RESEND_API_KEY</span> in server env).
              </p>
              <div className="text-xs text-slate-500 mt-2">
                Session ID:{" "}
                <span className="font-mono text-df-iris font-medium">{sessionId ?? "—"}</span>
              </div>
            </div>

            {reportPath ? (
              <div className="rounded-lg border border-df-mint/40 bg-df-mint/5 px-4 py-3 text-sm text-df-ink">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-df-mint shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="font-semibold text-df-ink">Scenario saved</p>
                      <p className="text-slate-600 text-xs mt-0.5">
                        {emailQueued
                          ? "A summary email is being sent if your mail domain is configured."
                          : email.trim()
                            ? "Email not sent — configure Resend on the server to enable outbound mail."
                            : "Open your report below."}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={reportPath}
                    className="inline-flex justify-center bg-df-mint text-df-nav hover:brightness-110 transition shadow-md shadow-df-mint/15 text-sm font-bold px-5 py-2 rounded-full whitespace-nowrap"
                  >
                    View summary report
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReportPath(null);
                    setSaveError(null);
                    setEmailQueued(false);
                  }}
                  className="mt-2 text-xs font-medium text-df-iris hover:underline"
                >
                  Save another snapshot
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveReport} className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email (optional)"
                    autoComplete="email"
                    className="bg-df-field border border-df-line rounded-full px-4 py-2.5 text-sm text-df-ink placeholder-slate-400 focus:outline-none focus:border-df-mint focus:ring-2 focus:ring-df-mint/20 w-full sm:max-w-xs"
                  />
                  <button
                    type="submit"
                    disabled={saveLoading || !sessionId}
                    className="bg-df-mint text-df-nav hover:brightness-110 transition shadow-lg shadow-df-mint/20 text-sm font-bold px-6 py-2.5 rounded-full whitespace-nowrap disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {saveLoading ? "Saving…" : "Save & generate report"}
                  </button>
                </div>
                {saveError && <p className="text-sm text-red-600">{saveError}</p>}
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
