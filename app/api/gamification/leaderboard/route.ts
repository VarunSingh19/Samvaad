import { type NextRequest, NextResponse } from "next/server"
import { gamificationService } from "@/services/gamification/gamification.service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = (searchParams.get("type") as "global" | "weekly" | "category") || "global"
    const category = searchParams.get("category") || undefined
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const leaderboard = await gamificationService.getLeaderboard(type, category, limit)

    return NextResponse.json(leaderboard)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
