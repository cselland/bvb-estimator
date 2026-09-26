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
  OUTPUT_INTENSITY_LABELS,
  OUTPUT_SHARE,
  calculateEstimatedTokenSpend,
  computeScenario,
  type OutputIntensity,
  type ScenarioInputs,
} from "@/lib/tco";
import {
  findValue,
  idFromValue,
  optionValue,
  pricingLabel,
  type ModelCatalog,
} from "@/lib/model-catalog";
import { ModelGroups } from "@/components/model-groups";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

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
  const defaultMinLabel = min <= 1 ? String(min) : formatSaasCost(min);
  const defaultMaxLabel = max <= 12 ? String(max) : formatSaasCost(max);
  // `relative` lives on the root so the tooltip anchors to the column's left
  // edge, not the trigger — otherwise it runs off-screen on narrow viewports.
  return (
    <div className="relative flex flex-col gap-2 mb-7">
      <div className="flex justify-between items-baseline gap-3">
        <div className="flex items-center gap-1.5">
          <label className="df-eyebrow text-df-meta">{label}</label>
          {tooltip && (
            <div className="group flex items-center">
              <span
                className="df-mono text-[11px] text-df-meta hover:text-df-oxblood cursor-help transition-colors duration-df ease-df"
                aria-hidden="true"
              >
                ?
              </span>
              <div className="absolute left-0 bottom-full mb-2 w-full max-w-[224px] z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-df ease-df">
                <div className="bg-df-ink text-df-paper px-3 py-2 text-[13px] leading-relaxed font-body">
                  {tooltip}
                </div>
              </div>
            </div>
          )}
        </div>
        <span className="df-mono text-[13px] text-df-ink text-right">{displayValue}</span>
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
      <div className="flex justify-between df-meta text-[11px]">
        <span>{minLabel ?? defaultMinLabel}</span>
        <span>{maxLabel ?? defaultMaxLabel}</span>
      </div>
    </div>
  );
}

