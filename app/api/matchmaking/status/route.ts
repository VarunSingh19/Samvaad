import { type NextRequest, NextResponse } from "next/server"
import { matchmakingService } from "@/services/matchmaking/matchmaking.service"
import { verifyAuth } from "@/lib/middleware"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)

    const status = await matchmakingService.getQueueStatus(user.userId)

    return NextResponse.json(status)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
