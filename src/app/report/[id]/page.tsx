import Link from "next/link";
import { getScenarioById } from "@/lib/scenario-store";
import { parseScenarioPayload } from "@/lib/scenario-payload";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownDocComponents } from "@/lib/markdown-doc-components";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isResendConfigured } from "@/lib/resend";
import { ShareReportForm } from "./share-report-form";

export default async function ReportPage(props: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await props.params;

    const scenario = await getScenarioById(id);

    if (!scenario) {
      return notFound();
    }

    const payload = parseScenarioPayload(scenario.payloadJson);

    return (
      <main className="min-h-screen bg-df-canvas text-df-ink">
        <SiteHeader
          right={
            <>
              <span className="text-xs font-mono text-df-mint truncate max-w-[160px] hidden sm:block">
                {scenario.sessionId}
              </span>
              <Link
                href="/"
                className="text-sm font-medium text-[#9ca3af] hover:text-white transition whitespace-nowrap"
              >
                ← Calculator
              </Link>
            </>
          }
        />

        <article className="max-w-3xl mx-auto px-6 py-12">
          {(payload.appName || payload.appDescription) && (
            <div className="mb-6 rounded-xl border border-df-line bg-white p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Application context</p>
              {payload.appName ? (
                <h2 className="text-xl font-bold text-df-ink mb-1">{payload.appName}</h2>
              ) : null}
              {payload.appDescription ? (
                <p className="text-sm text-slate-700 leading-relaxed">{payload.appDescription}</p>
              ) : null}
            </div>
          )}
          <p className="text-df-mint font-bold tracking-[0.25em] uppercase text-xs mb-2">Saved scenario</p>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-df-ink mb-2">
            Verdict:{" "}
            <span className={scenario.verdict === "BUILD" ? "text-df-iris" : "text-df-mint"}>{scenario.verdict}</span>
          </h1>
          <p className="text-sm text-slate-600 mb-8">
            Saved {new Date(scenario.createdAt).toLocaleString()}
          </p>
          {payload.summarySource && (
            <p className="text-xs text-slate-500 mb-6">
              Summary source:{" "}
              <span className="font-semibold">
                {payload.summarySource === "ai" ? "Harry AI" : "Fallback template"}
              </span>
              {payload.summaryError ? " · AI summary temporarily unavailable" : ""}
            </p>
          )}
          
          <div className="bg-white shadow-sm border-l-4 border-l-df-mint p-6 md:p-8">
            <h2 className="text-sm font-bold text-df-mint tracking-[0.2em] uppercase mb-4">Summary report</h2>
            <div className="max-w-none text-sm leading-relaxed text-slate-700 overflow-x-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownDocComponents}>
                {scenario.summaryMarkdown}
              </ReactMarkdown>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href={`/api/scenarios/${scenario.id}/download`}
              className="inline-flex items-center justify-center bg-df-mint text-df-nav hover:brightness-110 transition shadow-lg shadow-df-mint/20 text-sm font-bold px-6 py-2.5 rounded-full"
            >
              Download .md
            </a>
          </div>
          <ShareReportForm scenarioId={scenario.id} emailConfigured={isResendConfigured()} />
        </article>
        <SiteFooter />
      </main>
    );
  } catch (error) {
    console.error("Report Page Error:", error);
    const message =
      error instanceof Error ? error.message : "Could not load this report from the database.";
    return (
      <main className="min-h-screen bg-df-canvas text-df-ink flex flex-col items-center justify-center px-6">
        <div className="max-w-lg w-full rounded-xl border border-red-200 bg-white p-8 shadow-sm">
          <p className="text-red-600 font-bold tracking-[0.2em] uppercase text-xs mb-3">Report unavailable</p>
          <h1 className="text-xl font-black text-df-ink mb-2">Could not load saved scenario</h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-2">{message}</p>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            Confirm the Worker has a <span className="font-mono">DB</span> D1 binding. For local development,
            run <span className="font-mono">pnpm run dev:cf</span> so the app runs with D1 (plain{" "}
            <span className="font-mono">pnpm run dev</span> has no database).
          </p>
          <Link
            href="/"
            className="inline-flex bg-df-mint text-df-nav hover:brightness-110 transition text-sm font-bold px-6 py-2.5 rounded-full"
          >
            Back to calculator
          </Link>
        </div>
      </main>
    );
  }
}