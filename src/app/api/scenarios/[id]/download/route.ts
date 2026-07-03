import { NextResponse } from "next/server";
import { getScenarioById, isD1UnavailableError } from "@/lib/scenario-store";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Await the params (Next.js 15/16 requirement)
    const { id } = await props.params;

    const scenario = await getScenarioById(id);

    if (!scenario) {
      return new NextResponse("Scenario not found", { status: 404 });
    }

    // 3. Format the filename safely
    const safeName = (scenario.sessionId || "report").replace(/[^\w.-]+/g, "_");

    // 4. Return the markdown file
    return new NextResponse(scenario.summaryMarkdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="build-vs-buy-${safeName}.md"`,
      },
    });
    
  } catch (error) {
    console.error("Download Error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    const status = isD1UnavailableError(error) ? 503 : /timed out/i.test(msg) ? 504 : 500;
    return new NextResponse(msg, { status });
  }
}