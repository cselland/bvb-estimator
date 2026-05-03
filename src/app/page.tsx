"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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
import { computeScenario, type ScenarioInputs } from "@/lib/tco";

interface SliderProps {
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

function Slider({ label, value, min, max, step, displayValue, minLabel, maxLabel, tooltip, onChange }: SliderProps) {
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
  const [timeToGoLive, setTimeToGoLive] = useState(6);
  const [appLifespan, setAppLifespan] = useState(36);
  const [annualSaasCost, setAnnualSaasCost] = useState(100_000);
  const [appCriticality, setAppCriticality] = useState(3);
  const [selfCodingAppetite, setSelfCodingAppetite] = useState(3);
  const [customizationImportance, setCustomizationImportance] = useState(3);
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
    appCriticality,
    selfCodingAppetite,
    customizationImportance,
    saasImplementationCost,
    buildEngineers,
    buildTimeframeMonths,
    costPerEngineerPerYear,
    supportReps,
    costPerRepPerYear,
  };

  const {
    annualSupportCost,
    buildThreeYearTco,
    saasThreeYearTco,
    verdict,
    chartData,
  } = computeScenario(inputs);

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
        }),
      });
      const data = (await res.json()) as { error?: string; reportUrl?: string; emailQueued?: boolean };
      if (!res.ok) throw new Error(data.error || "Could not save scenario");
      setReportPath(data.reportUrl ?? null);
      setEmailQueued(Boolean(data.emailQueued));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save scenario");
    } finally {
      setSaveLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-df-canvas text-df-ink">
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-3">
          <a href="https://differentialfactor.com" className="flex items-center min-w-0 hover:opacity-90 transition-opacity">
            <img
              src="/images/df-logo-full.jpg"
              alt="Differential Factor"
              width={1024}
              height={340}
              className="h-10 w-auto sm:h-11 md:h-12 max-w-[min(100%,calc(100vw-6.5rem))] sm:max-w-[480px] md:max-w-[520px] object-contain object-left"
            />
          </a>
          <span className="text-xs sm:text-sm font-medium text-[#d1d5db] tracking-wide whitespace-nowrap">
            Build vs. Buy
          </span>
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
            Adjust the parameters below to model your total cost of ownership and get a strategic recommendation.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
          <div className="bg-white p-6 md:p-8 shadow-sm border border-df-line border-l-4 border-l-df-mint">
            <h2 className="text-df-mint font-bold tracking-[0.3em] uppercase text-sm mb-8">
              Parameters
            </h2>

            <Slider
              label="Time to Go Live"
              value={timeToGoLive}
              min={1}
              max={24}
              step={1}
              minLabel="1 mo"
              maxLabel="2 yrs"
              tooltip="How soon does this solution need to be live? If a contract is expiring or a deadline is pressing, a short window makes building harder and more expensive — adding a rush premium to the dev cost estimate."
              displayValue={formatMonths(timeToGoLive)}
              onChange={setTimeToGoLive}
            />

            <Slider
              label="Expected App Lifespan"
              value={appLifespan}
              min={1}
              max={60}
              step={1}
              minLabel="1 mo"
              maxLabel="5 yrs"
              tooltip="How long do you expect this solution to remain in active use? Longer lifespans make building more cost-efficient over time and also increase the total SaaS spend you're comparing against."
              displayValue={formatMonths(appLifespan)}
              onChange={setAppLifespan}
            />

            <Slider
              label="Annual SaaS Cost"
              value={annualSaasCost}
              min={10_000}
              max={500_000}
              step={10_000}
              tooltip="The total yearly spend on the vendor SaaS product — including licenses, seats, and platform fees. Higher SaaS costs make building in-house more attractive."
              displayValue={formatSaasCost(annualSaasCost) + "/yr"}
              onChange={setAnnualSaasCost}
            />

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    SaaS Implementation Cost
                  </label>
                  <div className="relative group">
                    <svg className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute left-0 bottom-full mb-2 w-56 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <div className="bg-white border border-df-line rounded-lg px-3 py-2 text-xs text-slate-600 shadow-xl leading-relaxed">
                        One-time upfront cost to get the SaaS solution live — onboarding fees, data migration, professional services, and initial training. Added to Year 1 of the SaaS TCO.
                      </div>
                      <div className="w-2 h-2 bg-white border-r border-b border-df-line rotate-45 ml-1.5 -mt-1.5" />
                    </div>
                  </div>
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

            <Slider
              label="Customization Importance"
              value={customizationImportance}
              min={1}
              max={5}
              step={1}
              tooltip="How much does this app need to be tailored to your specific business? Low = standard out-of-the-box SaaS will do the job. High = SaaS requires costly professional services, custom integrations, or workarounds — raising its true cost."
              displayValue={`${customizationImportance} / 5`}
              onChange={setCustomizationImportance}
            />

            <Slider
              label="App Criticality"
              value={appCriticality}
              min={1}
              max={5}
              step={1}
              tooltip="How mission-critical is this application? Higher criticality means the build needs more robust architecture, testing, and redundancy — which raises the estimated build cost."
              displayValue={`${appCriticality} / 5`}
              onChange={setAppCriticality}
            />

            <Slider
              label="Self-Coding Appetite"
              value={selfCodingAppetite}
              min={1}
              max={5}
              step={1}
              tooltip="How eager and capable is your team to build and own this? Also called 'vibe coding appetite' — higher means faster delivery and lower dev cost through AI-assisted development. Low appetite signals risk of delays, poor ownership, and hidden costs."
              displayValue={`${selfCodingAppetite} / 5`}
              onChange={setSelfCodingAppetite}
            />

            <div className="border-t border-[#161b22]/10 my-6 pt-6">
              <div className="text-df-iris font-bold tracking-[0.3em] uppercase text-sm mb-6">
                Build Team &amp; Costs
              </div>

              <Slider
                label="Engineers Needed to Build"
                value={buildEngineers}
                min={1}
                max={20}
                step={1}
                minLabel="1"
                maxLabel="20"
                tooltip="How many engineers would be dedicated to building this solution? Combined with the build timeframe and their cost, this drives the core development spend estimate."
                displayValue={`${buildEngineers} engineer${buildEngineers !== 1 ? "s" : ""}`}
                onChange={setBuildEngineers}
              />

              <Slider
                label="Build Timeframe"
                value={buildTimeframeMonths}
                min={1}
                max={24}
                step={1}
                minLabel="1 mo"
                maxLabel="2 yrs"
                tooltip="How many months would it realistically take to build and ship this solution? Paired with engineer count and cost, this determines total development spend."
                displayValue={formatMonths(buildTimeframeMonths)}
                onChange={setBuildTimeframeMonths}
              />

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Cost per Engineer / Year
                    </label>
                    <div className="relative group">
                      <svg className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute left-0 bottom-full mb-2 w-56 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <div className="bg-white border border-df-line rounded-lg px-3 py-2 text-xs text-slate-600 shadow-xl leading-relaxed">
                          Fully-loaded annual cost per engineer — salary, benefits, equity, tools, and overhead. Use your real burdened labor rate for accuracy.
                        </div>
                        <div className="w-2 h-2 bg-white border-r border-b border-df-line rotate-45 ml-1.5 -mt-1.5" />
                      </div>
                    </div>
                  </div>
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
                <p className="text-xs text-slate-500 mt-1">Annual fully-loaded cost per engineer</p>
              </div>

              <div className="border-t border-[#161b22]/10 my-6 pt-6">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em] mb-5">
                  Ongoing Support
                </div>

                <Slider
                  label="Support Reps Needed"
                  value={supportReps}
                  min={0}
                  max={20}
                  step={1}
                  minLabel="0"
                  maxLabel="20"
                  tooltip="Number of dedicated support or ops staff required to maintain the custom-built solution. Each rep adds their annual cost to the build's ongoing expense — often the biggest cost driver."
                  displayValue={`${supportReps} rep${supportReps !== 1 ? "s" : ""}`}
                  onChange={setSupportReps}
                />

                <div className="mb-2">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-1.5">
                      <label className="text-sm font-medium text-slate-700">
                        Cost per Rep / Year
                      </label>
                      <div className="relative group">
                        <svg className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute left-0 bottom-full mb-2 w-56 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <div className="bg-white border border-df-line rounded-lg px-3 py-2 text-xs text-slate-600 shadow-xl leading-relaxed">
                            Fully-loaded annual cost per support rep — salary, benefits, tools, and overhead. Use your real burdened labor rate for the most accurate TCO estimate.
                          </div>
                          <div className="w-2 h-2 bg-white border-r border-b border-df-line rotate-45 ml-1.5 -mt-1.5" />
                        </div>
                      </div>
                    </div>
                    {annualSupportCost > 0 && (
                      <span className="text-xs text-slate-500">
                        {formatCurrency(annualSupportCost)}/yr total
                      </span>
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
                  <p className="text-xs text-slate-500 mt-1">Annual fully-loaded cost per support rep</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div
              className={`p-6 md:p-8 shadow-sm border-l-4 transition-colors duration-300 bg-white border border-df-line ${
                verdict === "BUILD" ? "border-l-df-iris" : "border-l-df-mint"
              }`}
            >
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em] mb-3">
                Strategic Verdict
              </div>
              <div
                className={`text-5xl md:text-6xl font-black tracking-tight mb-3 ${
                  verdict === "BUILD" ? "text-df-iris" : "text-df-mint"
                }`}
              >
                {verdict}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {verdict === "BUILD"
                  ? "Your 3-year build cost is lower than the SaaS spend. Building a custom solution is the more cost-efficient long-term investment."
                  : "Your 3-year SaaS cost is lower than the estimated build cost. Buying a vendor solution saves money over this horizon."}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-df-canvas border border-df-line rounded-xl p-3">
                  <div className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">3-Year TCO (Build)</div>
                  <div className="text-lg font-bold text-df-ink tabular-nums">
                    {formatCurrency(buildThreeYearTco)}
                  </div>
                </div>
                <div className="bg-df-canvas border border-df-line rounded-xl p-3">
                  <div className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">3-Year TCO (SaaS)</div>
                  <div className="text-lg font-bold text-df-ink tabular-nums">
                    {formatCurrency(saasThreeYearTco)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 shadow-sm border border-df-line border-l-4 border-l-df-iris">
              <div className="text-df-mint font-bold tracking-[0.3em] uppercase text-sm mb-6">
                3-Year TCO Comparison
              </div>
              <div className="h-[220px] w-full min-w-0">
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
            </div>
          </div>
        </div>

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
