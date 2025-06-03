import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/services/auth/auth.service"
import { verifyAuth } from "@/lib/middleware"

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)

    await authService.logout(user.userId)

    const response = NextResponse.json({ message: "Logout successful" })

    // Clear cookies
    response.cookies.delete("access_token")
    response.cookies.delete("refresh_token")

    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}
