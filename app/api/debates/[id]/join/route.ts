import { type NextRequest, NextResponse } from "next/server"
import { debateService } from "@/services/debate/debate.service"
import { verifyAuth } from "@/lib/middleware"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyAuth(request)

    const participant = await debateService.joinDebate({
      debate_id: params.id,
      user_id: user.userId,
    })

    return NextResponse.json(participant)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
