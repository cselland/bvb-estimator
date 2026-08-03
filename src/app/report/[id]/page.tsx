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
      <main className="min-h-screen bg-df-paper text-df-body">
        <SiteHeader
          right={
            <>
              <span className="df-mono text-[12px] text-df-meta truncate max-w-[160px] hidden lg:block">
                {scenario.sessionId}
              </span>
              <Link href="/" className="df-link df-meta text-[12px] whitespace-nowrap">
                ← Calculator
              </Link>
            </>
          }
        />

        <article className="max-w-df-canvas mx-auto px-8 md:px-df-inset pt-[92px] pb-16 flex flex-col gap-8">
          {(payload.appName || payload.appDescription) && (
            <div className="flex flex-col gap-2 border-l-2 border-df-hairline pl-5">
              <p className="df-eyebrow text-df-meta">Application context</p>
              {payload.appName ? <h2 className="df-h4">{payload.appName}</h2> : null}
              {payload.appDescription ? (
                <p className="df-dek df-measure-body">{payload.appDescription}</p>
              ) : null}
            </div>
          )}

          <header className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <span className="block h-px w-[56px] bg-df-oxblood" aria-hidden="true" />
              <p className="df-eyebrow text-df-oxblood">Saved scenario</p>
            </div>
            <h1 className="df-h3">Verdict: {scenario.verdict}</h1>
            <p className="df-meta">Saved {new Date(scenario.createdAt).toLocaleString()}</p>
            {payload.summarySource && (
              <p className="df-meta text-[12px]">
                Summary source:{" "}
                {payload.summarySource === "ai" ? "Harry AI" : "Fallback template"}
                {payload.summaryError ? " · AI summary temporarily unavailable" : ""}
              </p>
            )}
          </header>

          <div className="df-tool-card flex flex-col gap-4">
            <h2 className="df-eyebrow text-df-ink">Summary report</h2>
            <div className="df-dek df-measure-body overflow-x-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownDocComponents}>
                {scenario.summaryMarkdown}
              </ReactMarkdown>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <a href={`/api/scenarios/${scenario.id}/download`} className="df-btn">
              Download .md ↗
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
      <main className="min-h-screen bg-df-paper text-df-body flex flex-col items-center justify-center px-8">
        <div className="df-tool-card max-w-lg w-full flex flex-col gap-4">
          <p className="df-eyebrow text-df-ink">Report unavailable</p>
          <h1 className="df-h4">Could not load saved scenario</h1>
          <p className="df-dek">{message}</p>
          <p className="df-meta text-[12px] leading-relaxed">
            Confirm the Worker has a <span className="df-mono text-df-ink">DB</span> D1 binding. For
            local development, run <span className="df-mono text-df-ink">pnpm run dev:cf</span> so the
            app runs with D1 (plain <span className="df-mono text-df-ink">pnpm run dev</span> has no
            database).
          </p>
          <Link href="/" className="df-btn df-btn-secondary self-start">
            Back to calculator
          </Link>
        </div>
      </main>
    );
  }
}