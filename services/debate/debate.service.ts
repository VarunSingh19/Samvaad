// import prisma from "@/lib/database";
// import { getWebSocketManager } from "@/lib/websocket";
// import { emailService } from "../email/email.service";
// import { gamificationService } from "../gamification/gamification.service";
// import { aiModerationService } from "../ai/ai-moderation.service";

// export interface CreateDebateData {
//   title: string;
//   topic: string;
//   type: string;
//   mode: "TEXT" | "AUDIO";
//   duration_minutes?: number;
//   visibility?: "PUBLIC" | "PRIVATE";
//   tags?: string[];
//   created_by: string;
// }

// export interface JoinDebateData {
//   debate_id: string;
//   user_id: string;
// }

// export class DebateService {
//   async createDebate(data: CreateDebateData) {
//     const debate = await prisma.debate.create({
//       data: {
//         title: data.title,
//         topic: data.topic,
//         type: data.type,
//         mode: data.mode,
//         duration_minutes: data.duration_minutes || 30,
//         visibility: data.visibility || "PUBLIC",
//         tags: data.tags || [],
//         created_by: data.created_by,
//         status: "PENDING",
//       },
//       include: {
//         creator: {
//           select: { id: true, username: true },
//         },
//       },
//     });

//     // Add creator as first participant
//     await prisma.debateParticipant.create({
//       data: {
//         debate_id: debate.id,
//         user_id: data.created_by,
//         role: "AFFIRMATIVE",
//         position: "For",
//         is_host: true,
//       },
//     });

//     // Return debate with participants
//     const debateWithParticipants = await prisma.debate.findUnique({
//       where: { id: debate.id },
//       include: {
//         creator: {
//           select: { id: true, username: true },
//         },
//         participants: {
//           include: {
//             user: {
//               select: { id: true, username: true, level: true, rank: true },
//             },
//           },
//         },
//       },
//     });

//     return debateWithParticipants;
//   }

//   async getDebates(filters?: {
//     status?: string;
//     mode?: string;
//     type?: string;
//     limit?: number;
//     offset?: number;
//   }) {
//     const where: any = {};

//     if (filters?.status) {
//       where.status = filters.status;
//     }
//     if (filters?.mode) {
//       where.mode = filters.mode;
//     }
//     if (filters?.type) {
//       where.type = filters.type;
//     }

//     const debates = await prisma.debate.findMany({
//       where,
//       include: {
//         creator: {
//           select: { id: true, username: true },
//         },
//         participants: {
//           include: {
//             user: {
//               select: { id: true, username: true, level: true, rank: true },
//             },
//           },
//         },
//         _count: {
//           select: { messages: true },
//         },
//       },
//       orderBy: { created_at: "desc" },
//       take: filters?.limit || 20,
//       skip: filters?.offset || 0,
//     });

//     return debates.map((debate) => ({
//       ...debate,
//       participant_count: debate.participants.length,
//       message_count: debate._count.messages,
//       creator_username: debate.creator.username,
//     }));
//   }

//   async getDebateById(debateId: string) {
//     const debate = await prisma.debate.findUnique({
//       where: { id: debateId },
//       include: {
//         creator: {
//           select: { id: true, username: true },
//         },
//         winner: {
//           select: { id: true, username: true, level: true, rank: true },
//         },
//         participants: {
//           include: {
//             user: {
//               select: {
//                 id: true,
//                 username: true,
//                 level: true,
//                 rank: true,
//                 avatar_url: true,
//                 is_online: true,
//               },
//             },
//           },
//         },
//         messages: {
//           include: {
//             sender: {
//               select: { id: true, username: true },
//             },
//           },
//           orderBy: { created_at: "asc" },
//         },
//       },
//     });

//     if (!debate) {
//       throw new Error("Debate not found");
//     }

//     // Check if debate should be automatically ended
//     if (debate.status === "LIVE" && debate.started_at) {
//       const endTime = new Date(
//         debate.started_at.getTime() + debate.duration_minutes * 60 * 1000
//       );
//       if (new Date() > endTime) {
//         await this.endDebate(debateId, "ENDED");
//         // Refetch the updated debate
//         return this.getDebateById(debateId);
//       }
//     }

//     return debate;
//   }

//   async joinDebate(data: JoinDebateData) {
//     // Check if debate exists and is joinable
//     const debate = await prisma.debate.findUnique({
//       where: { id: data.debate_id },
//       include: {
//         participants: {
//           include: {
//             user: {
//               select: { id: true, username: true, email: true },
//             },
//           },
//         },
//         creator: {
//           select: { id: true, username: true, email: true },
//         },
//       },
//     });

//     if (!debate) {
//       throw new Error("Debate not found");
//     }

//     if (debate.status !== "PENDING") {
//       throw new Error("Debate is not accepting new participants");
//     }

//     if (debate.participants.length >= 2) {
//       throw new Error("Debate is full");
//     }

