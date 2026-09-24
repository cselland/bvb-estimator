import { NextResponse, after } from "next/server";
import { isRateLimited, clientIp } from "@/lib/rate-limit";
import { insertScenario, isD1UnavailableError } from "@/lib/scenario-store";
import {
  isScenarioInputs,
  isScenarioTimelineEntry,
  parsePricingProvenance,
  type ScenarioPayloadV1,
  type ScenarioTimelineEntry,
} from "@/lib/scenario-payload";
import { computeScenario } from "@/lib/tco";
import { generateHarrySummaryMarkdown } from "@/lib/harry-summary";
import { markdownToEmailHtml } from "@/lib/markdown-email";
import { sendEmailViaResend } from "@/lib/resend";

const MAX_TIMELINE_ENTRIES = 300;

function normalizeInputTimeline(raw: unknown): ScenarioTimelineEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: ScenarioTimelineEntry[] = [];
  for (const item of raw.slice(0, MAX_TIMELINE_ENTRIES)) {
    if (isScenarioTimelineEntry(item)) out.push(item);
  }
  return out;
}

async function sendReportEmail(to: string, subject: string, body: string) {
  await sendEmailViaResend({ to, subject, text: body, html: markdownToEmailHtml(body) });
}

export async function POST(req: Request) {
  // 5 saves per IP per minute — each save triggers a paid AI call.
  if (isRateLimited(`scenarios:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests — please wait a minute and try again." }, { status: 429 });
  }

  try {
    const body = (await req.json()) as {
      sessionId?: string;
      email?: string | null;
      appName?: unknown;
      appDescription?: unknown;
      inputs?: unknown;
      inputTimeline?: unknown;
      finalPrimaryTool?: unknown;
      finalSecondaryTool?: unknown;
      finalPrimaryModelId?: unknown;
      finalSecondaryModelId?: unknown;
      pricing?: unknown;
    };

    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    if (!sessionId || sessionId.length > 128 || !/^[\w-]+$/.test(sessionId)) {
      return NextResponse.json({ error: "Invalid sessionId" }, { status: 400 });
    }

    if (!isScenarioInputs(body.inputs)) {
      return NextResponse.json({ error: "Invalid scenario inputs" }, { status: 400 });
    }

    const inputs = body.inputs;
    const emailRaw = typeof body.email === "string" ? body.email.trim() : "";
    if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    const email = emailRaw.length > 0 ? emailRaw : null;
    const appName =
      typeof body.appName === "string" && body.appName.trim().length > 0
        ? body.appName.trim().slice(0, 120)
        : null;
    const appDescription =
      typeof body.appDescription === "string" && body.appDescription.trim().length > 0
        ? body.appDescription.trim().slice(0, 1000)
        : null;

    const inputTimeline = normalizeInputTimeline(body.inputTimeline);
    const finalPrimaryTool =
      typeof body.finalPrimaryTool === "string" ? body.finalPrimaryTool.trim() : undefined;
    const finalSecondaryTool =
      typeof body.finalSecondaryTool === "string" ? body.finalSecondaryTool.trim() : undefined;

    const modelId = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : undefined);
    const finalPrimaryModelId = modelId(body.finalPrimaryModelId);
    const finalSecondaryModelId = modelId(body.finalSecondaryModelId);
    const pricing = parsePricingProvenance(body.pricing);

    const result = computeScenario(inputs);
    const summaryResult = await generateHarrySummaryMarkdown({
      sessionId,
      inputs,
      result,
      email,
      appName: appName || undefined,
      appDescription: appDescription || undefined,
      inputTimeline: inputTimeline.length ? inputTimeline : undefined,
      finalPrimaryTool: finalPrimaryTool || undefined,
      finalSecondaryTool: finalSecondaryTool || undefined,
    });
    const summaryMarkdown = summaryResult.markdown;
    if (summaryResult.source === "fallback" && summaryResult.error) {
      console.warn("[scenarios] Harry summary fallback:", summaryResult.error);
    }

    const payload: ScenarioPayloadV1 = {
      v: 1,
      inputs,
      inputTimeline,
      appName: appName || undefined,
      appDescription: appDescription || undefined,
      summarySource: summaryResult.source,
      summaryError: summaryResult.error ? "AI summary temporarily unavailable" : undefined,
      pricing,
      finalPrimaryModelId,
      finalSecondaryModelId,
    };

    const row = await insertScenario({
      id: crypto.randomUUID(),
      sessionId,
      email,
      payloadJson: JSON.stringify(payload),
      summaryMarkdown,
      verdict: result.verdict,
      buildThreeYearTco: result.buildThreeYearTco,
      saasThreeYearTco: result.saasThreeYearTco,
      createdAt: new Date().toISOString(),
    });

    const willEmail =
      Boolean(email && process.env.RESEND_API_KEY && process.env.RESEND_FROM);

    if (willEmail) {
      after(async () => {
        try {
          await sendReportEmail(
            email!,
            `Build vs. Buy report — ${result.verdict} (${sessionId})`,
            summaryMarkdown,
          );
        } catch (e) {
          console.warn("[scenarios] background email failed:", e);
        }
      });
    }

    return NextResponse.json({
      id: row.id,
      reportUrl: `/report/${row.id}`,
      verdict: result.verdict,
      emailQueued: willEmail,
    });
  } catch (e) {
    console.error("[scenarios] POST", e);
    const message = e instanceof Error ? e.message : "Could not save scenario";
    const status = isD1UnavailableError(e)
      ? 503
      : /timed out/i.test(message)
        ? 504
        : 500;
    const errorText =
      status === 504
        ? `${message} — verify the Cloudflare D1 binding and database availability.`
        : message;
    return NextResponse.json({ error: errorText }, { status });
  }
}
