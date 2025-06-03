import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/services/auth/auth.service"

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token not found" }, { status: 401 })
    }

    const result = await authService.refreshToken(refreshToken)

    const response = NextResponse.json({ message: "Token refreshed" })

    // Set new tokens
    response.cookies.set("access_token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutes
    })

    response.cookies.set("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}