//     // Check if user is already a participant
//     const existingParticipant = debate.participants.find(
//       (p) => p.user_id === data.user_id
//     );
//     if (existingParticipant) {
//       throw new Error("User is already a participant");
//     }

//     // Get joiner details
//     const joiner = await prisma.user.findUnique({
//       where: { id: data.user_id },
//       select: { username: true, email: true },
//     });

//     if (!joiner) {
//       throw new Error("User not found");
//     }

//     // Determine role (opposite of existing participant)
//     const existingRole = debate.participants[0]?.role;
//     const newRole = existingRole === "AFFIRMATIVE" ? "NEGATIVE" : "AFFIRMATIVE";
//     const position = newRole === "AFFIRMATIVE" ? "For" : "Against";

//     // Add participant
//     const participant = await prisma.debateParticipant.create({
//       data: {
//         debate_id: data.debate_id,
//         user_id: data.user_id,
//         role: newRole,
//         position,
//       },
//       include: {
//         user: {
//           select: { id: true, username: true, level: true, rank: true },
//         },
//       },
//     });

//     // Update debate status to READY (waiting for both users to begin)
//     await prisma.debate.update({
//       where: { id: data.debate_id },
//       data: { status: "READY" },
//     });

//     // Send email notifications
//     try {
//       // Notify creator
//       await emailService.sendDebateJoinedNotification(
//         debate.creator.email,
//         debate.creator.username,
//         joiner.username,
//         debate.title,
//         debate.id
//       );

//       // Notify joiner
//       await emailService.sendDebateAcceptedNotification(
//         joiner.email,
//         joiner.username,
//         debate.creator.username,
//         debate.title,
//         debate.id
//       );
//     } catch (error) {
//       console.error("Failed to send email notifications:", error);
//     }

//     // Notify via WebSocket
//     const wsManager = getWebSocketManager();
//     if (wsManager) {
//       wsManager.sendToDebateRoom(data.debate_id, "participant_joined", {
//         debateId: data.debate_id,
//         participant,
//         status: "READY",
//       });
//     }

//     return participant;
//   }

//   async beginDebate(debateId: string, userId: string) {
//     // Verify user is participant
//     const participant = await prisma.debateParticipant.findFirst({
//       where: {
//         debate_id: debateId,
//         user_id: userId,
//       },
//     });

//     if (!participant) {
//       throw new Error("User is not a participant in this debate");
//     }

//     // Update participant as ready
//     await prisma.debateParticipant.update({
//       where: { id: participant.id },
//       data: { is_ready: true },
//     });

//     // Check if both participants are ready
//     const allParticipants = await prisma.debateParticipant.findMany({
//       where: { debate_id: debateId },
//     });

//     const readyParticipants = allParticipants.filter((p) => p.is_ready);

//     if (readyParticipants.length >= 2) {
//       // Start the debate
//       await prisma.debate.update({
//         where: { id: debateId },
//         data: {
//           status: "LIVE",
//           started_at: new Date(),
//         },
//       });

//       // Schedule automatic ending
//       this.scheduleDebateEnd(debateId);

//       // Notify all participants via WebSocket
//       const wsManager = getWebSocketManager();
//       if (wsManager) {
//         wsManager.sendToDebateRoom(debateId, "debate_started", {
//           debateId,
//           startedAt: new Date(),
//         });
//       }

//       return { status: "LIVE", message: "Debate started!" };
//     }

//     return { status: "WAITING", message: "Waiting for opponent to begin" };
//   }

//   private scheduleDebateEnd(debateId: string) {
//     // Get debate duration and schedule automatic ending
//     prisma.debate
//       .findUnique({
//         where: { id: debateId },
//         select: { duration_minutes: true },
//       })
//       .then((debate) => {
//         if (debate) {
//           setTimeout(() => {
//             this.endDebate(debateId, "ENDED").catch(console.error);
//           }, debate.duration_minutes * 60 * 1000);
//         }
//       })
//       .catch(console.error);
//   }

//   async leaveDebate(debateId: string, userId: string) {
//     const participant = await prisma.debateParticipant.findFirst({
//       where: {
//         debate_id: debateId,
//         user_id: userId,
//       },
//     });

//     if (!participant) {
//       throw new Error("User is not a participant in this debate");
//     }

//     // Update participant with leave time
//     await prisma.debateParticipant.update({
//       where: { id: participant.id },
//       data: { left_at: new Date() },
//     });

//     // If debate is live, end it
//     const debate = await prisma.debate.findUnique({
//       where: { id: debateId },
//     });

//     if (debate?.status === "LIVE") {
//       await this.endDebate(debateId, "CANCELLED");
//     }

//     // Notify via WebSocket
//     const wsManager = getWebSocketManager();
//     if (wsManager) {
//       wsManager.sendToDebateRoom(debateId, "participant_left", {
//         userId,
//         debateId,
//       });
//     }
//   }

