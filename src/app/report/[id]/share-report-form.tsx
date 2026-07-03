"use client";

import { useState } from "react";

export function ShareReportForm({
  scenarioId,
  emailConfigured,
}: {
  scenarioId: string;
  emailConfigured: boolean;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/scenarios/${scenarioId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Could not send report");
      setSuccess(data.message || "Report shared successfully.");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 rounded-lg border border-df-line bg-white p-4">
      <p className="text-sm font-semibold text-df-ink mb-1">Share with a colleague</p>
      <p className="text-xs text-slate-600 mb-3">
        {emailConfigured
          ? "Send the summary report to a colleague's inbox."
          : "Email isn't available on this environment yet."}
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@company.com"
          required
          className="bg-df-field border border-df-line rounded-full px-4 py-2.5 text-sm text-df-ink placeholder-slate-400 focus:outline-none focus:border-df-mint focus:ring-2 focus:ring-df-mint/20 w-full"
        />
        <button
          type="submit"
          disabled={loading || !email.trim() || !emailConfigured}
          className="inline-flex justify-center bg-df-mint text-df-nav hover:brightness-110 transition shadow-md shadow-df-mint/15 text-sm font-bold px-5 py-2 rounded-full whitespace-nowrap disabled:opacity-60 disabled:pointer-events-none"
        >
          {loading ? "Sending..." : "Share report"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {success && <p className="mt-2 text-xs text-df-mint">{success}</p>}
    </form>
  );
}
