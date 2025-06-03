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

    // Get the user's profile from the database
    const profile = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        bio: true,
        avatar_url: true,
        account_type: true,
        level: true,
        rank: true,
        elo_rating: true,
        xp: true,
        created_at: true,
        last_active_at: true,
        stats: {
          select: {
            total_debates: true,
            wins: true,
            losses: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Format the response
    const formattedProfile = {
      ...profile,
      total_debates: profile.stats?.total_debates || 0,
      wins: profile.stats?.wins || 0,
      losses: profile.stats?.losses || 0,
    };

    // Remove the stats object
    delete formattedProfile.stats;

    return NextResponse.json(formattedProfile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
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
    const { full_name, bio } = body;

    // Update the user's profile
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        full_name,
        bio,
        last_active_at: new Date(),
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        full_name: updatedUser.full_name,
        bio: updatedUser.bio,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
