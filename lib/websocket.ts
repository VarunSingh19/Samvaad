import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import prisma from "./database";
import redis, { REDIS_KEYS } from "./redis";
import { aiModerationService } from "../services/ai/ai-moderation.service";

export interface SocketUser {
  id: string;
  username: string;
  socketId: string;
}

export class WebSocketManager {
  private io: SocketIOServer;
  private connectedUsers: Map<string, SocketUser> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error("Authentication error"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, username: true, is_online: true },
        });

        if (!user) {
          return next(new Error("User not found"));
        }

        socket.data.user = user;
        next();
      } catch (error) {
        next(new Error("Authentication error"));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket) => {
      const user = socket.data.user;
      console.log(`User ${user.username} connected`);

      // Store user connection
      this.connectedUsers.set(user.id, {
        id: user.id,
        username: user.username,
        socketId: socket.id,
      });

      // Update user online status
      this.updateUserOnlineStatus(user.id, true, socket.id);

      // Join user to their personal room
      socket.join(`user:${user.id}`);

      // Handle debate room joining
      socket.on("join_debate", async (debateId: string) => {
        try {
          const participant = await prisma.debateParticipant.findFirst({
            where: {
              debate_id: debateId,
              user_id: user.id,
            },
          });

          if (participant) {
            socket.join(`debate:${debateId}`);
            socket.emit("joined_debate", { debateId });

            // Notify others in the room
            socket.to(`debate:${debateId}`).emit("user_joined", {
              userId: user.id,
              username: user.username,
            });
          }
        } catch (error) {
          socket.emit("error", { message: "Failed to join debate room" });
        }
      });

      // Handle leaving debate room
      socket.on("leave_debate", (debateId: string) => {
        socket.leave(`debate:${debateId}`);
        socket.to(`debate:${debateId}`).emit("user_left", {
          userId: user.id,
          username: user.username,
        });
      });

      // Handle new debate messages
      socket.on(
        "new_message",
        async (data: {
          debateId: string;
          content: string;
          messageType: string;
        }) => {
          try {
            // Verify user is participant
            const participant = await prisma.debateParticipant.findFirst({
              where: {
                debate_id: data.debateId,
                user_id: user.id,
              },
            });

            if (!participant) {
              socket.emit("error", {
                message: "Not authorized to send messages",
              });
              return;
            }

            // Create message in database
            const message = await prisma.debateMessage.create({
              data: {
                debate_id: data.debateId,
                sender_id: user.id,
                content: data.content,
                message_type: data.messageType as any,
                role: participant.role,
              },
              include: {
                sender: {
                  select: { id: true, username: true },
                },
              },
            });

            // Broadcast to debate room
            this.io.to(`debate:${data.debateId}`).emit("message_received", {
              id: message.id,
              content: message.content,
              sender: message.sender,
              role: message.role,
              created_at: message.created_at,
              message_type: message.message_type,
            });

            // TODO: Send to AI moderation service
            this.processMessageWithAI(message);
          } catch (error) {
            socket.emit("error", { message: "Failed to send message" });
          }
        }
      );

      // Handle typing indicators
      socket.on("typing_start", (debateId: string) => {
        socket.to(`debate:${debateId}`).emit("user_typing", {
          userId: user.id,
          username: user.username,
        });
      });

      socket.on("typing_stop", (debateId: string) => {
        socket.to(`debate:${debateId}`).emit("user_stopped_typing", {
          userId: user.id,
        });
      });

      // Handle WebRTC signaling for audio debates
      socket.on(
        "webrtc_offer",
        (data: {
          debateId: string;
          targetUserId: string;
          offer: RTCSessionDescriptionInit;
        }) => {
          const targetUser = this.connectedUsers.get(data.targetUserId);
          if (targetUser) {
            this.io.to(targetUser.socketId).emit("webrtc_offer", {
              fromUserId: user.id,
              fromUsername: user.username,
              debateId: data.debateId,
              offer: data.offer,
            });
          }
        }
      );

      socket.on(
        "webrtc_answer",
        (data: {
          debateId: string;
          targetUserId: string;
          answer: RTCSessionDescriptionInit;
        }) => {
          const targetUser = this.connectedUsers.get(data.targetUserId);
          if (targetUser) {
            this.io.to(targetUser.socketId).emit("webrtc_answer", {
              fromUserId: user.id,
              answer: data.answer,
            });
          }
        }
      );

      socket.on(
        "webrtc_ice_candidate",
        (data: {
          debateId: string;
          targetUserId: string;
          candidate: RTCIceCandidateInit;
        }) => {
          const targetUser = this.connectedUsers.get(data.targetUserId);
          if (targetUser) {
            this.io.to(targetUser.socketId).emit("webrtc_ice_candidate", {
              fromUserId: user.id,
              candidate: data.candidate,
            });
          }
        }
      );

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log(`User ${user.username} disconnected`);
        this.connectedUsers.delete(user.id);
        this.updateUserOnlineStatus(user.id, false);
      });
    });
  }

  private async updateUserOnlineStatus(
    userId: string,
    isOnline: boolean,
    socketId?: string
  ) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          is_online: isOnline,
          socket_id: socketId || null,
          last_active_at: new Date(),
        },
      });

      // Update Redis cache
      if (isOnline && socketId) {
        await redis.setex(REDIS_KEYS.USER_ONLINE(userId), 3600, socketId);
      } else {
        await redis.del(REDIS_KEYS.USER_ONLINE(userId));
      }
    } catch (error) {
      console.error("Failed to update user online status:", error);
    }
  }

  private async processMessageWithAI(message: any) {
    try {
      // Analyze message with AI
      const analysis = await aiModerationService.analyzeText(message.content, {
        debateId: message.debate_id,
        userId: message.sender_id,
      });

      // Moderate content
      const moderation = await aiModerationService.moderateContent(
        message.content
      );

      // Update message with AI analysis
      await prisma.debateMessage.update({
        where: { id: message.id },
        data: {
          ai_score: analysis.score,
          ai_feedback: analysis.feedback,
          is_flagged: !moderation.allowed,
        },
      });

      // Send AI feedback to the debate room
      this.sendToDebateRoom(message.debate_id, "ai_analysis", {
        messageId: message.id,
        analysis,
        moderation,
      });

      // If content is severely inappropriate, take action
      if (moderation.severity === "high") {
        this.sendToDebateRoom(message.debate_id, "message_flagged", {
          messageId: message.id,
          reason: moderation.reason,
        });
      }
    } catch (error) {
      console.error("AI processing failed:", error);
    }
  }

  public sendToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public sendToDebateRoom(debateId: string, event: string, data: any) {
    this.io.to(`debate:${debateId}`).emit(event, data);
  }

  public getConnectedUsers(): SocketUser[] {
    return Array.from(this.connectedUsers.values());
  }
}

let wsManager: WebSocketManager | null = null;

export const initializeWebSocket = (server: HTTPServer): WebSocketManager => {
  if (!wsManager) {
    wsManager = new WebSocketManager(server);
  }
  return wsManager;
};

export const getWebSocketManager = (): WebSocketManager | null => {
  return wsManager;
};
