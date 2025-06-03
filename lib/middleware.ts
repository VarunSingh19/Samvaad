import type { NextRequest } from "next/server"
import { authService } from "@/services/auth/auth.service"

export async function verifyAuth(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value

  if (!accessToken) {
    throw new Error("Access token not found")
  }

  try {
    const decoded = await authService.verifyToken(accessToken)
    return decoded
  } catch (error) {
    throw new Error("Invalid or expired token")
  }
}

export async function requireAdmin(request: NextRequest) {
  const user = await verifyAuth(request)

  if (user.accountType !== "ADMIN") {
    throw new Error("Admin access required")
  }

  return user
}