//   async endDebate(debateId: string, status: "ENDED" | "CANCELLED" = "ENDED") {
//     const debate = await prisma.debate.findUnique({
//       where: { id: debateId },
//       include: {
//         participants: {
//           include: {
//             user: {
//               select: {
//                 id: true,
//                 username: true,
//                 email: true,
//                 level: true,
//                 rank: true,
//               },
//             },
//           },
//         },
//         messages: {
//           include: {
//             sender: {
//               select: { id: true, username: true },
//             },
//           },
//         },
//       },
//     });

//     if (!debate) {
//       throw new Error("Debate not found");
//     }

//     if (debate.status === "ENDED" || debate.status === "CANCELLED") {
//       return debate; // Already ended
//     }

//     let winnerId: string | null = null;

//     if (status === "ENDED" && debate.messages.length > 0) {
//       // Calculate winner based on comprehensive AI analysis
//       winnerId = await this.calculateWinnerWithAI(debateId, debate);
//     }

//     // Update debate status
//     const updatedDebate = await prisma.debate.update({
//       where: { id: debateId },
//       data: {
//         status,
//         ended_at: new Date(),
//         winner_id: winnerId,
//       },
//       include: {
//         participants: {
//           include: {
//             user: {
//               select: {
//                 id: true,
//                 username: true,
//                 email: true,
//                 level: true,
//                 rank: true,
//               },
//             },
//           },
//         },
//         winner: {
//           select: { id: true, username: true },
//         },
//       },
//     });

//     // Update participant records and award XP
//     if (status === "ENDED") {
//       for (const participant of updatedDebate.participants) {
//         const isWinner = participant.user_id === winnerId;
//         const outcome = isWinner ? "win" : winnerId ? "loss" : "draw";

//         // Calculate participant's average AI score
//         const userMessages = debate.messages.filter(
//           (msg) => msg.sender_id === participant.user_id
//         );
//         const avgScore =
//           userMessages.length > 0
//             ? userMessages.reduce((sum, msg) => sum + (msg.ai_score || 0), 0) /
//               userMessages.length
//             : 0;

//         // Update participant record
//         await prisma.debateParticipant.update({
//           where: { id: participant.id },
//           data: {
//             is_winner: isWinner,
//             score: Math.round(avgScore),
//             xp_earned: isWinner ? 100 : winnerId ? 50 : 75,
//           },
//         });

//         // Update user wins/losses directly here
//         await prisma.user.update({
//           where: { id: participant.user_id },
//           data: {
//             wins: isWinner ? { increment: 1 } : undefined,
//             losses: outcome === "loss" ? { increment: 1 } : undefined,
//           },
//         });

//         // Award XP through gamification service (without win/loss counting)
//         await gamificationService.submitScore({
//           user_id: participant.user_id,
//           debate_id: debateId,
//           text_score: Math.round(avgScore),
//           outcome,
//           bonus_xp: isWinner ? 50 : 0,
//         });

//         // Send email notifications
//         const user = await prisma.user.findUnique({
//           where: { id: participant.user_id },
//           select: { email: true, username: true },
//         });

//         if (user) {
//           if (isWinner) {
//             await emailService.sendDebateWinnerEmail(
//               user.email,
//               user.username,
//               debate.title,
//               debateId,
//               Math.round(avgScore)
//             );
//           } else if (outcome === "loss") {
//             await emailService.sendDebateLoserEmail(
//               user.email,
//               user.username,
//               debate.title,
//               debateId,
//               Math.round(avgScore)
//             );
//           }
//         }
//       }
//     }

//     // Generate AI summary
//     try {
//       await aiModerationService.generateDebateSummary(debateId);
//     } catch (error) {
//       console.error("Failed to generate AI summary:", error);
//     }

//     // Notify participants
//     const wsManager = getWebSocketManager();
//     if (wsManager) {
//       wsManager.sendToDebateRoom(debateId, "debate_ended", {
//         debateId,
//         status,
//         endedAt: new Date(),
//         winner: updatedDebate.winner,
//       });
//     }

//     return updatedDebate;
//   }

//   private async calculateWinnerWithAI(
//     debateId: string,
//     debate: any
//   ): Promise<string | null> {
//     if (debate.participants.length !== 2) return null;

//     const participant1 = debate.participants[0];
//     const participant2 = debate.participants[1];

//     // Get messages for each participant
//     const p1Messages = debate.messages.filter(
//       (msg: any) => msg.sender_id === participant1.user_id
//     );
//     const p2Messages = debate.messages.filter(
//       (msg: any) => msg.sender_id === participant2.user_id
//     );

//     if (p1Messages.length === 0 && p2Messages.length === 0) return null;

//     // Calculate comprehensive scores for each participant
//     const p1Score = await this.calculateParticipantScore(
//       participant1,
//       p1Messages,
//       debate
//     );
//     const p2Score = await this.calculateParticipantScore(
//       participant2,
//       p2Messages,
//       debate
//     );

