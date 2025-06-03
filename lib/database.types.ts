export interface User {
  id: string
  username: string
  email: string
  password_hash: string
  full_name?: string
  bio?: string
  avatar_url?: string
  account_type: "USER" | "ADMIN"
  is_verified: boolean
  is_online: boolean
  level: number
  rank: string
  elo_rating: number
  xp: number
  total_debates: number
  wins: number
  losses: number
  created_at: Date
  updated_at: Date
  last_active_at: Date
}

export interface Debate {
  id: string
  title: string
  topic: string
  type: string
  mode: "text" | "audio"
  chat_enabled: boolean
  visibility: "public" | "private"
  duration_minutes: number
  ai_moderation: boolean
  created_by: string
  status: "pending" | "live" | "ended"
  created_at: Date
  started_at?: Date
  ended_at?: Date
  ai_summary?: string
  winner_id?: string
  xp_reward: number
  tags: string[]
  language: string
  views_count: number
}

export interface DebateParticipant {
  id: string
  debate_id: string
  user_id: string
  role: "affirmative" | "negative" | "moderator"
  is_winner: boolean
  joined_at: Date
  position: string
  score: number
  xp_earned: number
}

export interface DebateMessage {
  id: string
  debate_id: string
  sender_id: string
  content: string
  message_type: "argument" | "rebuttal" | "system"
  role: "affirmative" | "negative"
  is_flagged: boolean
  created_at: Date
  ai_score?: number
  ai_feedback?: string
}

export interface AIFeedback {
  id: string
  debate_id: string
  user_id: string
  feedback: string
  areas_to_improve: Record<string, any>
  strengths: Record<string, any>
  ai_score: number
  created_at: Date
}
