import { type NextRequest, NextResponse } from "next/server";
import { debateService } from "@/services/debate/debate.service";
import { aiModerationService } from "@/services/ai/ai-moderation.service";
import { verifyAuth } from "@/lib/middleware";
import prisma from "@/lib/database";
import { getWebSocketManager } from "@/lib/websocket";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get("limit") || "50");
    const offset = Number.parseInt(searchParams.get("offset") || "0");

    const messages = await debateService.getDebateMessages(
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
    const { content, message_type } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Get debate context for better AI analysis
    const debate = await prisma.debate.findUnique({
      where: { id: params.id },
      select: { title: true, topic: true, type: true },
    });

    if (!debate) {
      return NextResponse.json({ error: "Debate not found" }, { status: 404 });
    }

    // Get user's role in the debate
    const participant = await prisma.debateParticipant.findFirst({
      where: {
        debate_id: params.id,
        user_id: user.userId,
      },
      select: { role: true },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "User is not a participant" },
        { status: 403 }
      );
    }

    // First, moderate the content with Gemini AI
    const moderation = await aiModerationService.moderateContent(content);

    if (!moderation.allowed && moderation.severity === "high") {
      return NextResponse.json(
        {
          error: "Message contains inappropriate content",
          reason: moderation.reason,
          severity: moderation.severity,
        },
        { status: 400 }
      );
    }

    // Create message
    const message = await debateService.addMessage(
      params.id,
      user.userId,
      content,
      message_type
    );

    // Analyze with AI immediately for better real-time feedback
    try {
      const analysis = await aiModerationService.analyzeText(content, {
        debateId: params.id,
        userId: user.userId,
        role: participant.role,
        debateTopic: debate.topic,
        debateTitle: debate.title,
      });

      // Update message with AI analysis
      await prisma.debateMessage.update({
        where: { id: message.id },
        data: {
          ai_score: analysis.score,
          ai_feedback: analysis.feedback,
          is_flagged: analysis.flagged || !moderation.allowed,
        },
      });

      // Send enhanced response with AI analysis
      const wsManager = getWebSocketManager();
      if (wsManager) {
        wsManager.sendToDebateRoom(params.id, "message_with_analysis", {
          message: {
            ...message,
            ai_score: analysis.score,
            ai_feedback: analysis.feedback,
            is_flagged: analysis.flagged || !moderation.allowed,
          },
          analysis,
          moderation,
        });
      }

      return NextResponse.json(
        {
          ...message,
          ai_analysis: analysis,
          moderation,
        },
        { status: 201 }
      );
    } catch (aiError) {
      console.error("AI analysis failed:", aiError);

      // Return message without AI analysis if AI fails
      return NextResponse.json(
        {
          ...message,
          moderation,
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    console.error("Message creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
