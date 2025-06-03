import { type NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth/auth.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, full_name, account_type } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    console.log(`Registering new user: ${username} (${email})`);

    const result = await authService.register({
      username,
      email,
      password,
      full_name,
      account_type,
    });

    console.log(`User registered successfully: ${username}`);

    const response = NextResponse.json({
      user: result.user,
      message: "Registration successful",
    });

    // Set HTTP-only cookies
    response.cookies.set("access_token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutes
    });

    response.cookies.set("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Registration error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
