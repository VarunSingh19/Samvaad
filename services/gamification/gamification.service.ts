import prisma from "@/lib/database";
import redis, { REDIS_KEYS } from "@/lib/redis";

export interface ScoreSubmission {
  user_id: string;
  debate_id: string;
  text_score?: number;
  audio_score?: number;
  outcome: "win" | "loss" | "draw";
  bonus_xp?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon_url?: string;
  condition: (user: any, stats: any) => boolean;
  xp_reward: number;
}

export class GamificationService {
  private achievements: Achievement[] = [
    {
      id: "first_debate",
      title: "First Steps",
      description: "Complete your first debate",
      xp_reward: 100,
      condition: (user, stats) => stats.total_debates >= 1,
    },
    {
      id: "skilled_speaker",
      title: "Skilled Speaker",
      description: "Achieve an average score of 80+ in 5 debates",
      xp_reward: 500,
      condition: (user, stats) =>
        stats.total_debates >= 5 && stats.average_score >= 80,
    },
    {
      id: "unbeatable",
      title: "Unbeatable",
      description: "Win 3 consecutive debates",
      xp_reward: 300,
      condition: (user, stats) => stats.consecutive_wins >= 3,
    },
    {
      id: "ai_favorite",
      title: "AI Favorite",
      description: "Receive a perfect AI score of 100",
      xp_reward: 200,
      condition: (user, stats) => stats.max_ai_score >= 100,
    },
    {
      id: "debate_master",
      title: "Debate Master",
      description: "Complete 50 debates",
      xp_reward: 1000,
      condition: (user, stats) => stats.total_debates >= 50,
    },
    {
      id: "respectful_debater",
      title: "Respectful Debater",
      description: "Complete 10 debates without any flags",
      xp_reward: 250,
      condition: (user, stats) =>
        stats.total_debates >= 10 && stats.total_flags === 0,
    },
  ];

  async submitScore(submission: ScoreSubmission) {
    const { user_id, debate_id, text_score, audio_score, outcome, bonus_xp } =
      submission;

    // Calculate XP earned
    let xp_earned = 0;

    // Base participation XP
    xp_earned += 25;

    // Performance XP
    if (text_score) {
      xp_earned += Math.floor(text_score / 2); // 0-50 XP based on score
    }
    if (audio_score) {
      xp_earned += Math.floor(audio_score / 2); // 0-50 XP based on score
    }

    // Outcome bonus
    if (outcome === "win") {
      xp_earned += 50;
    } else if (outcome === "draw") {
      xp_earned += 25;
    }

    // Additional bonus XP
    if (bonus_xp) {
      xp_earned += bonus_xp;
    }

    // Update user stats
    const user = await prisma.user.update({
      where: { id: user_id },
      data: {
        xp: { increment: xp_earned },
        total_debates: { increment: 1 },
        // Remove these lines - they're causing duplicate counting:
        // wins: outcome === "win" ? { increment: 1 } : undefined,
        // losses: outcome === "loss" ? { increment: 1 } : undefined,
      },
    });

    // Calculate new level
    const newLevel = this.calculateLevel(user.xp);
    const newRank = this.calculateRank(user.xp, user.wins, user.total_debates);

    // Update level and rank if changed
    if (newLevel !== user.level || newRank !== user.rank) {
      await prisma.user.update({
        where: { id: user_id },
        data: {
          level: newLevel,
          rank: newRank,
        },
      });
    }

    // Update participant record
    await prisma.debateParticipant.updateMany({
      where: {
        debate_id,
        user_id,
      },
      data: {
        score: (text_score || 0) + (audio_score || 0),
        xp_earned,
        is_winner: outcome === "win",
      },
    });

    // Check for new achievements
    const newAchievements = await this.checkAchievements(user_id);

    // Update leaderboard
    await this.updateLeaderboard(user_id, user.xp + xp_earned);

    return {
      xp_earned,
      new_level: newLevel,
      new_rank: newRank,
      achievements: newAchievements,
      total_xp: user.xp + xp_earned,
    };
  }

  async getLeaderboard(
    type: "global" | "weekly" | "category" = "global",
    category?: string,
    limit = 50
  ) {
    let cacheKey = REDIS_KEYS.LEADERBOARD;

    if (type === "weekly") {
      cacheKey = `${REDIS_KEYS.LEADERBOARD}:weekly`;
    } else if (type === "category" && category) {
      cacheKey = `${REDIS_KEYS.LEADERBOARD}:category:${category}`;
    }

    // Try to get from cache first
    const cached = await redis.zrevrange(cacheKey, 0, limit - 1, "WITHSCORES");

    if (cached.length > 0) {
      const leaderboard = [];
      for (let i = 0; i < cached.length; i += 2) {
        const userId = cached[i];
        const score = Number.parseInt(cached[i + 1]);

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            username: true,
            avatar_url: true,
            level: true,
            rank: true,
            xp: true,
          },
        });

