import { NextResponse } from "next/server";
import { insertEvents, isD1UnavailableError } from "@/lib/scenario-store";
import { isRateLimited, clientIp } from "@/lib/rate-limit";

type RawEvent = { control?: unknown; value?: unknown; seq?: unknown; occurred_at?: unknown };

function isValidEvent(e: unknown): e is { control: string; value: string; seq: number; occurred_at: string } {
  if (!e || typeof e !== "object") return false;
  const o = e as RawEvent;
  return (
    typeof o.control === "string" &&
    o.control.length > 0 &&
    o.control.length <= 80 &&
    typeof o.value === "string" &&
    o.value.length <= 500 &&
    typeof o.seq === "number" &&
    Number.isInteger(o.seq) &&
    typeof o.occurred_at === "string" &&
    o.occurred_at.length <= 30 &&
    !Number.isNaN(Date.parse(o.occurred_at))
  );
}

export async function POST(req: Request) {
  // 30 flushes per IP per minute — generous for normal interaction telemetry.
  if (isRateLimited(`events:${clientIp(req)}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = (await req.json()) as { sessionId?: unknown; events?: unknown };

    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    if (!Array.isArray(body.events)) {
      return NextResponse.json({ error: "events must be an array" }, { status: 400 });
    }

    const rows = body.events
      .slice(0, 500) // hard cap per flush
      .filter(isValidEvent)
      .map((e) => ({
        sessionId,
        seq: e.seq,
        control: e.control,
        value: e.value,
        occurredAt: e.occurred_at,
      }));

    await insertEvents(rows);
    return NextResponse.json({ ok: true, inserted: rows.length });
  } catch (e) {
    if (isD1UnavailableError(e)) {
      return NextResponse.json({ ok: false, reason: "d1_unavailable" }, { status: 503 });
    }
    console.error("[events] POST", e);
    return NextResponse.json({ error: "Could not insert events" }, { status: 500 });
  }
}