export default function Calculator({ catalog }: { catalog: ModelCatalog }) {
  const [dateNeeded, setDateNeeded] = useState("2026-12-01");
  const [appLifespan, setAppLifespan] = useState(36);
  const [annualSaasLicenseCost, setAnnualSaasLicenseCost] = useState(80_000);
  const [annualSaasSupportCost, setAnnualSaasSupportCost] = useState(20_000);
  const [annualCostIncreasePct, setAnnualCostIncreasePct] = useState(8);
  const [appCriticality, setAppCriticality] = useState(3);
  const [selfCodingAppetite, setSelfCodingAppetite] = useState(3);
  const [customizationImportance, setCustomizationImportance] = useState(3);
  const [differentiationLevel, setDifferentiationLevel] = useState(3.0);
  // Select values are group-scoped ("premium|<id>"); resolve to a model via idFromValue.
  const [primaryValue, setPrimaryValue] = useState<string>(
    () => findValue(catalog, catalog.defaults.primary) ?? optionValue(catalog.groups[0]!.key, catalog.groups[0]!.ids[0]!),
  );
  const [secondaryValue, setSecondaryValue] = useState<string>(
    () => findValue(catalog, catalog.defaults.secondary) ?? "none",
  );
  const primaryModel = catalog.models[idFromValue(primaryValue)]!;
  const secondaryModel = secondaryValue === "none" ? null : catalog.models[idFromValue(secondaryValue)] ?? null;
  const primaryTool = primaryModel.label;
  const secondaryTool = secondaryModel?.label ?? "None";
  const priceSnapshotId = catalog.provenance.snapshotId;
  const priceLabel = pricingLabel(catalog.provenance);
  const [primaryModelWeight, setPrimaryModelWeight] = useState(70);
  const [outputIntensity, setOutputIntensity] = useState<OutputIntensity>("medium");
  /** Advanced output-share override, in percent; null = use the preset. */
  const [outputSharePct, setOutputSharePct] = useState<number | null>(null);
  const [saasImplementationCost, setSaasImplementationCost] = useState(25_000);
  const [buildEngineers, setBuildEngineers] = useState(2);
  const [buildTimeframeMonths, setBuildTimeframeMonths] = useState(6);
  const [costPerEngineerPerYear, setCostPerEngineerPerYear] = useState(150_000);
  const [supportReps, setSupportReps] = useState(0);
  const [costPerRepPerYear, setCostPerRepPerYear] = useState(85_000);
  const [appName, setAppName] = useState("");
  const [appDescription, setAppDescription] = useState("");
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
  const sessionIdRef = useRef<string | null>(null);
  const eventBufferRef = useRef<Array<{ control: string; value: string; seq: number; occurred_at: string }>>([]);
  const eventSeqRef = useRef(0);
  const controlTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const annualSaasCost = annualSaasLicenseCost + annualSaasSupportCost;
  const timeToGoLive = useMemo(() => {
    const today = new Date();
    const target = new Date(dateNeeded);
    const months = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    return Math.max(1, months);
  }, [dateNeeded]);

  function getDifferentiationLabel(value: number) {
    if (value <= 1.5) return "Pure Commodity/Standard CRUD";
    if (value >= 4.5) return "Unique IP/Custom Intelligence";
    return "High Business Logic";
  }

  useEffect(() => {
    const sid = `SCN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    sessionIdRef.current = sid;
    setSessionId(sid);
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
      dateNeeded,
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
      last.primaryModelId === primaryModel.id &&
      last.secondaryModelId === (secondaryModel?.id ?? "none")
    ) {
      return;
    }
    timeline.push({
      at: new Date().toISOString(),
      inputs: parsed,
      primaryTool,
      secondaryTool,
      primaryModelId: primaryModel.id,
      secondaryModelId: secondaryModel?.id ?? "none",
      priceSnapshotId,
    });
    if (timeline.length > 250) {
      inputTimelineRef.current = timeline.slice(-250);
    }
  }, [inputsKey, primaryModel.id, secondaryModel?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced write to D1 on every input/context change (1.5 s after last edit).
  // Silently ignored when D1 is unavailable (plain `next dev`).
  useEffect(() => {
    if (!sessionId) return;
    const timer = setTimeout(() => {
      fetch(`/api/sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputs,
          appName: appName.trim() || null,
          appDescription: appDescription.trim() || null,
        }),
      }).catch(() => undefined);
    }, 1500);
    return () => clearTimeout(timer);
  }, [inputsKey, appName, appDescription, sessionId]);

  function logEvent(control: string, value: string | number, debounceMs = 500) {
    clearTimeout(controlTimers.current[control]);
    controlTimers.current[control] = setTimeout(() => {
      eventBufferRef.current.push({
        control,
        value: String(value),
        seq: ++eventSeqRef.current,
        occurred_at: new Date().toISOString(),
      });
    }, debounceMs);
  }

  function flushEvents() {
    const sid = sessionIdRef.current;
    if (!sid || eventBufferRef.current.length === 0) return;
    const batch = eventBufferRef.current.splice(0);
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sid, events: batch }),
    }).catch(() => undefined);
  }

  // Flush every 30 s and whenever the tab is hidden (covers navigation + close).
  // Uses refs only so deps array is safely empty.
  useEffect(() => {
    const interval = setInterval(flushEvents, 30_000);
    const onVisibility = () => { if (document.visibilityState === "hidden") flushEvents(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
  const tokenSpendEstimate = calculateEstimatedTokenSpend({
    annualSaasCost,
    differentiationLevel,
    primaryModel: primaryTool,
    secondaryModel: secondaryTool,
    primaryPricing: primaryModel,
    secondaryPricing: secondaryModel,
    primaryModelWeight,
    outputIntensity,
    outputShareOverride: outputSharePct === null ? null : outputSharePct / 100,
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
          appName: appName.trim() || null,
          appDescription: appDescription.trim() || null,
          inputs,
          inputTimeline: inputTimelineRef.current,
          finalPrimaryTool: primaryTool,
          finalSecondaryTool: secondaryTool,
          finalPrimaryModelId: primaryModel.id,
          finalSecondaryModelId: secondaryModel?.id ?? "none",
          pricing: catalog.provenance,
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
    <main className="min-h-screen bg-df-paper text-df-body">
      <SiteHeader
        sticky
        right={
          <span className="df-eyebrow text-df-meta hidden lg:block">Build vs. Buy</span>
        }
      />

      <div className="max-w-df-canvas mx-auto px-8 md:px-df-inset pt-[92px] pb-16">
        {/* Hero (spec §5) — Oxblood 56px hairline + mono eyebrow, H1, lead at 840px */}
        <header className="mb-16 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <span className="block h-px w-[56px] bg-df-oxblood" aria-hidden="true" />
            <p className="df-eyebrow text-df-oxblood">Strategic decision tool</p>
          </div>
          <h1 className="df-display">Build vs. buy SaaS calculator</h1>
          <p className="df-lead">
            This tool is for teams evaluating a SaaS purchase or renewal who need to assess the
            feasibility and long-term total cost of ownership of building the capability in-house.
          </p>
          <p className="df-body df-measure-body">
            Adjust the parameters below to model your total cost of ownership and get a strategic
            recommendation.
          </p>
        </header>

        <div className="border-t border-df-ink" />

        <div className="flex flex-col gap-16 pt-[72px]">
          <div className="flex flex-col gap-12">
            <section className="flex flex-col gap-5">
              <h2 className="df-h2">Application being evaluated</h2>
              <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  onBlur={(e) => logEvent("appName", e.target.value, 0)}
                  placeholder="Example: Customer Support CRM"
                  maxLength={120}
                  className="df-field df-field-sm"
                />
                <textarea
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  onBlur={(e) => logEvent("appDescription", e.target.value, 0)}
                  placeholder="Describe what this app is for and why this purchase or renewal is under review."
                  maxLength={1000}
                  rows={3}
                  className="df-field df-field-sm resize-y"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-baseline gap-3">
                  <label className="df-eyebrow text-df-meta">Date needed live</label>
                  <span className="df-mono text-[13px] text-df-ink">{timeToGoLive} mo away</span>
                </div>
                <input
                  type="date"
                  value={dateNeeded}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => { setDateNeeded(e.target.value); logEvent("dateNeeded", e.target.value, 0); }}
                  aria-label="Date the solution needs to be live"
                  className="df-field df-field-sm df-field-num"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-0 pt-2">
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
                  onChange={(v) => { setAppLifespan(v); logEvent("appLifespan", v); }}
                />
                <RangeSlider
                  label="App Criticality"
                  value={appCriticality}
                  min={1}
                  max={5}
                  step={1}
                  tooltip="Higher criticality increases required quality and resilience."
                  displayValue={`${appCriticality} / 5`}
                  onChange={(v) => { setAppCriticality(v); logEvent("appCriticality", v); }}
                />
                <RangeSlider
                  label="Customization Importance"
                  value={customizationImportance}
                  min={1}
                  max={5}
                  step={1}
                  tooltip="How much does this app need to be tailored to your specific business?"
                  displayValue={`${customizationImportance} / 5`}
                  onChange={(v) => { setCustomizationImportance(v); logEvent("customizationImportance", v); }}
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
                  onChange={(v) => { setDifferentiationLevel(v); logEvent("differentiationLevel", v); }}
                />
              </div>
            </section>

            <div className="border-t border-df-hairline" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-[72px] gap-y-12">
              <section className="flex flex-col gap-5">
                <h2 className="df-h2">Buy</h2>
                <div className="flex flex-col gap-2">
                  <label className="df-eyebrow text-df-meta">Proposed annual SaaS license</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 df-mono text-[15px] text-df-meta">$</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={annualSaasLicenseCost}
                      onChange={(e) => { const v = Math.max(0, Number(e.target.value)); setAnnualSaasLicenseCost(v); logEvent("annualSaasLicenseCost", v); }}
                      aria-label="Proposed annual SaaS license in dollars"
                      className="df-field df-field-num text-[19px] pl-9"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="df-eyebrow text-df-meta">Proposed annual support cost</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 df-mono text-[15px] text-df-meta">$</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={annualSaasSupportCost}
                      onChange={(e) => { const v = Math.max(0, Number(e.target.value)); setAnnualSaasSupportCost(v); logEvent("annualSaasSupportCost", v); }}
                      aria-label="Proposed annual support cost in dollars"
                      className="df-field df-field-num text-[19px] pl-9"
                    />
                  </div>
                  <p className="df-meta text-[12px]">
                    Annual SaaS cost total: {formatCurrency(annualSaasCost)}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-baseline gap-3">
                    <label className="df-eyebrow text-df-meta">Annual cost increase</label>
                    <span className="df-meta text-[11px]">compounded over lifespan</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={annualCostIncreasePct}
                      onChange={(e) => { const v = Math.max(0, Number(e.target.value)); setAnnualCostIncreasePct(v); logEvent("annualCostIncreasePct", v); }}
                      aria-label="Annual SaaS cost increase percentage"
                      className="df-field df-field-sm df-field-num pr-10"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 df-mono text-[13px] text-df-meta">%</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-baseline gap-3">
                    <label className="df-eyebrow text-df-meta">SaaS implementation cost</label>
                    <span className="df-meta text-[11px]">one-time</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 df-mono text-[13px] text-df-meta">$</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={saasImplementationCost}
                      onChange={(e) => { const v = Math.max(0, Number(e.target.value)); setSaasImplementationCost(v); logEvent("saasImplementationCost", v); }}
                      aria-label="SaaS implementation cost in dollars"
                      className="df-field df-field-sm df-field-num pl-8"
                    />
                  </div>
                </div>
              </section>

              <section className="flex flex-col gap-5">
                <h2 className="df-h2">Build</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="df-eyebrow text-df-meta">Primary AI tool</label>
                    <Select value={primaryValue} onValueChange={(value) => { setPrimaryValue(value); logEvent("primaryTool", idFromValue(value), 0); }}>
                      <SelectTrigger aria-label="Primary AI tool">
                        <SelectValue placeholder="Select primary model" />
                      </SelectTrigger>
                      <SelectContent>
                        <ModelGroups catalog={catalog} />
                      </SelectContent>
                    </Select>
                    {primaryTool.includes("Microsoft Copilot") && (
                      <p className="df-meta text-[11px] border-l-2 border-df-oxblood pl-3">
                        Uses existing Azure/M365 credits — high compliance tier.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="df-eyebrow text-df-meta">Secondary AI tool</label>
                    <Select value={secondaryValue} onValueChange={(value) => { setSecondaryValue(value); logEvent("secondaryTool", value === "none" ? "none" : idFromValue(value), 0); }}>
                      <SelectTrigger aria-label="Secondary AI tool">
                        <SelectValue placeholder="Select secondary model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <ModelGroups catalog={catalog} />
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="df-meta text-[11px] -mt-2" title={priceLabel.title ?? undefined}>
                  {priceLabel.text}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="df-eyebrow text-df-meta">Primary model traffic share</label>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      step={5}
                      value={primaryModelWeight}
                      onChange={(e) => { const v = Number(e.target.value); setPrimaryModelWeight(v); logEvent("primaryModelWeight", v); }}
                      className="w-full"
                      aria-label="Primary model traffic share"
                    />
                    <div className="flex justify-between df-meta text-[11px]">
                      <span>10%</span>
                      <span className="df-mono text-[13px] text-df-ink">{primaryModelWeight}% / {100 - primaryModelWeight}%</span>
                      <span>90%</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="df-eyebrow text-df-meta">Output intensity</label>
                    <Select value={outputIntensity} onValueChange={(v) => { setOutputIntensity(v as OutputIntensity); setOutputSharePct(null); logEvent("outputIntensity", v, 0); }}>
                      <SelectTrigger aria-label="Output intensity">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(OUTPUT_INTENSITY_LABELS) as [OutputIntensity, string][]).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="df-meta text-[11px] leading-relaxed">
                      Output tokens cost 3–5× more than input. Each model is priced at its own input and output rates for
                      the workload&rsquo;s output share ({Math.round(OUTPUT_SHARE[outputIntensity] * 100)}% here).
                    </p>
                    {outputSharePct === null ? (
                      <button
                        type="button"
                        className="df-meta text-[11px] underline self-start"
                        onClick={() => setOutputSharePct(Math.round(OUTPUT_SHARE[outputIntensity] * 100))}
                      >
                        Advanced: set output share
                      </button>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={outputSharePct}
                          onChange={(e) => { const v = Number(e.target.value); setOutputSharePct(v); logEvent("outputSharePct", v); }}
                          className="w-full"
                          aria-label="Output token share"
                        />
                        <div className="flex justify-between df-meta text-[11px]">
                          <span>0%</span>
                          <span className="df-mono text-[13px] text-df-ink">{outputSharePct}% output</span>
                          <button type="button" className="underline" onClick={() => setOutputSharePct(null)}>
                            Reset
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Model-stack readout — the one Panel block with an Oxblood edge (spec §5) */}
                <div className="df-tool-card flex items-center justify-between gap-4 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="df-eyebrow text-df-ink">Model stack</span>
                    <span className="df-meta text-[11px]">
                      coeff {tokenSpendEstimate.blendedModelCoefficient.toFixed(2)} · {Math.round(tokenSpendEstimate.outputShare * 100)}% output
                    </span>
                  </div>
                  <div className="text-right flex flex-col gap-1">
                    <span className="df-mono text-[19px] text-df-ink">{formatCurrency(tokenSpendEstimate.estimatedThreeYearTokenTco)}</span>
                    <span className="df-meta text-[11px]">{horizonYears}-yr est.</span>
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
                  onChange={(v) => { setSelfCodingAppetite(v); logEvent("selfCodingAppetite", v); }}
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
                  onChange={(v) => { setBuildTimeframeMonths(v); logEvent("buildTimeframeMonths", v); }}
                />
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-baseline gap-3">
                    <label className="df-eyebrow text-df-meta">Engineers to build</label>
                    {buildEngineers > 0 && (
                      <span className="df-mono text-[13px] text-df-ink">{formatCurrency(buildEngineers * costPerEngineerPerYear)}/yr</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={buildEngineers}
                      onChange={(e) => { const v = Number(e.target.value); setBuildEngineers(v); logEvent("buildEngineers", v); }}
                      aria-label="Engineers needed to build"
                      className="df-field df-field-sm"
                    >
                      {Array.from({ length: 21 }, (_, i) => (
                        <option key={i} value={i}>{i === 0 ? "0 engineers" : `${i} engineer${i !== 1 ? "s" : ""}`}</option>
                      ))}
                    </select>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 df-mono text-[13px] text-df-meta z-10">$</span>
                      <input
                        type="number"
                        min={0}
                        step={5000}
                        value={costPerEngineerPerYear}
                        onChange={(e) => { const v = Math.max(0, Number(e.target.value)); setCostPerEngineerPerYear(v); logEvent("costPerEngineerPerYear", v); }}
                        aria-label="Cost per engineer per year in dollars"
                        placeholder="Cost / yr"
                        className="df-field df-field-sm df-field-num pl-8"
                      />
                    </div>
                  </div>
                  <p className="df-meta text-[11px]">Count · cost per engineer / year</p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-baseline gap-3">
                    <label className="df-eyebrow text-df-meta">Support reps</label>
                    {annualSupportCost > 0 && (
                      <span className="df-mono text-[13px] text-df-ink">{formatCurrency(annualSupportCost)}/yr</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={supportReps}
                      onChange={(e) => { const v = Number(e.target.value); setSupportReps(v); logEvent("supportReps", v); }}
                      aria-label="Support reps needed"
                      className="df-field df-field-sm"
                    >
                      {Array.from({ length: 21 }, (_, i) => (
                        <option key={i} value={i}>{i === 0 ? "0 reps" : `${i} rep${i !== 1 ? "s" : ""}`}</option>
                      ))}
                    </select>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 df-mono text-[13px] text-df-meta z-10">$</span>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={costPerRepPerYear}
                        onChange={(e) => { const v = Math.max(0, Number(e.target.value)); setCostPerRepPerYear(v); logEvent("costPerRepPerYear", v); }}
                        aria-label="Cost per support rep per year in dollars"
                        placeholder="Cost / yr"
                        className="df-field df-field-sm df-field-num pl-8"
                      />
                    </div>
                  </div>
                  <p className="df-meta text-[11px]">Count · cost per rep / year</p>
                </div>
              </section>
            </div>
          </div>

          <div className="border-t border-df-ink" />

          <section className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <h2 className="df-h2">Comparison</h2>
              <p className="df-body df-measure-body">
                Side-by-side {horizonYears}-year TCO for vendor purchase vs proprietary build.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[72px] gap-y-8">
              <div className="flex flex-col gap-2 border-t border-df-hairline pt-5">
                <div className="df-eyebrow text-df-meta">Vendor (Buy)</div>
                <div className="df-mono text-[33px] leading-none text-df-ink">
                  {formatCurrency(saasThreeYearTco)}
                </div>
                <p className="df-meta text-[12px]">
                  License, implementation, and support-linked SaaS spend.
                </p>
              </div>
              <div className="flex flex-col gap-2 border-t border-df-hairline pt-5">
                <div className="df-eyebrow text-df-meta">Proprietary (Build)</div>
                <div className="df-mono text-[33px] leading-none text-df-ink">
                  {formatCurrency(buildThreeYearTco)}
                </div>
                <p className="df-meta text-[12px]">
                  Development, maintenance, and ongoing support costs.
                </p>
              </div>
            </div>

            {/* Chart: Ink for the vendor path, Oxblood for the build path — see note in README. */}
            <div className="h-[300px] w-full min-w-0 border-t border-df-hairline pt-5">
              {chartReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="30%">
                    <CartesianGrid stroke="#DAD5CB" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#65616B", fontSize: 12, fontFamily: "var(--font-jetbrains-mono)" }}
                      axisLine={{ stroke: "#141414" }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => formatCurrency(v)}
                      tick={{ fill: "#65616B", fontSize: 11, fontFamily: "var(--font-jetbrains-mono)" }}
                      axisLine={false}
                      tickLine={false}
                      width={64}
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
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend
                      wrapperStyle={{
                        fontSize: 11,
                        color: "#65616B",
                        fontFamily: "var(--font-jetbrains-mono)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    />
                    {/* Motion is color-only in this system (spec §6) — no grow-in. */}
                    <Bar dataKey="Vendor SaaS" fill="#141414" isAnimationActive={false} />
                    <Bar dataKey="Custom Build" fill="#8C2B49" isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center df-meta border border-df-hairline">
                  Loading chart…
                </div>
              )}
            </div>

            {/* Verdict — Panel ground, Oxblood edge. The conclusion states first (spec §7). */}
            <div className="df-tool-card flex flex-col gap-3">
              <div className="df-eyebrow text-df-ink">{horizonYears}-year savings</div>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div className="df-mono text-[42px] leading-none text-df-ink">
                  {formatCurrency(savingsAmount)}
                </div>
                <div className="df-h4 md:text-right">Recommended: {cheaperOption}</div>
              </div>
              <p className="df-meta text-[12px]">
                Build estimate assumes 5× velocity via AI-assisted development.
              </p>
            </div>
          </section>

          <div className="border-t border-df-ink" />

          {/* Subscribe-style form — stacked, never side by side (spec §5) */}
          <section className="flex flex-col gap-5 df-measure-body">
            <div className="flex flex-col gap-2">
              <h2 className="df-h2">Save scenario</h2>
              <p className="df-body">
                Saves your inputs and produces a summary analysis. Add your email if you want a copy
                in your inbox.
              </p>
              <p className="df-meta text-[12px]">
                Session ID: <span className="df-mono text-df-ink">{sessionId ?? "—"}</span>
              </p>
            </div>

            {reportPath ? (
              <div className="df-tool-card flex flex-col gap-3">
                <p className="df-eyebrow text-df-ink">Scenario saved</p>
                <p className="df-dek">
                  {emailQueued
                    ? "A summary email is on its way to your inbox."
                    : email.trim()
                      ? "Your report was saved. We couldn't send email right now — open the report and use Share with a colleague."
                      : "Open your report below."}
                </p>
                <div className="flex flex-wrap items-center gap-5">
                  <Link href={reportPath} className="df-btn">
                    View summary report ↗
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setReportPath(null);
                      setSaveError(null);
                      setEmailQueued(false);
                    }}
                    className="df-link df-meta text-[12px]"
                  >
                    Save another snapshot
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveReport} className="flex flex-col gap-3 max-w-md">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (optional)"
                  autoComplete="email"
                  className="df-field"
                />
                <button
                  type="submit"
                  disabled={saveLoading || !sessionId}
                  className="df-btn df-btn-secondary w-full"
                >
                  {saveLoading ? "Saving…" : "Save & generate report"}
                </button>
                {saveError && (
                  <p className="df-meta text-[12px] text-df-oxblood">{saveError}</p>
                )}
              </form>
            )}
          </section>

          <div className="border-t border-df-ink" />

          {/* Article-row pattern (spec §5): hairline divider, H3 headline, dek at 700px */}
          <section className="flex flex-col gap-3" aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="df-h2">
              Common questions
            </h2>
            <p className="df-body df-measure-body mb-4">
              Quick answers to the questions behind every build-or-buy software decision.
            </p>
            <div className="flex flex-col">
              {[
                {
                  q: "Should I build or buy my SaaS?",
                  a: "It depends on the total cost of ownership over the software’s lifespan, how differentiating the capability is, how fast you need it, and your team’s build velocity. Commodity needs usually favor buying vendor SaaS; differentiating, long-lived capabilities can favor building. The calculator above compares the TCO of both paths over your expected app lifespan (1–5 years) so you decide with numbers rather than instinct.",
                },
                {
                  q: "Should I vibe code my SaaS instead of buying it?",
                  a: "AI-assisted (“vibe”) coding can dramatically cut build time and cost, which shifts the build-vs-buy math toward building — especially for differentiated features. Model your AI model-stack costs and faster build velocity above, and the tool shows whether building still beats a vendor SaaS subscription over your chosen horizon.",
                },
                {
                  q: "How do I calculate total cost of ownership for build vs. buy?",
                  a: "Add up the full multi-year cost of each path. For buying: license, implementation, support, and annual price increases. For building: engineering and AI/model costs, time-to-live, ongoing maintenance, and support. This tool computes both over your chosen horizon (1–5 years) and recommends the cheaper, lower-risk option for your inputs.",
                },
                {
                  q: "When does building software cost less than buying SaaS?",
                  a: "Building tends to win when the app is highly differentiating, has a long lifespan, vendor SaaS pricing is high or rising fast, and your build velocity is strong (e.g. AI-assisted development). Buying tends to win for short-lived, commodity, or compliance-sensitive needs. Enter your numbers above to find the crossover point.",
                },
              ].map(({ q, a }) => (
                <div
                  key={q}
                  className="flex flex-col gap-2 border-t border-df-hairline py-[30px] last:border-b"
                >
                  <h3 className="df-h3">{q}</h3>
                  <p className="df-dek df-measure-body">{a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
