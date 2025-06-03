import { type NextRequest, NextResponse } from "next/server";
import { debateService } from "@/services/debate/debate.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const results = await debateService.getDebateResults(params.id);

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}
