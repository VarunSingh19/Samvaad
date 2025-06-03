import { type NextRequest, NextResponse } from "next/server";
import { debateService } from "@/services/debate/debate.service";
import { verifyAuth } from "@/lib/middleware";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);

    const result = await debateService.beginDebate(params.id, user.userId);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
