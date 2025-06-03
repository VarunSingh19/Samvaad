import { type NextRequest, NextResponse } from "next/server";
import { debateService } from "@/services/debate/debate.service";
import { verifyAuth } from "@/lib/middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get("limit") || "50");
    const offset = Number.parseInt(searchParams.get("offset") || "0");

    const messages = await debateService.getGlobalMessages(
      params.id,
      limit,
      offset
    );

    return NextResponse.json(messages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    const message = await debateService.addGlobalMessage(
      params.id,
      user.userId,
      content
    );

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
