import { type NextRequest, NextResponse } from "next/server";
import { debateService } from "@/services/debate/debate.service";
import { verifyAuth } from "@/lib/middleware";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);

    await debateService.leaveDebate(params.id, user.userId);

    return NextResponse.json({ message: "Exited debate successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
