import { type NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's settings from the database
    const settings = await db.userSettings.findUnique({
      where: { user_id: user.id },
    });

    if (!settings) {
      // Create default settings if they don't exist
      const defaultSettings = await db.userSettings.create({
        data: {
          user_id: user.id,
          email_notifications: true,
          push_notifications: false,
          debate_reminders: true,
          language: "en",
          theme: "system",
          content_language: ["english"],
          privacy_profile: "public",
          privacy_stats: "public",
          two_factor_auth: false,
        },
      });

      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get the authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const {
      email_notifications,
      push_notifications,
      debate_reminders,
      language,
      theme,
      content_language,
      privacy_profile,
      privacy_stats,
      two_factor_auth,
    } = body;

    // Update the user's settings
    const updatedSettings = await db.userSettings.upsert({
      where: { user_id: user.id },
      update: {
        email_notifications,
        push_notifications,
        debate_reminders,
        language,
        theme,
        content_language,
        privacy_profile,
        privacy_stats,
        two_factor_auth,
      },
      create: {
        user_id: user.id,
        email_notifications,
        push_notifications,
        debate_reminders,
        language,
        theme,
        content_language,
        privacy_profile,
        privacy_stats,
        two_factor_auth,
      },
    });

    // Update the user's last active time
    await db.user.update({
      where: { id: user.id },
      data: {
        last_active_at: new Date(),
      },
    });

    return NextResponse.json({
      message: "Settings updated successfully",
      settings: updatedSettings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
