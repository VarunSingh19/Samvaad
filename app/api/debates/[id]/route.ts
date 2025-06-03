import { type NextRequest, NextResponse } from "next/server"
import { debateService } from "@/services/debate/debate.service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const debate = await debateService.getDebateById(params.id)

    // Update view count
    await debateService.updateDebateViews(params.id)

    return NextResponse.json(debate)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
}
