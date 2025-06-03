import { type NextRequest, NextResponse } from "next/server"
import { debateService } from "@/services/debate/debate.service"
import { verifyAuth } from "@/lib/middleware"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || undefined
    const mode = searchParams.get("mode") || undefined
    const type = searchParams.get("type") || undefined
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const debates = await debateService.getDebates({
      status,
      mode,
      type,
      limit,
      offset,
    })

    return NextResponse.json(debates)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    const body = await request.json()

    const { title, topic, type, mode, duration_minutes, visibility, tags } = body

    if (!title || !topic || !type || !mode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const debate = await debateService.createDebate({
      title,
      topic,
      type,
      mode: mode.toUpperCase(),
      duration_minutes,
      visibility: visibility?.toUpperCase(),
      tags,
      created_by: user.userId,
    })

    return NextResponse.json(debate, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
