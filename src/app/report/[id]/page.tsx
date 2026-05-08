import Link from "next/link";
import { getScenarioById } from "@/lib/scenario-store";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default async function ReportPage(props: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await props.params;

    const scenario = await getScenarioById(id);

    if (!scenario) {
      return notFound();
    }

    return (
      <main className="min-h-screen bg-df-canvas text-df-ink">
        <nav className="w-full border-b border-white/10 bg-black backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
            <Link href="/" className="text-sm font-medium text-[#d1d5db] hover:text-white transition">
              ← Back to calculator
            </Link>
            <span className="text-xs font-mono text-df-mint truncate max-w-[50%]">{scenario.sessionId}</span>
          </div>
        </nav>

        <article className="max-w-3xl mx-auto px-6 py-12">
          <p className="text-df-mint font-bold tracking-[0.25em] uppercase text-xs mb-2">Saved scenario</p>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-df-ink mb-2">
            Verdict:{" "}
            <span className={scenario.verdict === "BUILD" ? "text-df-iris" : "text-df-mint"}>{scenario.verdict}</span>
          </h1>
          <p className="text-sm text-slate-600 mb-8">
            Saved {new Date(scenario.createdAt).toLocaleString()}
            {scenario.email ? ` · ${scenario.email}` : ""}
          </p>
          
          <div className="bg-white shadow-sm border-l-4 border-l-df-mint p-6 md:p-8">
            <h2 className="text-sm font-bold text-df-mint tracking-[0.2em] uppercase mb-4">Summary report</h2>
            <div className="max-w-none text-sm leading-relaxed text-slate-700 overflow-x-auto">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="text-2xl font-black text-df-ink mb-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-bold text-df-ink mt-7 mb-3">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-semibold text-df-ink mt-6 mb-2">{children}</h3>,
                  p: ({ children }) => <p className="mb-3 text-slate-700">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                  table: ({ children }) => (
                    <table className="w-full border-collapse border border-df-line text-sm my-4">{children}</table>
                  ),
                  thead: ({ children }) => <thead className="bg-df-canvas">{children}</thead>,
                  th: ({ children }) => <th className="border border-df-line px-3 py-2 text-left font-semibold">{children}</th>,
                  td: ({ children }) => <td className="border border-df-line px-3 py-2 align-top">{children}</td>,
                  strong: ({ children }) => <strong className="font-bold text-df-ink">{children}</strong>,
                  a: ({ href, children }) => (
                    <a href={href} className="text-df-iris underline hover:opacity-80">
                      {children}
                    </a>
                  ),
                  hr: () => <hr className="my-6 border-df-line" />,
                }}
              >
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
        </article>
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
            Confirm the Cloudflare Worker has a <span className="font-mono">DB</span> D1 binding configured and
            the database is available for this environment.
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