import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const scenario = await prisma.scenario.findUnique({ where: { id } });
  if (!scenario) notFound();

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
          Saved {scenario.createdAt.toLocaleString()}
          {scenario.email ? ` · ${scenario.email}` : ""}
        </p>
        <div className="bg-white shadow-sm border-l-4 border-l-df-mint p-6 md:p-8">
          <h2 className="text-sm font-bold text-df-mint tracking-[0.2em] uppercase mb-4">Summary report</h2>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 font-sans overflow-x-auto">
            {scenario.summaryMarkdown}
          </pre>
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
}