//     console.log(
//       `Participant 1 (${participant1.user.username}) Score:`,
//       p1Score
//     );
//     console.log(
//       `Participant 2 (${participant2.user.username}) Score:`,
//       p2Score
//     );

//     // Determine winner (minimum 10 point difference to avoid ties)
//     const scoreDifference = Math.abs(p1Score - p2Score);
//     if (scoreDifference < 10) {
//       return null; // Too close to call - it's a tie
//     }

//     return p1Score > p2Score ? participant1.user_id : participant2.user_id;
//   }

//   private async calculateParticipantScore(
//     participant: any,
//     messages: any[],
//     debate: any
//   ): Promise<number> {
//     if (messages.length === 0) return 0;

//     let totalScore = 0;
//     let validMessages = 0;

//     // Analyze each message with AI
//     for (const message of messages) {
//       if (message.ai_score && message.ai_score > 0) {
//         totalScore += message.ai_score;
//         validMessages++;
//       } else {
//         // Re-analyze message if no AI score
//         try {
//           const analysis = await aiModerationService.analyzeText(
//             message.content,
//             {
//               debateId: debate.id,
//               userId: participant.user_id,
//               role: participant.role,
//               debateTopic: debate.topic,
//               debateTitle: debate.title,
//             }
//           );

//           // Update message with AI score
//           await prisma.debateMessage.update({
//             where: { id: message.id },
//             data: {
//               ai_score: analysis.score,
//               ai_feedback: analysis.feedback,
//               is_flagged: analysis.flagged,
//             },
//           });

//           totalScore += analysis.score;
//           validMessages++;
//         } catch (error) {
//           console.error("Failed to analyze message:", error);
//         }
//       }
//     }

//     if (validMessages === 0) return 0;

//     // Calculate average AI score
//     const averageAIScore = totalScore / validMessages;

//     // Apply engagement bonus (more messages = slight bonus, but capped)
//     const engagementBonus = Math.min(messages.length * 2, 15); // Max 15 bonus points

//     // Apply penalty for very short messages
//     const avgMessageLength =
//       messages.reduce((sum, msg) => sum + msg.content.length, 0) /
//       messages.length;
//     const lengthPenalty = avgMessageLength < 20 ? -10 : 0;

//     // Calculate final score
//     const finalScore = averageAIScore + engagementBonus + lengthPenalty;

//     return Math.max(0, Math.min(100, finalScore));
//   }

//   async addMessage(
//     debateId: string,
//     senderId: string,
//     content: string,
//     messageType = "ARGUMENT"
//   ) {
//     // Verify user is participant
//     const participant = await prisma.debateParticipant.findFirst({
//       where: {
//         debate_id: debateId,
//         user_id: senderId,
//       },
//     });

//     if (!participant) {
//       throw new Error("User is not a participant in this debate");
//     }

//     // Verify debate is live
//     const debate = await prisma.debate.findUnique({
//       where: { id: debateId },
//       select: { status: true, title: true, topic: true },
//     });

//     if (debate?.status !== "LIVE") {
//       throw new Error("Debate is not active");
//     }

//     // Create message
//     const message = await prisma.debateMessage.create({
//       data: {
//         debate_id: debateId,
//         sender_id: senderId,
//         content,
//         message_type: messageType as any,
//         role: participant.role,
//       },
//       include: {
//         sender: {
//           select: { id: true, username: true },
//         },
//       },
//     });

//     // Analyze message with AI immediately (async)
//     this.analyzeMessageWithAI(message, debate, participant.role).catch(
//       console.error
//     );

//     return message;
//   }

//   private async analyzeMessageWithAI(message: any, debate: any, role: string) {
//     try {
//       const analysis = await aiModerationService.analyzeText(message.content, {
//         debateId: debate.id || message.debate_id,
//         userId: message.sender_id,
//         role,
//         debateTopic: debate.topic,
//         debateTitle: debate.title,
//       });

//       // Update message with AI analysis
//       await prisma.debateMessage.update({
//         where: { id: message.id },
//         data: {
//           ai_score: analysis.score,
//           ai_feedback: analysis.feedback,
//           is_flagged: analysis.flagged,
//         },
//       });

//       // Send AI feedback via WebSocket
//       const wsManager = getWebSocketManager();
//       if (wsManager) {
//         wsManager.sendToDebateRoom(message.debate_id, "ai_analysis", {
//           messageId: message.id,
//           analysis,
//         });
//       }
//     } catch (error) {
//       console.error("Failed to analyze message with AI:", error);
//     }
//   }

//   async addGlobalMessage(debateId: string, senderId: string, content: string) {
//     // Verify debate exists
//     const debate = await prisma.debate.findUnique({
//       where: { id: debateId },
//     });

//     if (!debate) {
//       throw new Error("Debate not found");
//     }

