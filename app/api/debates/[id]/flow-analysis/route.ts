import { type NextRequest, NextResponse } from "next/server"
import { aiCoachingService } from "@/services/ai/ai-coaching.service"
import { verifyAuth } from "@/lib/middleware"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAuth(request)

    const analysis = await aiCoachingService.analyzeDebateFlow(params.id)

    return NextResponse.json(analysis)
  } catch (error: any) {
    console.error("Flow analysis error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
