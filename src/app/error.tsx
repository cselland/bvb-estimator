"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-df-canvas text-df-ink flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full rounded-xl border border-df-line bg-white p-8 shadow-sm">
        <p className="text-df-mint font-bold tracking-[0.2em] uppercase text-xs mb-3">Something went wrong</p>
        <h1 className="text-xl font-black text-df-ink mb-2">This page hit an error</h1>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          {error.message || "An unexpected error occurred. Check the browser console for details."}
        </p>
        {error.digest ? (
          <p className="text-xs font-mono text-slate-500 mb-6 break-all">Reference: {error.digest}</p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="w-full sm:w-auto bg-df-mint text-df-nav hover:brightness-110 transition text-sm font-bold px-6 py-2.5 rounded-full"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
