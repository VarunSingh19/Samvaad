import { type NextRequest, NextResponse } from "next/server"
import { aiModerationService } from "@/services/ai/ai-moderation.service"
import { verifyAuth } from "@/lib/middleware"

export async function POST(request: NextRequest) {
  try {
    await verifyAuth(request)
    const body = await request.json()
    const { content, type = "text" } = body

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const moderation = await aiModerationService.moderateContent(content, type)

    return NextResponse.json(moderation)
  } catch (error: any) {
    console.error("Moderation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