//     // Create global chat message
//     const message = await prisma.globalChatMessage.create({
//       data: {
//         debate_id: debateId,
//         sender_id: senderId,
//         content,
//       },
//       include: {
//         sender: {
//           select: { id: true, username: true, level: true, rank: true },
//         },
//       },
//     });

//     return message;
//   }

//   async getGlobalMessages(debateId: string, limit = 50, offset = 0) {
//     const messages = await prisma.globalChatMessage.findMany({
//       where: { debate_id: debateId },
//       include: {
//         sender: {
//           select: { id: true, username: true, level: true, rank: true },
//         },
//       },
//       orderBy: { created_at: "desc" },
//       take: limit,
//       skip: offset,
//     });

//     return messages.reverse(); // Return in chronological order
//   }

//   async getDebateMessages(debateId: string, limit = 50, offset = 0) {
//     const messages = await prisma.debateMessage.findMany({
//       where: { debate_id: debateId },
//       include: {
//         sender: {
//           select: { id: true, username: true },
//         },
//       },
//       orderBy: { created_at: "asc" },
//       take: limit,
//       skip: offset,
//     });

//     return messages;
//   }

//   async getDebateResults(debateId: string) {
//     const debate = await prisma.debate.findUnique({
//       where: { id: debateId },
//       include: {
//         creator: {
//           select: { id: true, username: true },
//         },
//         winner: {
//           select: { id: true, username: true, level: true, rank: true },
//         },
//         participants: {
//           include: {
//             user: {
//               select: { id: true, username: true, level: true, rank: true },
//             },
//           },
//           orderBy: { score: "desc" },
//         },
//         messages: {
//           include: {
//             sender: {
//               select: { id: true, username: true },
//             },
//           },
//           orderBy: { created_at: "asc" },
//         },
//         _count: {
//           select: {
//             messages: true,
//             global_messages: true,
//           },
//         },
//       },
//     });

//     if (!debate) {
//       throw new Error("Debate not found");
//     }

//     // Calculate statistics
//     const totalMessages = debate.messages.length;
//     const averageMessageLength =
//       totalMessages > 0
//         ? debate.messages.reduce((sum, msg) => sum + msg.content.length, 0) /
//           totalMessages
//         : 0;

//     const participantStats = debate.participants.map((participant) => {
//       const userMessages = debate.messages.filter(
//         (msg) => msg.sender_id === participant.user_id
//       );
//       const avgAIScore =
//         userMessages.length > 0
//           ? userMessages.reduce((sum, msg) => sum + (msg.ai_score || 0), 0) /
//             userMessages.length
//           : 0;

//       return {
//         ...participant,
//         message_count: userMessages.length,
//         avg_ai_score: Math.round(avgAIScore),
//         total_words: userMessages.reduce(
//           (sum, msg) => sum + msg.content.split(" ").length,
//           0
//         ),
//       };
//     });

//     return {
//       ...debate,
//       statistics: {
//         total_messages: totalMessages,
//         average_message_length: Math.round(averageMessageLength),
//         total_viewers: debate._count.global_messages,
//         duration_actual:
//           debate.started_at && debate.ended_at
//             ? Math.round(
//                 (new Date(debate.ended_at).getTime() -
//                   new Date(debate.started_at).getTime()) /
//                   60000
//               )
//             : 0,
//       },
//       participant_stats: participantStats,
//     };
//   }

//   async updateDebateViews(debateId: string) {
//     await prisma.debate.update({
//       where: { id: debateId },
//       data: {
//         views_count: {
//           increment: 1,
//         },
//       },
//     });
//   }
// }

// export const debateService = new DebateService();
import prisma from "@/lib/database";
import { getWebSocketManager } from "@/lib/websocket";
import { emailService } from "@/services/email/email.service";
import { gamificationService } from "@/services/gamification/gamification.service";
import { aiModerationService } from "../ai/ai-moderation.service";
import { db } from "@/lib/db";

export interface CreateDebateData {
  title: string;
  topic: string;
  type: string;
  mode: "TEXT" | "AUDIO";
  duration_minutes?: number;
  visibility?: "PUBLIC" | "PRIVATE";
  tags?: string[];
  created_by: string;
}

export interface JoinDebateData {
  debate_id: string;
  user_id: string;
}

class DebateService {
  async createDebate(data: any) {
    return await db.debate.create({
      data,
    });
  }

