import { type NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { current_password, new_password } = body;

    // Get the user with password from the database
    const userWithPassword = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        password: true,
      },
    });

    if (!userWithPassword) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify the current password
    const isPasswordValid = await bcrypt.compare(
      current_password,
      userWithPassword.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update the user's password
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        last_active_at: new Date(),
      },
    });

    return NextResponse.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
