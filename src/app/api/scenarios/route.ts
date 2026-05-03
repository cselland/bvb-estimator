import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeScenario, type ScenarioInputs } from "@/lib/tco";
import { generateSummaryMarkdown } from "@/lib/summary-report";

function isScenarioInputs(v: unknown): v is ScenarioInputs {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  const nums = [
    "timeToGoLive",
    "appLifespan",
    "annualSaasCost",
    "appCriticality",
    "selfCodingAppetite",
    "customizationImportance",
    "saasImplementationCost",
    "buildEngineers",
    "buildTimeframeMonths",
    "costPerEngineerPerYear",
    "supportReps",
    "costPerRepPerYear",
  ];
  return nums.every((k) => typeof o[k] === "number" && Number.isFinite(o[k] as number));
}

async function sendReportEmail(to: string, subject: string, body: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const from = process.env.RESEND_FROM;
  if (!from) return;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
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

    const result = computeScenario(inputs);
    const summaryMarkdown = generateSummaryMarkdown(sessionId, inputs, result, email);

    const row = await prisma.scenario.create({
      data: {
        sessionId,
        email,
        payloadJson: JSON.stringify(inputs),
        summaryMarkdown,
        verdict: result.verdict,
        buildThreeYearTco: result.buildThreeYearTco,
        saasThreeYearTco: result.saasThreeYearTco,
      },
    });

    if (email && process.env.RESEND_API_KEY && process.env.RESEND_FROM) {
      await sendReportEmail(
        email,
        `Build vs. Buy report — ${result.verdict} (${sessionId})`,
        summaryMarkdown,
      );
    }

    return NextResponse.json({
      id: row.id,
      reportUrl: `/report/${row.id}`,
      verdict: result.verdict,
      emailQueued: Boolean(email && process.env.RESEND_API_KEY && process.env.RESEND_FROM),
    });
  } catch (e) {
    console.error("[scenarios] POST", e);
    return NextResponse.json({ error: "Could not save scenario" }, { status: 500 });
  }
}
