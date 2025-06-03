import { type NextRequest, NextResponse } from "next/server";
import { aiModerationService } from "@/services/ai/ai-moderation.service";
import { verifyAuth } from "@/lib/middleware";
import prisma from "@/lib/database";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await verifyAuth(request);

    const summary = await aiModerationService.generateDebateSummary(params.id);

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("Summary generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const debate = await prisma.debate.findUnique({
      where: { id: params.id },
      select: { ai_summary: true },
    });

    if (!debate) {
      return NextResponse.json({ error: "Debate not found" }, { status: 404 });
    }

    return NextResponse.json({ summary: debate.ai_summary });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
