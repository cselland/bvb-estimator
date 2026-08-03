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
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 border-t border-df-ink pt-8 max-w-md"
    >
      <h2 className="df-h2">Share</h2>
      <p className="df-dek">
        {emailConfigured
          ? "Send the summary report to a colleague's inbox."
          : "Email isn't available on this environment yet."}
      </p>
      {/* Stacked, never side by side (spec §5) */}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="colleague@company.com"
        required
        className="df-field"
      />
      <button
        type="submit"
        disabled={loading || !email.trim() || !emailConfigured}
        className="df-btn df-btn-secondary w-full"
      >
        {loading ? "Sending…" : "Share report"}
      </button>
      {error && <p className="df-meta text-[12px] text-df-oxblood">{error}</p>}
      {success && <p className="df-meta text-[12px] text-df-ink">{success}</p>}
    </form>
  );
}
