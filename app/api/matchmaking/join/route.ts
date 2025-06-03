import { type NextRequest, NextResponse } from "next/server"
import { matchmakingService } from "@/services/matchmaking/matchmaking.service"
import { verifyAuth } from "@/lib/middleware"

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    const body = await request.json()

    const { debate_type, mode, visibility, duration_minutes } = body

    if (!debate_type || !mode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await matchmakingService.joinQueue({
      user_id: user.userId,
      debate_type,
      mode: mode.toUpperCase(),
      visibility: visibility?.toUpperCase() || "PUBLIC",
      duration_minutes: duration_minutes || 30,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
