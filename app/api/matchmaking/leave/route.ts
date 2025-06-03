import { type NextRequest, NextResponse } from "next/server"
import { matchmakingService } from "@/services/matchmaking/matchmaking.service"
import { verifyAuth } from "@/lib/middleware"

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)

    const result = await matchmakingService.leaveQueue(user.userId)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