        if (user) {
          leaderboard.push({
            rank: Math.floor(i / 2) + 1,
            user,
            score,
          });
        }
      }

      return leaderboard;
    }

    // If not in cache, get from database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        avatar_url: true,
        level: true,
        rank: true,
        xp: true,
      },
      orderBy: { xp: "desc" },
      take: limit,
    });

    // Cache the results
    const pipeline = redis.pipeline();
    users.forEach((user) => {
      pipeline.zadd(cacheKey, user.xp, user.id);
    });
    pipeline.expire(cacheKey, 300); // 5 minutes cache
    await pipeline.exec();

    return users.map((user, index) => ({
      rank: index + 1,
      user,
      score: user.xp,
    }));
  }

  async getUserStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        level: true,
        rank: true,
        xp: true,
        total_debates: true,
        wins: true,
        losses: true,
        elo_rating: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get achievements
    const achievements = await prisma.achievement.findMany({
      where: { user_id: userId },
      orderBy: { awarded_at: "desc" },
    });

    // Calculate additional stats
    const winRate =
      user.total_debates > 0 ? (user.wins / user.total_debates) * 100 : 0;
    const xpToNextLevel = this.getXPForLevel(user.level + 1) - user.xp;
    const levelProgress =
      user.level > 1
        ? ((user.xp - this.getXPForLevel(user.level)) /
            (this.getXPForLevel(user.level + 1) -
              this.getXPForLevel(user.level))) *
          100
        : 0;

    return {
      ...user,
      achievements,
      win_rate: winRate,
      xp_to_next_level: Math.max(0, xpToNextLevel),
      level_progress: Math.min(100, levelProgress),
    };
  }

  async getUserRank(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const rank = await prisma.user.count({
      where: {
        xp: { gt: user.xp },
      },
    });

    return rank + 1;
  }

  private calculateLevel(xp: number): number {
    // Level formula: level = floor(sqrt(xp / 100)) + 1
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  private getXPForLevel(level: number): number {
    // XP required for level: xp = (level - 1)^2 * 100
    return Math.pow(level - 1, 2) * 100;
  }

  private calculateRank(
    xp: number,
    wins: number,
    totalDebates: number
  ): string {
    const level = this.calculateLevel(xp);
    const winRate = totalDebates > 0 ? (wins / totalDebates) * 100 : 0;

    if (level >= 50 && winRate >= 80) return "Grandmaster";
    if (level >= 40 && winRate >= 70) return "Master";
    if (level >= 30 && winRate >= 60) return "Expert";
    if (level >= 20 && winRate >= 50) return "Advanced";
    if (level >= 15 && winRate >= 40) return "Intermediate";
    if (level >= 10) return "Competent";
    if (level >= 5) return "Apprentice";
    return "Novice";
  }

  private async checkAchievements(userId: string): Promise<Achievement[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        achievements: true,
        participants: {
          include: {
            debate: true,
          },
        },
      },
    });

    if (!user) return [];

    const existingAchievements = user.achievements.map((a) => a.title);
    const newAchievements: Achievement[] = [];

    // Calculate user stats for achievement checking
    const stats = {
      total_debates: user.total_debates,
      wins: user.wins,
      losses: user.losses,
      average_score: this.calculateAverageScore(user.participants),
      consecutive_wins: this.calculateConsecutiveWins(user.participants),
      max_ai_score: this.getMaxAIScore(user.participants),
      total_flags: this.getTotalFlags(user.participants),
    };

    // Check each achievement
    for (const achievement of this.achievements) {
      if (
        !existingAchievements.includes(achievement.title) &&
        achievement.condition(user, stats)
      ) {
        // Award achievement
        await prisma.achievement.create({
          data: {
            user_id: userId,
            title: achievement.title,
            description: achievement.description,
            icon_url: achievement.icon_url,
          },
        });

        // Award XP bonus
        await prisma.user.update({
          where: { id: userId },
          data: {
            xp: { increment: achievement.xp_reward },
          },
        });

        newAchievements.push(achievement);
      }
    }

    return newAchievements;
  }

  private calculateAverageScore(participants: any[]): number {
    if (participants.length === 0) return 0;
    const totalScore = participants.reduce((sum, p) => sum + (p.score || 0), 0);
    return totalScore / participants.length;
  }

  private calculateConsecutiveWins(participants: any[]): number {
    const sortedParticipants = participants
      .filter((p) => p.debate.status === "ENDED")
      .sort(
        (a, b) =>
          new Date(b.debate.ended_at).getTime() -
          new Date(a.debate.ended_at).getTime()
      );

    let consecutiveWins = 0;
    for (const participant of sortedParticipants) {
      if (participant.is_winner) {
        consecutiveWins++;
      } else {
        break;
      }
    }

    return consecutiveWins;
  }

  private getMaxAIScore(participants: any[]): number {
    return Math.max(...participants.map((p) => p.score || 0), 0);
  }

  private getTotalFlags(participants: any[]): number {
    // This would need to be calculated from debate messages
    // For now, return 0 as placeholder
    return 0;
  }

  private async updateLeaderboard(userId: string, xp: number) {
    await redis.zadd(REDIS_KEYS.LEADERBOARD, xp, userId);

    // Also update weekly leaderboard
    const weeklyKey = `${REDIS_KEYS.LEADERBOARD}:weekly`;
    await redis.zadd(weeklyKey, xp, userId);
    await redis.expire(weeklyKey, 7 * 24 * 60 * 60); // 1 week
  }
}

export const gamificationService = new GamificationService();
