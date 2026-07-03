import { NextResponse } from "next/server";
import { upsertSessionDraft, isD1UnavailableError } from "@/lib/scenario-store";
import { isScenarioInputs } from "@/lib/scenario-payload";
import { computeScenario } from "@/lib/tco";

export async function PUT(
  req: Request,
  props: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await props.params;

    if (!sessionId || sessionId.length > 128 || !/^[\w-]+$/.test(sessionId)) {
      return NextResponse.json({ error: "Invalid sessionId" }, { status: 400 });
    }

    const body = (await req.json()) as {
      inputs?: unknown;
      appName?: unknown;
      appDescription?: unknown;
    };

    if (!isScenarioInputs(body.inputs)) {
      return NextResponse.json({ error: "Invalid inputs" }, { status: 400 });
    }

    const result = computeScenario(body.inputs);

    const appName =
      typeof body.appName === "string" && body.appName.trim()
        ? body.appName.trim().slice(0, 120)
        : undefined;
    const appDescription =
      typeof body.appDescription === "string" && body.appDescription.trim()
        ? body.appDescription.trim().slice(0, 1000)
        : undefined;

    await upsertSessionDraft({
      sessionId,
      payloadJson: JSON.stringify({ v: 1, inputs: body.inputs, inputTimeline: [], appName, appDescription }),
      verdict: result.verdict,
      buildThreeYearTco: result.buildThreeYearTco,
      saasThreeYearTco: result.saasThreeYearTco,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isD1UnavailableError(e)) {
      return NextResponse.json({ ok: false, reason: "d1_unavailable" }, { status: 503 });
    }
    console.error("[sessions] PUT", e);
    return NextResponse.json({ error: "Could not persist session" }, { status: 500 });
  }
}
