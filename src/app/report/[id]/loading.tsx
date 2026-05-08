export default function ReportLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-df-canvas text-df-ink">
      <div
        className="h-9 w-9 rounded-full border-2 border-white/20 border-t-df-mint animate-spin"
        aria-hidden
      />
      <p className="text-sm text-slate-400">Loading report…</p>
      <p className="text-xs text-slate-500 max-w-sm text-center px-4">
        If this never finishes, check that <span className="font-mono">DATABASE_URL</span> is set and reachable
        from this host (Atlas IP allowlist, VPC, etc.).
      </p>
    </div>
  );
}
