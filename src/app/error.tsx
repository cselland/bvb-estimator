"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-df-paper text-df-body flex flex-col items-center justify-center px-8">
      <div className="df-tool-card max-w-md w-full flex flex-col gap-4">
        <p className="df-eyebrow text-df-ink">Something went wrong</p>
        <h1 className="df-h4">This page hit an error</h1>
        <p className="df-dek">
          {error.message || "An unexpected error occurred. Check the browser console for details."}
        </p>
        {error.digest ? (
          <p className="df-meta text-[12px] break-all">Reference: {error.digest}</p>
        ) : null}
        <button type="button" onClick={reset} className="df-btn df-btn-secondary self-start">
          Try again
        </button>
      </div>
    </main>
  );
}
