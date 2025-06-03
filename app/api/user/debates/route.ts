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

    // Get the user's debates from the database
    const debates = await db.debate.findMany({
      where: {
        participants: {
          some: {
            user_id: user.id,
          },
        },
      },
      select: {
        id: true,
        title: true,
        topic: true,
        status: true,
        created_at: true,
        winner_id: true,
      },
      orderBy: {
        created_at: "desc",
      },
      take: 10, // Limit to 10 most recent debates
    });

    return NextResponse.json(debates);
  } catch (error) {
    console.error("Error fetching user debates:", error);
    return NextResponse.json(
      { error: "Failed to fetch debates" },
      { status: 500 }
    );
  }
}
