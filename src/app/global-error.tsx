"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8fafc] text-[#161b22] antialiased flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-[#00c896] font-bold tracking-[0.2em] uppercase text-xs mb-3">Application error</p>
          <h1 className="text-xl font-black mb-2">Could not load the app shell</h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            {error.message || "Check the browser console, then refresh the page."}
          </p>
          {error.digest ? (
            <p className="text-xs font-mono text-slate-500 mb-6 break-all">Reference: {error.digest}</p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            className="bg-[#00c896] text-[#0b0e14] hover:brightness-110 transition text-sm font-bold px-6 py-2.5 rounded-full"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
