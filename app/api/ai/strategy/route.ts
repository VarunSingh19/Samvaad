import { type NextRequest, NextResponse } from "next/server"
import { aiCoachingService } from "@/services/ai/ai-coaching.service"
import { verifyAuth } from "@/lib/middleware"
import prisma from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    const body = await request.json()
    const { debateId } = body

    if (!debateId) {
      return NextResponse.json({ error: "Debate ID is required" }, { status: 400 })
    }

    // Get debate and user's position
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      select: { topic: true },
    })

    const participant = await prisma.debateParticipant.findFirst({
      where: {
        debate_id: debateId,
        user_id: user.userId,
      },
      select: { role: true },
    })

    if (!debate || !participant) {
      return NextResponse.json({ error: "Debate or participant not found" }, { status: 404 })
    }

    // Get opponent's messages
    const opponentMessages = await prisma.debateMessage.findMany({
      where: {
        debate_id: debateId,
        role: participant.role === "AFFIRMATIVE" ? "NEGATIVE" : "AFFIRMATIVE",
      },
      select: { content: true },
      orderBy: { created_at: "asc" },
    })

    const strategy = await aiCoachingService.generateDebateStrategy(
      user.userId,
      debateId,
      participant.role.toLowerCase() as "affirmative" | "negative",
      debate.topic,
      opponentMessages.map((msg) => msg.content),
    )

    return NextResponse.json(strategy)
  } catch (error: any) {
    console.error("Strategy generation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
