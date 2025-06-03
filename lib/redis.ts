import { Redis } from "ioredis"

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number.parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
})

export default redis

// Redis keys
export const REDIS_KEYS = {
  USER_SESSION: (userId: string) => `session:${userId}`,
  MATCHMAKING_QUEUE: (mode: string) => `queue:${mode}`,
  DEBATE_ROOM: (debateId: string) => `room:${debateId}`,
  USER_ONLINE: (userId: string) => `online:${userId}`,
  LEADERBOARD: "leaderboard:global",
  RATE_LIMIT: (ip: string) => `rate_limit:${ip}`,
}
