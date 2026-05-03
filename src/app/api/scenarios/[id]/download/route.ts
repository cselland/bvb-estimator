import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const scenario = await prisma.scenario.findUnique({ where: { id: params.id } });
  if (!scenario) {
    return new NextResponse("Not found", { status: 404 });
  }

  const safeName = scenario.sessionId.replace(/[^\w.-]+/g, "_");
  return new NextResponse(scenario.summaryMarkdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="build-vs-buy-${safeName}.md"`,
    },
  });
}
