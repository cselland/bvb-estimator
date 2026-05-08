import { NextResponse, after } from "next/server";
import { insertScenario } from "@/lib/scenario-store";
import {
  isScenarioInputs,
  isScenarioTimelineEntry,
  type ScenarioPayloadV1,
  type ScenarioTimelineEntry,
} from "@/lib/scenario-payload";
import { computeScenario } from "@/lib/tco";
import { generateSummaryMarkdown } from "@/lib/summary-report";
import { generateHarrySummaryMarkdown } from "@/lib/harry-summary";

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
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const from = process.env.RESEND_FROM;
  if (!from) return;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(20_000),
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text: body,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.warn("[scenarios] Resend error:", res.status, err);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      sessionId?: string;
      email?: string | null;
      inputs?: unknown;
      inputTimeline?: unknown;
      finalPrimaryTool?: unknown;
      finalSecondaryTool?: unknown;
    };

    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
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

    const inputTimeline = normalizeInputTimeline(body.inputTimeline);
    const finalPrimaryTool =
      typeof body.finalPrimaryTool === "string" ? body.finalPrimaryTool.trim() : undefined;
    const finalSecondaryTool =
      typeof body.finalSecondaryTool === "string" ? body.finalSecondaryTool.trim() : undefined;

    const result = computeScenario(inputs);
    let summaryMarkdown = generateSummaryMarkdown(sessionId, inputs, result, email, {
      inputTimeline: inputTimeline.length ? inputTimeline : undefined,
      finalPrimaryTool: finalPrimaryTool || undefined,
      finalSecondaryTool: finalSecondaryTool || undefined,
    });

    try {
      summaryMarkdown = await generateHarrySummaryMarkdown({
        sessionId,
        inputs,
        result,
        email,
        inputTimeline: inputTimeline.length ? inputTimeline : undefined,
        finalPrimaryTool: finalPrimaryTool || undefined,
        finalSecondaryTool: finalSecondaryTool || undefined,
      });
    } catch (harryErr) {
      console.warn("[scenarios] Harry summary unavailable, using fallback template:", harryErr);
    }

    const payload: ScenarioPayloadV1 = {
      v: 1,
      inputs,
      inputTimeline,
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
    const status = /timed out/i.test(message) ? 504 : 500;
    return NextResponse.json(
      { error: status === 504 ? `${message} — verify the Cloudflare D1 binding and database availability.` : message },
      { status }
    );
  }
}
