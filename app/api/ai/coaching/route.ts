import { type NextRequest, NextResponse } from "next/server"
import { aiCoachingService } from "@/services/ai/ai-coaching.service"
import { verifyAuth } from "@/lib/middleware"
import prisma from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    const body = await request.json()
    const { debateId, currentMessage } = body

    if (!debateId || !currentMessage) {
      return NextResponse.json({ error: "Debate ID and current message are required" }, { status: 400 })
    }

    // Get debate history
    const messages = await prisma.debateMessage.findMany({
      where: { debate_id: debateId },
      select: { content: true },
      orderBy: { created_at: "asc" },
      take: 10, // Last 10 messages for context
    })

    const debateHistory = messages.map((msg) => msg.content)

    const tips = await aiCoachingService.provideRealTimeCoaching(user.userId, debateId, currentMessage, debateHistory)

    return NextResponse.json({ tips })
  } catch (error: any) {
    console.error("Coaching error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
