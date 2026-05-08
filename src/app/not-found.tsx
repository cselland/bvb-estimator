import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-df-canvas text-df-ink flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <p className="text-df-mint font-bold tracking-[0.2em] uppercase text-xs mb-3">404</p>
        <h1 className="text-2xl font-black mb-2">Page not found</h1>
        <p className="text-sm text-slate-600 mb-8">That URL does not exist or the resource was removed.</p>
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
