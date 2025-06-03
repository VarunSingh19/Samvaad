import { type NextRequest, NextResponse } from "next/server"
import { aiModerationService } from "@/services/ai/ai-moderation.service"
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

    // Get user's messages from the debate
    const userMessages = await prisma.debateMessage.findMany({
      where: {
        debate_id: debateId,
        sender_id: user.userId,
      },
      select: { content: true },
      orderBy: { created_at: "asc" },
    })

    if (userMessages.length === 0) {
      return NextResponse.json({ error: "No messages found for this user in the debate" }, { status: 404 })
    }

    const messageTexts = userMessages.map((msg) => msg.content)

    const feedback = await aiModerationService.generatePersonalizedFeedback(user.userId, debateId, messageTexts)

    return NextResponse.json(feedback)
  } catch (error: any) {
    console.error("Feedback generation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
