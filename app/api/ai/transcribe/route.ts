import { type NextRequest, NextResponse } from "next/server"
import { aiModerationService } from "@/services/ai/ai-moderation.service"
import { verifyAuth } from "@/lib/middleware"

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    const formData = await request.formData()

    const audioFile = formData.get("audio") as File
    const debateId = formData.get("debateId") as string
    const language = (formData.get("language") as string) || "en"

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 })
    }

    // Convert file to buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer())

    // Transcribe audio
    const transcription = await aiModerationService.transcribeAudio(audioBuffer, {
      language,
      debateId,
      userId: user.userId,
    })

    // Analyze the transcribed text
    const analysis = await aiModerationService.analyzeText(transcription.text, {
      debateId,
      userId: user.userId,
    })

    // Moderate content
    const moderation = await aiModerationService.moderateContent(transcription.text)

    return NextResponse.json({
      transcript: transcription.text,
      confidence: transcription.confidence,
      language: transcription.language,
      aiScore: analysis.score,
      feedback: analysis.feedback,
      flagged: !moderation.allowed,
      moderation,
    })
  } catch (error: any) {
    console.error("Transcription error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
