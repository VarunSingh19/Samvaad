import { type NextRequest, NextResponse } from "next/server"
import { aiModerationService } from "@/services/ai/ai-moderation.service"
import { verifyAuth } from "@/lib/middleware"

export async function POST(request: NextRequest) {
  try {
    await verifyAuth(request)
    const body = await request.json()
    const { text, targetLanguage, detectLanguage = false } = body

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const result: any = {}

    if (detectLanguage) {
      const detectedLanguage = await aiModerationService.detectLanguage(text)
      result.detectedLanguage = detectedLanguage
    }

    if (targetLanguage) {
      const translation = await aiModerationService.translateText(text, targetLanguage)
      result.translation = translation
      result.targetLanguage = targetLanguage
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Translation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
