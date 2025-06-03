import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/database";
import redis from "@/lib/redis";
import { emailService } from "../email/email.service";

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  account_type?: "USER" | "ADMIN";
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  async register(userData: CreateUserData) {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: userData.email }, { username: userData.username }],
      },
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password
    const password_hash = await bcrypt.hash(userData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        password_hash,
        full_name: userData.full_name,
        account_type: userData.account_type || "USER",
        is_verified: true, // Auto-verify for now
      },
      select: {
        id: true,
        username: true,
        email: true,
        account_type: true,
        level: true,
        xp: true,
        rank: true,
        created_at: true,
      },
    });

    // Create user settings
    await prisma.userSettings.create({
      data: {
        user_id: user.id,
      },
    });

    // Send welcome email (async, don't wait for it)
    this.sendWelcomeEmail(user.email, user.username);

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(
      user.id,
      user.account_type
    );

    // Store refresh token in Redis
    await redis.setex(
      `refresh_token:${user.id}`,
      7 * 24 * 60 * 60,
      refreshToken
    );

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  private async sendWelcomeEmail(email: string, username: string) {
    try {
      const emailSent = await emailService.sendWelcomeEmail(email, username);
      if (emailSent) {
        console.log(`Welcome email sent to ${email}`);
      } else {
        console.warn(`Failed to send welcome email to ${email}`);
      }
    } catch (error) {
      console.error("Failed to send welcome email:", error);
    }
  }

  async login(loginData: LoginData) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: loginData.email },
      select: {
        id: true,
        username: true,
        email: true,
        password_hash: true,
        account_type: true,
        level: true,
        xp: true,
        rank: true,
        banned_until: true,
      },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Check if user is banned
    if (user.banned_until && user.banned_until > new Date()) {
      throw new Error("Account is temporarily banned");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      loginData.password,
      user.password_hash
    );
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // Update last active and online status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        last_active_at: new Date(),
        is_online: true,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(
      user.id,
      user.account_type
    );

    // Store refresh token in Redis
    await redis.setex(
      `refresh_token:${user.id}`,
      7 * 24 * 60 * 60,
      refreshToken
    );

    const { password_hash, banned_until, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;

      // Check if refresh token exists in Redis
      const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
      if (storedToken !== token) {
        throw new Error("Invalid refresh token");
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, account_type: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } =
        this.generateTokens(user.id, user.account_type);

      // Update refresh token in Redis
      await redis.setex(
        `refresh_token:${user.id}`,
        7 * 24 * 60 * 60,
        newRefreshToken
      );

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  async logout(userId: string) {
    // Remove refresh token from Redis
    await redis.del(`refresh_token:${userId}`);

    // Update user online status
    await prisma.user.update({
      where: { id: userId },
      data: {
        is_online: false,
        socket_id: null,
      },
    });
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        bio: true,
        avatar_url: true,
        account_type: true,
        level: true,
        rank: true,
        elo_rating: true,
        xp: true,
        total_debates: true,
        wins: true,
        losses: true,
        created_at: true,
        last_active_at: true,
        is_verified: true,
        is_online: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  private generateTokens(userId: string, accountType: string) {
    const accessToken = jwt.sign(
      { userId, accountType },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: "7d",
    });

    return { accessToken, refreshToken };
  }

  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      return decoded;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }
}

export const authService = new AuthService();
