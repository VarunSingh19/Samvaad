import type { User, Debate, DebateMessage, DebateParticipant } from "./database.types"

// Mock database - in production, use PostgreSQL with Prisma or similar
class MockDatabase {
  private users: Map<string, User> = new Map()
  private debates: Map<string, Debate> = new Map()
  private debateMessages: Map<string, DebateMessage[]> = new Map()
  private debateParticipants: Map<string, DebateParticipant[]> = new Map()

  constructor() {
    // Initialize with some mock data
    this.initializeMockData()
  }

  private initializeMockData() {
    // Add admin user
    const adminUser: User = {
      id: "admin-1",
      username: "admin",
      email: "admin@samvaad.com",
      password_hash: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G", // 'admin123'
      full_name: "System Administrator",
      account_type: "ADMIN",
      is_verified: true,
      is_online: false,
      level: 100,
      rank: "Master",
      elo_rating: 2000,
      xp: 50000,
      total_debates: 0,
      wins: 0,
      losses: 0,
      created_at: new Date(),
      updated_at: new Date(),
      last_active_at: new Date(),
    }
    this.users.set(adminUser.id, adminUser)

    // Add sample user
    const sampleUser: User = {
      id: "user-1",
      username: "debater1",
      email: "user@example.com",
      password_hash: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G", // 'password123'
      full_name: "John Debater",
      account_type: "USER",
      is_verified: true,
      is_online: false,
      level: 5,
      rank: "Novice",
      elo_rating: 1200,
      xp: 1500,
      total_debates: 12,
      wins: 7,
      losses: 5,
      created_at: new Date(),
      updated_at: new Date(),
      last_active_at: new Date(),
    }
    this.users.set(sampleUser.id, sampleUser)
  }

  // User methods
  async createUser(userData: Omit<User, "id" | "created_at" | "updated_at">): Promise<User> {
    const id = `user-${Date.now()}`
    const user: User = {
      ...userData,
      id,
      created_at: new Date(),
      updated_at: new Date(),
    }
    this.users.set(id, user)
    return user
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user
    }
    return null
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values())
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id)
    if (!user) return null

    const updatedUser = { ...user, ...updates, updated_at: new Date() }
    this.users.set(id, updatedUser)
    return updatedUser
  }

  // Debate methods
  async createDebate(debateData: Omit<Debate, "id" | "created_at" | "updated_at">): Promise<Debate> {
    const id = `debate-${Date.now()}`
    const debate: Debate = {
      ...debateData,
      id,
      created_at: new Date(),
      views_count: 0,
    }
    this.debates.set(id, debate)
    this.debateMessages.set(id, [])
    this.debateParticipants.set(id, [])
    return debate
  }

  async getDebateById(id: string): Promise<Debate | null> {
    return this.debates.get(id) || null
  }

  async getAllDebates(): Promise<Debate[]> {
    return Array.from(this.debates.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }

  async updateDebate(id: string, updates: Partial<Debate>): Promise<Debate | null> {
    const debate = this.debates.get(id)
    if (!debate) return null

    const updatedDebate = { ...debate, ...updates }
    this.debates.set(id, updatedDebate)
    return updatedDebate
  }

  // Debate message methods
  async addDebateMessage(message: Omit<DebateMessage, "id" | "created_at">): Promise<DebateMessage> {
    const id = `msg-${Date.now()}`
    const newMessage: DebateMessage = {
      ...message,
      id,
      created_at: new Date(),
    }

    const messages = this.debateMessages.get(message.debate_id) || []
    messages.push(newMessage)
    this.debateMessages.set(message.debate_id, messages)

    return newMessage
  }

  async getDebateMessages(debateId: string): Promise<DebateMessage[]> {
    return this.debateMessages.get(debateId) || []
  }

  // Debate participant methods
  async addDebateParticipant(participant: Omit<DebateParticipant, "id">): Promise<DebateParticipant> {
    const id = `participant-${Date.now()}`
    const newParticipant: DebateParticipant = {
      ...participant,
      id,
    }

    const participants = this.debateParticipants.get(participant.debate_id) || []
    participants.push(newParticipant)
    this.debateParticipants.set(participant.debate_id, participants)

    return newParticipant
  }

  async getDebateParticipants(debateId: string): Promise<DebateParticipant[]> {
    return this.debateParticipants.get(debateId) || []
  }

  async getLeaderboard(limit = 10): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit)
  }
}

export const db = new MockDatabase()
