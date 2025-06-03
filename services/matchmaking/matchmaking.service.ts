import prisma from "@/lib/database"
import redis, { REDIS_KEYS } from "@/lib/redis"
import { debateService } from "../debate/debate.service"

export interface MatchmakingRequest {
  user_id: string
  debate_type: string
  mode: "TEXT" | "AUDIO"
  visibility: "PUBLIC" | "PRIVATE"
  duration_minutes: number
}

export class MatchmakingService {
  async joinQueue(request: MatchmakingRequest) {
    // Check if user is already in queue
    const existingEntry = await prisma.matchmakingQueue.findFirst({
      where: { user_id: request.user_id },
    })

    if (existingEntry) {
      throw new Error("User is already in matchmaking queue")
    }

    // Add to database queue
    const queueEntry = await prisma.matchmakingQueue.create({
      data: {
        user_id: request.user_id,
        debate_type: request.debate_type,
        mode: request.mode,
        visibility: request.visibility,
        duration_minutes: request.duration_minutes,
        chat_enabled: true,
        ai_moderation: true,
      },
    })

    // Add to Redis queue for fast matching
    const queueKey = REDIS_KEYS.MATCHMAKING_QUEUE(request.mode)
    await redis.zadd(
      queueKey,
      Date.now(),
      JSON.stringify({
        id: queueEntry.id,
        user_id: request.user_id,
        debate_type: request.debate_type,
        mode: request.mode,
        elo_rating: await this.getUserEloRating(request.user_id),
        enqueued_at: queueEntry.enqueued_at,
      }),
    )

    // Try to find a match immediately
    const match = await this.findMatch(request.user_id, request.mode)

    if (match) {
      return match
    }

    return { status: "waiting", queuePosition: await this.getQueuePosition(request.user_id, request.mode) }
  }

  async leaveQueue(userId: string) {
    // Remove from database
    await prisma.matchmakingQueue.deleteMany({
      where: { user_id: userId },
    })

    // Remove from Redis queues
    const textQueue = REDIS_KEYS.MATCHMAKING_QUEUE("TEXT")
    const audioQueue = REDIS_KEYS.MATCHMAKING_QUEUE("AUDIO")

    const textMembers = await redis.zrange(textQueue, 0, -1)
    const audioMembers = await redis.zrange(audioQueue, 0, -1)

    for (const member of textMembers) {
      const data = JSON.parse(member)
      if (data.user_id === userId) {
        await redis.zrem(textQueue, member)
      }
    }

    for (const member of audioMembers) {
      const data = JSON.parse(member)
      if (data.user_id === userId) {
        await redis.zrem(audioQueue, member)
      }
    }

    return { status: "left" }
  }

  async getQueueStatus(userId: string) {
    const queueEntry = await prisma.matchmakingQueue.findFirst({
      where: { user_id: userId },
    })

    if (!queueEntry) {
      return { status: "not_in_queue" }
    }

    const position = await this.getQueuePosition(userId, queueEntry.mode)
    const waitTime = Date.now() - queueEntry.enqueued_at.getTime()

    return {
      status: "waiting",
      position,
      waitTime,
      mode: queueEntry.mode,
      debate_type: queueEntry.debate_type,
    }
  }

  private async findMatch(userId: string, mode: string) {
    const queueKey = REDIS_KEYS.MATCHMAKING_QUEUE(mode)
    const userElo = await this.getUserEloRating(userId)

    // Get all users in queue
    const queueMembers = await redis.zrange(queueKey, 0, -1)

    if (queueMembers.length < 2) {
      return null
    }

    // Find suitable opponent
    let bestMatch = null
    let bestEloDiff = Number.POSITIVE_INFINITY

    for (const member of queueMembers) {
      const data = JSON.parse(member)

      if (data.user_id === userId) continue

      const eloDiff = Math.abs(userElo - data.elo_rating)

      // Prefer matches within 200 ELO points
      if (eloDiff < bestEloDiff && eloDiff <= 200) {
        bestMatch = data
        bestEloDiff = eloDiff
      }
    }

    // If no good match within ELO range, take any available opponent after 30 seconds
    if (!bestMatch) {
      const userQueueTime = await this.getUserQueueTime(userId)
      if (userQueueTime > 30000) {
        // 30 seconds
        for (const member of queueMembers) {
          const data = JSON.parse(member)
          if (data.user_id !== userId) {
            bestMatch = data
            break
          }
        }
      }
    }

    if (bestMatch) {
      return await this.createMatchedDebate(userId, bestMatch.user_id, mode, bestMatch.debate_type)
    }

    return null
  }

  private async createMatchedDebate(user1Id: string, user2Id: string, mode: string, debateType: string) {
    // Remove both users from queue
    await this.leaveQueue(user1Id)
    await this.leaveQueue(user2Id)

    // Create debate
    const debate = await debateService.createDebate({
      title: `Quick Match: ${debateType}`,
      topic: `Randomly matched debate on ${debateType}`,
      type: debateType,
      mode: mode as "TEXT" | "AUDIO",
      duration_minutes: 30,
      visibility: "PUBLIC",
      tags: ["quick-match", debateType.toLowerCase()],
      created_by: user1Id,
    })

    // Add second participant
    await debateService.joinDebate({
      debate_id: debate.id,
      user_id: user2Id,
    })

    return {
      status: "matched",
      debate_id: debate.id,
      opponent_id: user2Id,
    }
  }

  private async getUserEloRating(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { elo_rating: true },
    })
    return user?.elo_rating || 1000
  }

  private async getQueuePosition(userId: string, mode: string): Promise<number> {
    const queueKey = REDIS_KEYS.MATCHMAKING_QUEUE(mode)
    const members = await redis.zrange(queueKey, 0, -1)

    for (let i = 0; i < members.length; i++) {
      const data = JSON.parse(members[i])
      if (data.user_id === userId) {
        return i + 1
      }
    }

    return 0
  }

  private async getUserQueueTime(userId: string): Promise<number> {
    const queueEntry = await prisma.matchmakingQueue.findFirst({
      where: { user_id: userId },
    })

    if (!queueEntry) return 0

    return Date.now() - queueEntry.enqueued_at.getTime()
  }

  // Background job to process matches
  async processMatchmaking() {
    const modes = ["TEXT", "AUDIO"]

    for (const mode of modes) {
      const queueKey = REDIS_KEYS.MATCHMAKING_QUEUE(mode)
      const members = await redis.zrange(queueKey, 0, -1)

      if (members.length >= 2) {
        // Try to match users
        for (let i = 0; i < members.length - 1; i++) {
          const user1 = JSON.parse(members[i])
          const match = await this.findMatch(user1.user_id, mode)

          if (match) {
            console.log(`Created match for users ${user1.user_id} and ${match.opponent_id}`)
          }
        }
      }
    }
  }
}

export const matchmakingService = new MatchmakingService()

// Run matchmaking process every 5 seconds
setInterval(() => {
  matchmakingService.processMatchmaking().catch(console.error)
}, 5000)
