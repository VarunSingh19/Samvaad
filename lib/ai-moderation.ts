// Mock AI service - in production, integrate with Gemini AI and Whisper
export interface AIAnalysisResult {
  score: number
  feedback: string
  flagged: boolean
  toxicity_score: number
  areas_to_improve: string[]
  strengths: string[]
}

export class AIModerationService {
  async analyzeText(text: string): Promise<AIAnalysisResult> {
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock analysis based on text characteristics
    const wordCount = text.split(" ").length
    const hasQuestionMarks = text.includes("?")
    const hasExclamation = text.includes("!")
    const hasEvidence = text.toLowerCase().includes("because") || text.toLowerCase().includes("evidence")

    let score = 50 // Base score
    const feedback: string[] = []
    const areas_to_improve: string[] = []
    const strengths: string[] = []

    // Scoring logic
    if (wordCount > 20) {
      score += 10
      strengths.push("Well-developed argument")
    } else if (wordCount < 10) {
      score -= 10
      areas_to_improve.push("Provide more detailed arguments")
    }

    if (hasEvidence) {
      score += 15
      strengths.push("Good use of supporting evidence")
    } else {
      areas_to_improve.push("Include supporting evidence or reasoning")
    }

    if (hasQuestionMarks) {
      score += 5
      strengths.push("Engaging rhetorical questions")
    }

    if (hasExclamation) {
      score -= 5
      areas_to_improve.push("Maintain professional tone")
    }

    // Check for toxic content (simple keyword check)
    const toxicWords = ["hate", "stupid", "idiot", "shut up"]
    const hasToxicContent = toxicWords.some((word) => text.toLowerCase().includes(word))

    const toxicity_score = hasToxicContent ? 0.8 : Math.random() * 0.3
    const flagged = toxicity_score > 0.7

    if (flagged) {
      score = Math.min(score, 20)
      areas_to_improve.push("Maintain respectful language")
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score))

    // Generate feedback
    let feedbackText = ""
    if (score >= 80) {
      feedbackText = "Excellent argument with strong reasoning!"
    } else if (score >= 60) {
      feedbackText = "Good argument, but could be strengthened."
    } else if (score >= 40) {
      feedbackText = "Decent point, but needs more development."
    } else {
      feedbackText = "Argument needs significant improvement."
    }

    return {
      score,
      feedback: feedbackText,
      flagged,
      toxicity_score,
      areas_to_improve,
      strengths,
    }
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    // Mock transcription - in production, use Whisper AI
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return "This is a mock transcription of the audio content."
  }
}

export const aiService = new AIModerationService()
