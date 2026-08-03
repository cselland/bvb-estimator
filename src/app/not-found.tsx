import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-df-paper text-df-body flex flex-col items-center justify-center px-8">
      <div className="max-w-md w-full flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <span className="block h-px w-[56px] bg-df-oxblood" aria-hidden="true" />
          <p className="df-eyebrow text-df-oxblood">404</p>
        </div>
        <h1 className="df-h3">Page not found</h1>
        <p className="df-body">That URL does not exist or the resource was removed.</p>
        <Link href="/" className="df-btn self-start">
          Back to calculator
        </Link>
      </div>
    </main>
  );
}
