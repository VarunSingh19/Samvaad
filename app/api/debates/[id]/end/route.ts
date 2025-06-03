import { type NextRequest, NextResponse } from "next/server";
import { debateService } from "@/services/debate/debate.service";
import { verifyAuth } from "@/lib/middleware";
import { prisma } from "@/lib/database";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);

    // Verify user is a participant
    const participant = await prisma.debateParticipant.findFirst({
      where: {
        debate_id: params.id,
        user_id: user.userId,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "You are not a participant in this debate" },
        { status: 403 }
      );
    }

    const result = await debateService.endDebate(params.id, "ENDED");

    return NextResponse.json({
      message: "Debate ended successfully",
      debate: result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
