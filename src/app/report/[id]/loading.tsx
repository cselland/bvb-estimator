export default function ReportLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-df-paper text-df-body px-8">
      {/* No spinner: motion is color-only in this system (spec §6). */}
      <div className="flex items-center gap-4">
        <span className="block h-px w-[56px] bg-df-oxblood" aria-hidden="true" />
        <p className="df-eyebrow text-df-oxblood">Loading report</p>
      </div>
      <p className="df-meta text-[12px] max-w-sm text-center leading-relaxed">
        If this never finishes, confirm the <span className="df-mono text-df-ink">DB</span> D1
        binding is configured and the scenario id exists (use{" "}
        <span className="df-mono text-df-ink">pnpm run dev:cf</span> for local D1).
      </p>
    </div>
  );
}
