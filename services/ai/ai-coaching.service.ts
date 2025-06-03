import { GoogleGenerativeAI } from "@google/generative-ai"
import prisma from "@/lib/database"

export interface CoachingTip {
  type: "argument_structure" | "evidence" | "rhetoric" | "tone" | "logic"
  message: string
  priority: "low" | "medium" | "high"
  actionable: boolean
}

export class AICoachingService {
  private genAI: GoogleGenerativeAI

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  }

  async provideRealTimeCoaching(
    userId: string,
    debateId: string,
    currentMessage: string,
    debateHistory: string[],
  ): Promise<CoachingTip[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" })

      const prompt = `
        You are an expert debate coach providing real-time guidance. Analyze the current message and debate history to provide actionable coaching tips.

        Current message: "${currentMessage}"
        
        Previous messages in debate:
        ${debateHistory.join("\n")}

        Provide 2-3 specific, actionable coaching tips in JSON format:
        [
          {
            "type": "argument_structure|evidence|rhetoric|tone|logic",
            "message": "Specific tip for improvement",
            "priority": "low|medium|high",
            "actionable": true|false
          }
        ]

        Focus on:
        - Argument structure and clarity
        - Use of evidence and examples
        - Logical reasoning
        - Rhetorical effectiveness
        - Tone and civility
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      const tipsText = response.text()

      const tips = JSON.parse(tipsText.replace(/```json\n?|\n?```/g, ""))

      return tips
    } catch (error) {
      console.error("AI coaching failed:", error)
      return []
    }
  }

  async generateDebateStrategy(
    userId: string,
    debateId: string,
    userPosition: "affirmative" | "negative",
    topic: string,
    opponentMessages: string[],
  ): Promise<{
    strategy: string
    key_points: string[]
    counter_arguments: string[]
    evidence_suggestions: string[]
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" })

      const prompt = `
        Generate a debate strategy for the ${userPosition} position on: "${topic}"

        Opponent's arguments so far:
        ${opponentMessages.join("\n")}

        Provide a comprehensive strategy in JSON format:
        {
          "strategy": "Overall strategic approach",
          "key_points": ["Main points to emphasize"],
          "counter_arguments": ["How to counter opponent's arguments"],
          "evidence_suggestions": ["Types of evidence to look for"]
        }
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      const strategyText = response.text()

      const strategy = JSON.parse(strategyText.replace(/```json\n?|\n?```/g, ""))

      return strategy
    } catch (error) {
      console.error("Strategy generation failed:", error)
      throw new Error("Strategy generation service unavailable")
    }
  }

  async analyzeDebateFlow(debateId: string): Promise<{
    momentum: "affirmative" | "negative" | "neutral"
    turning_points: Array<{
      message_id: string
      impact: string
      timestamp: string
    }>
    overall_quality: number
    engagement_level: number
  }> {
    try {
      const messages = await prisma.debateMessage.findMany({
        where: { debate_id: debateId },
        include: {
          sender: { select: { username: true } },
        },
        orderBy: { created_at: "asc" },
      })

      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" })

      const conversationText = messages.map((msg) => `${msg.sender.username} (${msg.role}): ${msg.content}`).join("\n")

      const prompt = `
        Analyze this debate flow and provide insights in JSON format:

        ${conversationText}

        Provide analysis:
        {
          "momentum": "affirmative|negative|neutral",
          "turning_points": [
            {
              "message_id": "id",
              "impact": "description of impact",
              "timestamp": "timestamp"
            }
          ],
          "overall_quality": number (0-100),
          "engagement_level": number (0-100)
        }
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      const analysisText = response.text()

      const analysis = JSON.parse(analysisText.replace(/```json\n?|\n?```/g, ""))

      return analysis
    } catch (error) {
      console.error("Debate flow analysis failed:", error)
      throw new Error("Debate flow analysis service unavailable")
    }
  }
}

export const aiCoachingService = new AICoachingService()
