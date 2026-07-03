import { NextResponse } from "next/server";
import { getScenarioById, checkAndIncrementShareCount, isD1UnavailableError } from "@/lib/scenario-store";
import { sendEmailViaResend } from "@/lib/resend";
import { markdownToEmailHtml } from "@/lib/markdown-email";
import { isRateLimited, clientIp } from "@/lib/rate-limit";

const MAX_SHARES_PER_SCENARIO = 20;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function sendReportEmail(to: string, subject: string, body: string) {
  await sendEmailViaResend({ to, subject, text: body, html: markdownToEmailHtml(body) });
}

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  // 3 shares per IP per minute — this endpoint sends branded email to any address.
  if (isRateLimited(`share:${clientIp(req)}`, 3, 60_000)) {
    return NextResponse.json({ error: "Too many requests — please wait a minute and try again." }, { status: 429 });
  }

  try {
    const { id } = await props.params;
    const body = (await req.json()) as { email?: string };
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid recipient email is required" }, { status: 400 });
    }

    const { ok } = await checkAndIncrementShareCount(id, MAX_SHARES_PER_SCENARIO);
    if (!ok) {
      const scenario = await getScenarioById(id);
      if (!scenario) return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
      return NextResponse.json({ error: "Share limit reached for this report" }, { status: 429 });
    }

    const scenario = await getScenarioById(id);
    if (!scenario) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    await sendReportEmail(
      email,
      `Build vs. Buy report shared — ${scenario.verdict} (${scenario.sessionId})`,
      scenario.summaryMarkdown,
    );

    return NextResponse.json({ ok: true, message: `Report sent to ${email}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not share report";
    const status = isD1UnavailableError(error)
      ? 503
      : /not configured/i.test(message)
        ? 503
        : /timed out/i.test(message)
          ? 504
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
