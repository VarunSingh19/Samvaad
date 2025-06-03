import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/services/auth/auth.service"
import { verifyAuth } from "@/lib/middleware"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)

    const profile = await authService.getProfile(user.userId)

    return NextResponse.json(profile)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}