  async getDebates(filters?: {
    status?: string;
    mode?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.mode) {
      where.mode = filters.mode;
    }
    if (filters?.type) {
      where.type = filters.type;
    }

    const debates = await prisma.debate.findMany({
      where,
      include: {
        creator: {
          select: { id: true, username: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, username: true, level: true, rank: true },
            },
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { created_at: "desc" },
      take: filters?.limit || 20,
      skip: filters?.offset || 0,
    });

    return debates.map((debate) => ({
      ...debate,
      participant_count: debate.participants.length,
      message_count: debate._count.messages,
      creator_username: debate.creator.username,
    }));
  }

  async getDebateById(id: string) {
    return await db.debate.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                level: true,
                rank: true,
                is_online: true,
                avatar_url: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            created_at: "asc",
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatar_url: true,
              },
            },
          },
        },
        winner: {
          select: {
            id: true,
            username: true,
            level: true,
            rank: true,
            avatar_url: true,
          },
        },
      },
    });
  }

  async joinDebate(debateId: string, userId: string) {
    const debate = await db.debate.findUnique({
      where: { id: debateId },
      include: {
        participants: true,
      },
    });

    if (!debate) {
      throw new Error("Debate not found");
    }

    if (debate.status !== "PENDING") {
      throw new Error("This debate is no longer accepting participants");
    }

    if (debate.participants.length >= 2) {
      throw new Error(
        "This debate already has the maximum number of participants"
      );
    }

    if (debate.participants.some((p) => p.user_id === userId)) {
      throw new Error("You are already a participant in this debate");
    }

    // Determine the role for the new participant
    const existingRoles = debate.participants.map((p) => p.role);
    const role = existingRoles.includes("AFFIRMATIVE")
      ? "NEGATIVE"
      : "AFFIRMATIVE";

    // Determine the position for the new participant
    const existingPositions = debate.participants.map((p) => p.position);
    const position = existingPositions.includes("FOR") ? "AGAINST" : "FOR";

    // Add the user as a participant
    await db.debateParticipant.create({
      data: {
        debate_id: debateId,
        user_id: userId,
        role,
        position,
        is_ready: false,
      },
    });

    // If we now have 2 participants, update the debate status to READY
    if (debate.participants.length + 1 === 2) {
      await db.debate.update({
        where: { id: debateId },
        data: { status: "READY" },
      });
    }

    return { success: true };
  }

  async beginDebate(debateId: string, userId: string) {
    const debate = await db.debate.findUnique({
      where: { id: debateId },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!debate) {
      throw new Error("Debate not found");
    }

    if (debate.status !== "READY") {
      throw new Error("This debate is not ready to begin");
    }

    // Check if the user is a participant
    const participant = debate.participants.find((p) => p.user_id === userId);
    if (!participant) {
      throw new Error("You are not a participant in this debate");
    }

    // Mark the participant as ready
    await db.debateParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        is_ready: true,
      },
    });

    // Check if all participants are ready
    const updatedDebate = await db.debate.findUnique({
      where: { id: debateId },
      include: {
        participants: true,
      },
    });

    if (updatedDebate?.participants.every((p) => p.is_ready)) {
      // Start the debate
      await db.debate.update({
        where: { id: debateId },
        data: {
          status: "LIVE",
          started_at: new Date(),
        },
      });

      return { message: "Debate has started!" };
    }

    return { message: "You are ready. Waiting for other participants." };
  }

  private scheduleDebateEnd(debateId: string) {
    // Get debate duration and schedule automatic ending
    prisma.debate
      .findUnique({
        where: { id: debateId },
        select: { duration_minutes: true },
      })
      .then((debate) => {
        if (debate) {
          setTimeout(() => {
            this.endDebate(debateId, "ENDED").catch(console.error);
          }, debate.duration_minutes * 60 * 1000);
        }
      })
      .catch(console.error);
  }

  async leaveDebate(debateId: string, userId: string) {
    const participant = await prisma.debateParticipant.findFirst({
      where: {
        debate_id: debateId,
        user_id: userId,
      },
    });

    if (!participant) {
      throw new Error("User is not a participant in this debate");
    }

    // Update participant with leave time
    await prisma.debateParticipant.update({
      where: { id: participant.id },
      data: { left_at: new Date() },
    });

    // If debate is live, end it
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
    });

    if (debate?.status === "LIVE") {
      await this.endDebate(debateId, "CANCELLED");
    }

    // Notify via WebSocket
    const wsManager = getWebSocketManager();
    if (wsManager) {
      wsManager.sendToDebateRoom(debateId, "participant_left", {
        userId,
        debateId,
      });
    }
  }

  async endDebate(debateId: string, userId: string) {
    const debate = await db.debate.findUnique({
      where: { id: debateId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        messages: true,
      },
    });

    if (!debate) {
      throw new Error("Debate not found");
    }

    if (debate.status !== "LIVE") {
      throw new Error("This debate is not live");
    }

    // Check if the user is a participant
    const participant = debate.participants.find((p) => p.user_id === userId);
    if (!participant) {
      throw new Error("You are not a participant in this debate");
    }

    // Determine the winner based on message count and quality
    let winnerId: string | null = null;

    if (debate.messages.length > 0) {
      // Group messages by participant
      const messagesByParticipant = debate.participants.map((p) => ({
        participantId: p.id,
        userId: p.user_id,
        messages: debate.messages.filter((m) => m.sender_id === p.user_id),
      }));

      // Simple algorithm: participant with more messages wins
      // In a real app, you'd use AI analysis for more sophisticated scoring
      const sortedParticipants = messagesByParticipant.sort(
        (a, b) => b.messages.length - a.messages.length
      );

      if (
        sortedParticipants.length > 0 &&
        sortedParticipants[0].messages.length > 0
      ) {
        winnerId = sortedParticipants[0].userId;
      }
    }

    // Update the debate status
    const updatedDebate = await db.debate.update({
      where: { id: debateId },
      data: {
        status: "ENDED",
        ended_at: new Date(),
        winner_id: winnerId,
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Update user stats and XP
    if (winnerId) {
      // IMPORTANT: Only increment the win count ONCE
      await gamificationService.recordDebateResult({
        debateId,
        winnerId,
        loserId: debate.participants.find((p) => p.user_id !== winnerId)
          ?.user_id,
      });

      // Send emails to winner and loser
      const winner = updatedDebate.participants.find(
        (p) => p.user_id === winnerId
      );
      const loser = updatedDebate.participants.find(
        (p) => p.user_id !== winnerId
      );

      if (winner && loser) {
        try {
          // Send winner email
          await emailService.sendDebateWinnerEmail({
            to: winner.user.email,
            username: winner.user.username,
            opponentName: loser.user.username,
            topic: debate.topic,
            debateId: debate.id,
          });

          // Send loser email
          await emailService.sendDebateLoserEmail({
            to: loser.user.email,
            username: loser.user.username,
            opponentName: winner.user.username,
            topic: debate.topic,
            debateId: debate.id,
          });
        } catch (error) {
          console.error("Failed to send debate result emails:", error);
          // Continue even if emails fail
        }
      }
    }

    return { message: "Debate has ended" };
  }

  async exitDebate(debateId: string, userId: string) {
    const debate = await db.debate.findUnique({
      where: { id: debateId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!debate) {
      throw new Error("Debate not found");
    }

    if (
      debate.status !== "LIVE" &&
      debate.status !== "READY" &&
      debate.status !== "PENDING"
    ) {
      throw new Error("This debate cannot be exited");
    }

    // Check if the user is a participant
    const participant = debate.participants.find((p) => p.user_id === userId);
    if (!participant) {
      throw new Error("You are not a participant in this debate");
    }

    // If the debate is live, the other participant wins
    if (debate.status === "LIVE") {
      const winner = debate.participants.find((p) => p.user_id !== userId);

      if (winner) {
        // Update the debate status
        const updatedDebate = await db.debate.update({
          where: { id: debateId },
          data: {
            status: "ENDED",
            ended_at: new Date(),
            winner_id: winner.user_id,
          },
        });

        // Update user stats and XP
        await gamificationService.recordDebateResult({
          debateId,
          winnerId: winner.user_id,
          loserId: userId,
        });

        // Send emails
        const loser = participant;
        try {
          // Send winner email
          await emailService.sendDebateWinnerEmail({
            to: winner.user.email,
            username: winner.user.username,
            opponentName: loser.user.username,
            topic: debate.topic,
            debateId: debate.id,
          });

          // Send loser email
          await emailService.sendDebateLoserEmail({
            to: loser.user.email,
            username: loser.user.username,
            opponentName: winner.user.username,
            topic: debate.topic,
            debateId: debate.id,
          });
        } catch (error) {
          console.error("Failed to send debate result emails:", error);
          // Continue even if emails fail
        }
      } else {
        // If there's no other participant, just cancel the debate
        await db.debate.update({
          where: { id: debateId },
          data: {
            status: "CANCELLED",
            ended_at: new Date(),
          },
        });
      }
    } else {
      // If the debate is not live, just cancel it
      await db.debate.update({
        where: { id: debateId },
        data: {
          status: "CANCELLED",
          ended_at: new Date(),
        },
      });
    }

    return { message: "You have exited the debate" };
  }

  async getDebateResults(debateId: string) {
    const debate = await db.debate.findUnique({
      where: { id: debateId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar_url: true,
                level: true,
                rank: true,
              },
            },
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatar_url: true,
              },
            },
            ai_analysis: true,
          },
        },
        winner: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            level: true,
            rank: true,
          },
        },
      },
    });

    if (!debate) {
      throw new Error("Debate not found");
    }

    if (debate.status !== "ENDED" && debate.status !== "CANCELLED") {
      throw new Error("This debate has not ended yet");
    }

    // Calculate statistics for each participant
    const participantStats = debate.participants.map((participant) => {
      const participantMessages = debate.messages.filter(
        (m) => m.sender_id === participant.user_id
      );

      const totalScore = participantMessages.reduce(
        (sum, message) => sum + (message.ai_analysis?.score || 0),
        0
      );

      const avgScore =
        participantMessages.length > 0
          ? Math.round(totalScore / participantMessages.length)
          : 0;

      // Extract strengths and areas to improve from AI analysis
      const strengths = new Set<string>();
      const areasToImprove = new Set<string>();

      participantMessages.forEach((message) => {
        if (message.ai_analysis) {
          message.ai_analysis.strengths?.forEach((s) => strengths.add(s));
          message.ai_analysis.areas_to_improve?.forEach((a) =>
            areasToImprove.add(a)
          );
        }
      });

      return {
        participant: {
          id: participant.id,
          user_id: participant.user_id,
          role: participant.role,
          position: participant.position,
          user: participant.user,
        },
        stats: {
          message_count: participantMessages.length,
          avg_score: avgScore,
          total_score: totalScore,
          is_winner: debate.winner_id === participant.user_id,
          strengths: Array.from(strengths),
          areas_to_improve: Array.from(areasToImprove),
        },
      };
    });

    // Calculate overall debate statistics
    const debateStats = {
      total_messages: debate.messages.length,
      duration_minutes:
        debate.ended_at && debate.started_at
          ? Math.round(
              (new Date(debate.ended_at).getTime() -
                new Date(debate.started_at).getTime()) /
                60000
            )
          : debate.duration_minutes,
      avg_message_score:
        debate.messages.length > 0
          ? Math.round(
              debate.messages.reduce(
                (sum, m) => sum + (m.ai_analysis?.score || 0),
                0
              ) / debate.messages.length
            )
          : 0,
    };

    return {
      debate: {
        id: debate.id,
        title: debate.title,
        topic: debate.topic,
        mode: debate.mode,
        status: debate.status,
        created_at: debate.created_at,
        started_at: debate.started_at,
        ended_at: debate.ended_at,
        winner: debate.winner,
      },
      participants: participantStats,
      stats: debateStats,
    };
  }

  async updateDebateViews(debateId: string) {
    await prisma.debate.update({
      where: { id: debateId },
      data: {
        views_count: {
          increment: 1,
        },
      },
    });
  }

  async addMessage(
    debateId: string,
    senderId: string,
    content: string,
    messageType = "ARGUMENT"
  ) {
    // Verify user is participant
    const participant = await prisma.debateParticipant.findFirst({
      where: {
        debate_id: debateId,
        user_id: senderId,
      },
    });

    if (!participant) {
      throw new Error("User is not a participant in this debate");
    }

    // Verify debate is live
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      select: { status: true, title: true, topic: true },
    });

    if (debate?.status !== "LIVE") {
      throw new Error("Debate is not active");
    }

    // Create message
    const message = await prisma.debateMessage.create({
      data: {
        debate_id: debateId,
        sender_id: senderId,
        content,
        message_type: messageType as any,
        role: participant.role,
      },
      include: {
        sender: {
          select: { id: true, username: true },
        },
      },
    });

    // Analyze message with AI immediately (async)
    this.analyzeMessageWithAI(message, debate, participant.role).catch(
      console.error
    );

    return message;
  }

  private async analyzeMessageWithAI(message: any, debate: any, role: string) {
    try {
      const analysis = await aiModerationService.analyzeText(message.content, {
        debateId: debate.id || message.debate_id,
        userId: message.sender_id,
        role,
        debateTopic: debate.topic,
        debateTitle: debate.title,
      });

      // Update message with AI analysis
      await prisma.debateMessage.update({
        where: { id: message.id },
        data: {
          ai_score: analysis.score,
          ai_feedback: analysis.feedback,
          is_flagged: analysis.flagged,
        },
      });

      // Send AI feedback via WebSocket
      const wsManager = getWebSocketManager();
      if (wsManager) {
        wsManager.sendToDebateRoom(message.debate_id, "ai_analysis", {
          messageId: message.id,
          analysis,
        });
      }
    } catch (error) {
      console.error("Failed to analyze message with AI:", error);
    }
  }

  async addGlobalMessage(debateId: string, senderId: string, content: string) {
    // Verify debate exists
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
    });

    if (!debate) {
      throw new Error("Debate not found");
    }

    // Create global chat message
    const message = await prisma.globalChatMessage.create({
      data: {
        debate_id: debateId,
        sender_id: senderId,
        content,
      },
      include: {
        sender: {
          select: { id: true, username: true, level: true, rank: true },
        },
      },
    });

    return message;
  }

  async getGlobalMessages(debateId: string, limit = 50, offset = 0) {
    const messages = await prisma.globalChatMessage.findMany({
      where: { debate_id: debateId },
      include: {
        sender: {
          select: { id: true, username: true, level: true, rank: true },
        },
      },
      orderBy: { created_at: "desc" },
      take: limit,
      skip: offset,
    });

    return messages.reverse(); // Return in chronological order
  }

  async getDebateMessages(debateId: string, limit = 50, offset = 0) {
    const messages = await prisma.debateMessage.findMany({
      where: { debate_id: debateId },
      include: {
        sender: {
          select: { id: true, username: true },
        },
      },
      orderBy: { created_at: "asc" },
      take: limit,
      skip: offset,
    });

    return messages;
  }
}

export const debateService = new DebateService();
