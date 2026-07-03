type SendEmailInput = {
  to: string;
  subject: string;
} & ({ text: string; html?: string } | { html: string; text?: string });

/** True when API key and From address are available in this runtime (Worker secret + wrangler var). */
export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM?.trim());
}

function getResendApiKey(): string {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Email is not configured yet (missing RESEND_API_KEY).");
  }
  return apiKey;
}

function getResendFrom(): string {
  const from = process.env.RESEND_FROM;
  if (!from) {
    throw new Error("Email is not configured yet (missing RESEND_FROM).");
  }
  return from;
}

export async function sendEmailViaResend(input: SendEmailInput): Promise<void> {
  const apiKey = getResendApiKey();
  const from = getResendFrom();

  const payload: Record<string, unknown> = {
    from,
    to: [input.to],
    subject: input.subject,
    ...(input.text ? { text: input.text } : {}),
    ...(input.html ? { html: input.html } : {}),
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(20_000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let detail = errorText;
    try {
      const parsed = JSON.parse(errorText) as { message?: string };
      if (parsed.message) detail = parsed.message;
    } catch {
      /* use raw body */
    }
    throw new Error(`Resend send failed (${res.status}): ${detail}`);
  }
}
