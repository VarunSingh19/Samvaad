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

    // Get online users (active in the last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const onlineUsers = await db.user.findMany({
      where: {
        is_online: true,
        last_active_at: {
          gte: fiveMinutesAgo,
        },
        id: {
          not: user.id, // Exclude the current user
        },
      },
      select: {
        id: true,
        username: true,
        avatar_url: true,
        level: true,
        rank: true,
        elo_rating: true,
        stats: {
          select: {
            total_debates: true,
            wins: true,
            losses: true,
          },
        },
      },
      orderBy: {
        last_active_at: "desc",
      },
      take: 20, // Limit to 20 users
    });

    // Format the response
    const formattedUsers = onlineUsers.map((user) => ({
      id: user.id,
      username: user.username,
      avatar_url: user.avatar_url,
      level: user.level,
      rank: user.rank,
      elo_rating: user.elo_rating,
      total_debates: user.stats?.total_debates || 0,
      wins: user.stats?.wins || 0,
      losses: user.stats?.losses || 0,
      win_rate: user.stats?.total_debates
        ? Math.round((user.stats.wins / user.stats.total_debates) * 100)
        : 0,
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching online users:", error);
    return NextResponse.json(
      { error: "Failed to fetch online users" },
      { status: 500 }
    );
  }
}
