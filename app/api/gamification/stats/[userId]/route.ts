import { type NextRequest, NextResponse } from "next/server"
import { gamificationService } from "@/services/gamification/gamification.service"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const stats = await gamificationService.getUserStats(params.userId)

    return NextResponse.json(stats)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
}
