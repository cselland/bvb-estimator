"use client";

/**
 * Replaces the root layout entirely, so neither the font variables nor the
 * token classes are guaranteed here — brand values are inlined literally.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F7F5F0] text-[#464349] antialiased flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-[#ECE7DE] border-l-8 border-[#8C2B49] p-[26px] flex flex-col gap-4">
          <p className="text-[#141414] text-xs uppercase tracking-[0.2em] font-mono">
            Application error
          </p>
          <h1 className="text-[25px] leading-tight tracking-[-0.035em] font-bold text-[#141414]">
            Could not load the app shell
          </h1>
          <p className="text-[18px] leading-relaxed text-[#464349]">
            {error.message || "Check the browser console, then refresh the page."}
          </p>
          {error.digest ? (
            <p className="text-xs font-mono tracking-[0.08em] text-[#65616B] break-all">
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            className="self-start bg-[#141414] text-[#F7F5F0] px-[17px] py-[10px] text-[13px] uppercase tracking-[0.2em] font-mono transition-colors hover:bg-[#8C2B49]"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
