// import prisma from "@/lib/database";
// import { GoogleGenerativeAI } from "@google/generative-ai";

// export interface AIAnalysisResult {
//   score: number;
//   feedback: string;
//   flagged: boolean;
//   toxicity_score: number;
//   areas_to_improve: string[];
//   strengths: string[];
//   confidence: number;
// }

// export interface TranscriptionResult {
//   text: string;
//   confidence: number;
//   language: string;
//   duration: number;
// }

// export class AIModerationService {
//   private genAI: GoogleGenerativeAI;
//   private openAIHeaders: HeadersInit;

//   constructor() {
//     this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
//     this.openAIHeaders = {
//       Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//       "Content-Type": "application/json",
//     };
//   }

//   async analyzeText(
//     text: string,
//     context?: {
//       debateId?: string;
//       userId?: string;
//       role?: string;
//     }
//   ): Promise<AIAnalysisResult> {
//     try {
//       const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

//       const prompt = `
//         Analyze this debate argument for quality, logic, and appropriateness:

//         Text: "${text}"
//         Role: ${context?.role || "participant"}

//         Please provide:
//         1. A score from 0-100 based on argument quality, logic, evidence, and clarity
//         2. Specific feedback on the argument
//         3. Whether the content should be flagged for inappropriate language (true/false)
//         4. A toxicity score from 0-1 (0 being completely appropriate, 1 being highly toxic)
//         5. Areas for improvement (as an array of strings)
//         6. Strengths of the argument (as an array of strings)
//         7. Your confidence in this analysis (0-1)

//         Respond in JSON format:
//         {
//           "score": number,
//           "feedback": "string",
//           "flagged": boolean,
//           "toxicity_score": number,
//           "areas_to_improve": ["string"],
//           "strengths": ["string"],
//           "confidence": number
//         }
//       `;

//       const result = await model.generateContent(prompt);
//       const response = await result.response;
//       const analysisText = response.text();

//       // Parse JSON response
//       const analysis = JSON.parse(
//         analysisText.replace(/```json\n?|\n?```/g, "")
//       );

//       // Store AI feedback in database
//       if (context?.debateId && context?.userId) {
//         await prisma.aIFeedback.create({
//           data: {
//             debate_id: context.debateId,
//             user_id: context.userId,
//             feedback: analysis.feedback,
//             areas_to_improve: analysis.areas_to_improve,
//             strengths: analysis.strengths,
//             ai_score: analysis.score,
//           },
//         });
//       }

//       return analysis;
//     } catch (error) {
//       console.error("Gemini AI analysis failed:", error);
//       throw new Error("AI analysis service unavailable");
//     }
//   }

//   async transcribeAudio(
//     audioBuffer: Buffer,
//     options?: {
//       language?: string;
//       debateId?: string;
//       userId?: string;
//     }
//   ): Promise<TranscriptionResult> {
//     try {
//       const formData = new FormData();
//       const audioBlob = new Blob([audioBuffer], { type: "audio/webm" });
//       formData.append("file", audioBlob, "audio.webm");
//       formData.append("model", "whisper-1");

//       if (options?.language) {
//         formData.append("language", options.language);
//       }

//       const response = await fetch(
//         "https://api.openai.com/v1/audio/transcriptions",
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//           },
//           body: formData,
//         }
//       );

//       if (!response.ok) {
//         throw new Error(`Whisper API error: ${response.statusText}`);
//       }

//       const result = await response.json();

//       return {
//         text: result.text,
//         confidence: 0.95, // Whisper doesn't provide confidence scores
//         language: options?.language || "en",
//         duration: audioBuffer.length / 16000, // Rough estimate
//       };
//     } catch (error) {
//       console.error("Whisper transcription failed:", error);
//       throw new Error("Audio transcription service unavailable");
//     }
//   }

//   // async moderateContent(
//   //   content: string,
//   //   type: "text" | "audio" = "text"
//   // ): Promise<{
//   //   allowed: boolean;
//   //   reason?: string;
//   //   severity: "low" | "medium" | "high";
//   // }> {
//   //   try {
//   //     const response = await fetch("https://api.openai.com/v1/moderations", {
//   //       method: "POST",
//   //       headers: this.openAIHeaders,
//   //       body: JSON.stringify({
//   //         input: content,
//   //       }),
//   //     });

//   //     if (!response.ok) {
//   //       throw new Error(`OpenAI Moderation API error: ${response.statusText}`);
//   //     }

//   //     const result = await response.json();
//   //     const moderation = result.results[0];

//   //     let severity: "low" | "medium" | "high" = "low";
//   //     let reason = "";

//   //     if (moderation.flagged) {
//   //       const categories = moderation.categories;
//   //       const scores = moderation.category_scores;

//   //       // Determine severity based on highest score
//   //       const maxScore = Math.max(...(Object.values(scores) as number[]));
//   //       if (maxScore > 0.8) severity = "high";
//   //       else if (maxScore > 0.5) severity = "medium";
//   //       else severity = "low";

//   //       // Get flagged categories
//   //       const flaggedCategories = Object.keys(categories).filter(
//   //         (key) => categories[key]
//   //       );
//   //       reason = `Content flagged for: ${flaggedCategories.join(", ")}`;
//   //     }

//   //     return {
//   //       allowed: !moderation.flagged,
//   //       reason: moderation.flagged ? reason : undefined,
//   //       severity,
//   //     };
//   //   } catch (error) {
//   //     console.error("Content moderation failed:", error);
//   //     throw new Error("Content moderation service unavailable");
//   //   }
//   // }

//   async moderateContent(
//     content: string,
//     type: "text" | "audio" = "text"
//   ): Promise<{
//     allowed: boolean;
//     reason?: string;
//     severity: "low" | "medium" | "high";
//   }> {
//     try {
//       const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

//       const prompt = `
//       Analyze the following ${type} content for inappropriate material and provide moderation assessment:

//       Content: "${content}"

//       Check for:
//       - Hate speech or harassment
//       - Violence or threats
//       - Sexual content
//       - Self-harm content
//       - Illegal activities
//       - Spam or misleading information
//       - Profanity or offensive language
//       - Discriminatory language

//       Respond in JSON format:
//       {
//         "flagged": boolean,
//         "allowed": boolean,
//         "severity": "low" | "medium" | "high",
//         "reason": "string explaining why content was flagged (if flagged)",
//         "categories": ["array of flagged categories"],
//         "confidence": number (0-1)
//       }

//       If content is appropriate, set flagged to false and allowed to true.
//       If content violates guidelines, set flagged to true and allowed to false.
//       Severity should be "high" for serious violations, "medium" for moderate issues, "low" for minor concerns.
//     `;

//       const result = await model.generateContent(prompt);
//       const response = await result.response;
//       const moderationText = response.text();

//       // Parse JSON response
//       const moderation = JSON.parse(
//         moderationText.replace(/```json\n?|\n?```/g, "")
//       );

//       return {
//         allowed: moderation.allowed,
//         reason: moderation.flagged ? moderation.reason : undefined,
//         severity: moderation.severity,
//       };
//     } catch (error) {
//       console.error("Gemini content moderation failed:", error);

//       // Fallback: If AI moderation fails, allow content but log the error
//       // You might want to implement a more conservative approach here
//       return {
//         allowed: true, // or false for more strict approach
//         reason: "Moderation service temporarily unavailable",
//         severity: "low",
//       };
//     }
//   }
//   async generateDebateSummary(debateId: string): Promise<string> {
//     try {
//       // Get all messages from the debate
//       const messages = await prisma.debateMessage.findMany({
//         where: { debate_id: debateId },
//         include: {
//           sender: {
//             select: { username: true },
//           },
//         },
//         orderBy: { created_at: "asc" },
//       });

//       // Get debate details
//       const debate = await prisma.debate.findUnique({
//         where: { id: debateId },
//         select: { title: true, topic: true },
//       });

//       if (!debate) {
//         throw new Error("Debate not found");
//       }

//       // Format messages for AI
//       const conversationText = messages
//         .map((msg) => `${msg.sender.username} (${msg.role}): ${msg.content}`)
//         .join("\n");

//       const model = this.genAI.getGenerativeModel({
//         model: "gemini-2.0-flash",
//       });

//       const prompt = `
//         Summarize this debate discussion:

//         Title: ${debate.title}
//         Topic: ${debate.topic}

//         Conversation:
//         ${conversationText}

//         Please provide:
//         1. A concise summary of the main arguments from both sides
//         2. Key points raised during the debate
//         3. The overall quality and civility of the discussion
//         4. Any notable insights or compelling arguments

//         Keep the summary under 300 words and maintain objectivity.
//       `;

//       const result = await model.generateContent(prompt);
//       const response = await result.response;
//       const summary = response.text();

//       // Update debate with summary
//       await prisma.debate.update({
//         where: { id: debateId },
//         data: { ai_summary: summary },
//       });

//       return summary;
//     } catch (error) {
//       console.error("Summary generation failed:", error);
//       throw new Error("Summary generation service unavailable");
//     }
//   }

//   async generatePersonalizedFeedback(
//     userId: string,
//     debateId: string,
//     userMessages: string[]
//   ): Promise<{
//     overall_performance: string;
//     specific_feedback: string[];
//     improvement_suggestions: string[];
//     strengths: string[];
//     score: number;
//   }> {
//     try {
//       const model = this.genAI.getGenerativeModel({
//         model: "gemini-2.0-flash",
//       });

//       const messagesText = userMessages.join("\n");

//       const prompt = `
//         Analyze this user's debate performance and provide personalized feedback:

//         User's arguments:
//         ${messagesText}

//         Please provide detailed feedback in JSON format:
//         {
//           "overall_performance": "A comprehensive assessment of their debate performance",
//           "specific_feedback": ["Specific observations about their arguments"],
//           "improvement_suggestions": ["Actionable suggestions for improvement"],
//           "strengths": ["What they did well"],
//           "score": number (0-100 based on argument quality, logic, evidence use, and clarity)
//         }
//       `;

//       const result = await model.generateContent(prompt);
//       const response = await result.response;
//       const feedbackText = response.text();

//       const feedback = JSON.parse(
//         feedbackText.replace(/```json\n?|\n?```/g, "")
//       );

//       // Store personalized feedback
//       await prisma.aIFeedback.create({
//         data: {
//           debate_id: debateId,
//           user_id: userId,
//           feedback: feedback.overall_performance,
//           areas_to_improve: feedback.improvement_suggestions,
//           strengths: feedback.strengths,
//           ai_score: feedback.score,
//         },
//       });

//       return feedback;
//     } catch (error) {
//       console.error("Personalized feedback generation failed:", error);
//       throw new Error("Feedback generation service unavailable");
//     }
//   }

//   async detectLanguage(text: string): Promise<string> {
//     try {
//       const model = this.genAI.getGenerativeModel({
//         model: "gemini-2.0-flash",
//       });

//       const prompt = `
//         Detect the language of this text and respond with just the ISO 639-1 language code (e.g., "en", "es", "fr"):

//         "${text}"
//       `;

//       const result = await model.generateContent(prompt);
//       const response = await result.response;
//       const language = response.text().trim().toLowerCase();

//       return language;
//     } catch (error) {
//       console.error("Language detection failed:", error);
//       return "en"; // Default to English
//     }
//   }

//   async translateText(text: string, targetLanguage: string): Promise<string> {
//     try {
//       const model = this.genAI.getGenerativeModel({
//         model: "gemini-2.0-flash",
//       });

//       const prompt = `
//         Translate the following text to ${targetLanguage}. Maintain the tone and meaning:

//         "${text}"

//         Respond with only the translated text.
//       `;

//       const result = await model.generateContent(prompt);
//       const response = await result.response;
//       const translation = response.text().trim();

//       return translation;
//     } catch (error) {
//       console.error("Translation failed:", error);
//       throw new Error("Translation service unavailable");
//     }
//   }
// }

// export const aiModerationService = new AIModerationService();
import prisma from "@/lib/database";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface AIAnalysisResult {
  score: number;
  feedback: string;
  flagged: boolean;
  toxicity_score: number;
  areas_to_improve: string[];
  strengths: string[];
  confidence: number;
  topic_relevance: number;
  argument_quality: number;
  tone_score: number;
  evidence_score: number;
  logic_score: number;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  duration: number;
}

export class AIModerationService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async analyzeText(
    text: string,
    context?: {
      debateId?: string;
      userId?: string;
      role?: string;
      debateTopic?: string;
      debateTitle?: string;
    }
  ): Promise<AIAnalysisResult> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

      // Get debate context if available
      let debateContext = "";
      if (context?.debateId) {
        const debate = await prisma.debate.findUnique({
          where: { id: context.debateId },
          select: { title: true, topic: true, type: true },
        });
        if (debate) {
          debateContext = `
Debate Title: ${debate.title}
Debate Topic: ${debate.topic}
Debate Category: ${debate.type}
User's Position: ${
            context.role === "AFFIRMATIVE"
              ? "Supporting/For"
              : "Opposing/Against"
          }
`;
        }
      }

      const prompt = `
You are an expert debate judge and content moderator. Analyze this debate argument comprehensively:

${debateContext}

Argument Text: "${text}"

Provide a detailed analysis in JSON format with the following scores (0-100):

{
  "score": overall_quality_score,
  "feedback": "detailed_constructive_feedback",
  "flagged": true_if_inappropriate_content,
  "toxicity_score": toxicity_level_0_to_1,
  "topic_relevance": how_relevant_to_debate_topic_0_to_100,
  "argument_quality": logical_structure_and_persuasiveness_0_to_100,
  "tone_score": respectfulness_and_professionalism_0_to_100,
  "evidence_score": use_of_facts_examples_reasoning_0_to_100,
  "logic_score": logical_consistency_and_flow_0_to_100,
  "areas_to_improve": ["specific_improvement_suggestions"],
  "strengths": ["what_they_did_well"],
  "confidence": analysis_confidence_0_to_1
}

Scoring Guidelines:
- TOXICITY: Heavily penalize bad language, personal attacks, hate speech, inappropriate content
- TONE: Reward respectful, professional, civil discourse. Penalize aggressive, rude, or dismissive language
- TOPIC RELEVANCE: Must be directly related to the debate topic. Off-topic arguments score low
- ARGUMENT QUALITY: Reward clear structure, persuasive reasoning, well-developed points
- EVIDENCE: Reward use of examples, facts, logical reasoning, supporting details
- LOGIC: Reward consistent reasoning, cause-effect relationships, avoiding fallacies

IMPORTANT PENALTIES:
- Bad language/profanity: -30 to -50 points from overall score
- Personal attacks: -40 to -60 points
- Off-topic content: -20 to -40 points
- Disrespectful tone: -15 to -30 points

IMPORTANT REWARDS:
- Excellent tone and respect: +10 to +20 points
- Strong evidence and examples: +10 to +25 points
- Highly relevant to topic: +10 to +20 points
- Logical and well-structured: +10 to +20 points

The overall score should reflect the true quality of the argument considering all factors.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();

      // Parse JSON response
      let analysis: AIAnalysisResult;
      try {
        analysis = JSON.parse(analysisText.replace(/```json\n?|\n?```/g, ""));
      } catch (parseError) {
        console.error("Failed to parse AI response:", analysisText);
        // Fallback analysis
        analysis = this.createFallbackAnalysis(text);
      }

      // Ensure all required fields exist
      analysis = {
        score: Math.max(0, Math.min(100, analysis.score || 0)),
        feedback: analysis.feedback || "Analysis completed",
        flagged: analysis.flagged || false,
        toxicity_score: Math.max(0, Math.min(1, analysis.toxicity_score || 0)),
        topic_relevance: Math.max(
          0,
          Math.min(100, analysis.topic_relevance || 50)
        ),
        argument_quality: Math.max(
          0,
          Math.min(100, analysis.argument_quality || 50)
        ),
        tone_score: Math.max(0, Math.min(100, analysis.tone_score || 50)),
        evidence_score: Math.max(
          0,
          Math.min(100, analysis.evidence_score || 50)
        ),
        logic_score: Math.max(0, Math.min(100, analysis.logic_score || 50)),
        areas_to_improve: analysis.areas_to_improve || [],
        strengths: analysis.strengths || [],
        confidence: Math.max(0, Math.min(1, analysis.confidence || 0.8)),
      };

      // Store AI feedback in database
      if (context?.debateId && context?.userId) {
        await prisma.aIFeedback.create({
          data: {
            debate_id: context.debateId,
            user_id: context.userId,
            feedback: analysis.feedback,
            areas_to_improve: analysis.areas_to_improve,
            strengths: analysis.strengths,
            ai_score: analysis.score,
          },
        });
      }

      return analysis;
    } catch (error) {
      console.error("Gemini AI analysis failed:", error);
      return this.createFallbackAnalysis(text);
    }
  }

  private createFallbackAnalysis(text: string): AIAnalysisResult {
    // Simple fallback analysis
    const wordCount = text.split(" ").length;
    const hasEvidence =
      text.toLowerCase().includes("because") ||
      text.toLowerCase().includes("evidence");
    const hasBadLanguage = this.containsBadLanguage(text);

    let score = 50; // Base score

    if (wordCount > 20) score += 10;
    if (hasEvidence) score += 15;
    if (hasBadLanguage) score -= 40;

    score = Math.max(0, Math.min(100, score));

    return {
      score,
      feedback: "Fallback analysis - AI service temporarily unavailable",
      flagged: hasBadLanguage,
      toxicity_score: hasBadLanguage ? 0.8 : 0.2,
      topic_relevance: 50,
      argument_quality: score,
      tone_score: hasBadLanguage ? 20 : 70,
      evidence_score: hasEvidence ? 70 : 40,
      logic_score: 50,
      areas_to_improve: hasBadLanguage
        ? ["Use respectful language"]
        : ["Provide more evidence"],
      strengths: wordCount > 20 ? ["Well-developed argument"] : [],
      confidence: 0.5,
    };
  }

  private containsBadLanguage(text: string): boolean {
    const badWords = [
      "stupid",
      "idiot",
      "dumb",
      "moron",
      "fool",
      "loser",
      "pathetic",
      "shut up",
      "damn",
      "hell",
      "crap",
      "suck",
      "hate",
      "disgusting",
      "worthless",
      "useless",
      "garbage",
      "trash",
      "awful",
      "terrible",
    ];
    const lowerText = text.toLowerCase();
    return badWords.some((word) => lowerText.includes(word));
  }

  async moderateContent(
    content: string,
    type: "text" | "audio" = "text"
  ): Promise<{
    allowed: boolean;
    reason?: string;
    severity: "low" | "medium" | "high";
    toxicity_score: number;
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `
Analyze this content for moderation purposes:

Content: "${content}"

Determine if this content should be allowed in a respectful debate platform. Respond in JSON format:

{
  "allowed": true_or_false,
  "reason": "explanation_if_not_allowed",
  "severity": "low|medium|high",
  "toxicity_score": score_from_0_to_1,
  "categories_flagged": ["list_of_issues"]
}

Flag content for:
- Hate speech or discrimination
- Personal attacks or harassment
- Profanity or vulgar language
- Threats or violence
- Spam or irrelevant content
- Inappropriate sexual content

Severity levels:
- LOW: Minor issues, mild language
- MEDIUM: Clear violations, offensive language
- HIGH: Serious violations, hate speech, threats
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const moderationText = response.text();

      let moderation;
      try {
        moderation = JSON.parse(
          moderationText.replace(/```json\n?|\n?```/g, "")
        );
      } catch (parseError) {
        // Fallback moderation
        const hasBadLanguage = this.containsBadLanguage(content);
        moderation = {
          allowed: !hasBadLanguage,
          reason: hasBadLanguage
            ? "Contains inappropriate language"
            : undefined,
          severity: hasBadLanguage ? "medium" : "low",
          toxicity_score: hasBadLanguage ? 0.7 : 0.1,
        };
      }

      return {
        allowed: moderation.allowed !== false,
        reason: moderation.reason,
        severity: moderation.severity || "low",
        toxicity_score: Math.max(
          0,
          Math.min(1, moderation.toxicity_score || 0)
        ),
      };
    } catch (error) {
      console.error("Content moderation failed:", error);
      // Fallback to simple check
      const hasBadLanguage = this.containsBadLanguage(content);
      return {
        allowed: !hasBadLanguage,
        reason: hasBadLanguage ? "Contains inappropriate language" : undefined,
        severity: hasBadLanguage ? "medium" : "low",
        toxicity_score: hasBadLanguage ? 0.7 : 0.1,
      };
    }
  }

  async transcribeAudio(
    audioBuffer: Buffer,
    options?: {
      language?: string;
      debateId?: string;
      userId?: string;
    }
  ): Promise<TranscriptionResult> {
    try {
      const formData = new FormData();
      const audioBlob = new Blob([audioBuffer], { type: "audio/webm" });
      formData.append("file", audioBlob, "audio.webm");
      formData.append("model", "whisper-1");

      if (options?.language) {
        formData.append("language", options.language);
      }

      const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Whisper API error: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        text: result.text,
        confidence: 0.95, // Whisper doesn't provide confidence scores
        language: options?.language || "en",
        duration: audioBuffer.length / 16000, // Rough estimate
      };
    } catch (error) {
      console.error("Whisper transcription failed:", error);
      throw new Error("Audio transcription service unavailable");
    }
  }

  async generateDebateSummary(debateId: string): Promise<string> {
    try {
      // Get all messages from the debate
      const messages = await prisma.debateMessage.findMany({
        where: { debate_id: debateId },
        include: {
          sender: {
            select: { username: true },
          },
        },
        orderBy: { created_at: "asc" },
      });

      // Get debate details
      const debate = await prisma.debate.findUnique({
        where: { id: debateId },
        select: { title: true, topic: true, type: true },
      });

      if (!debate) {
        throw new Error("Debate not found");
      }

      // Format messages for AI
      const conversationText = messages
        .map((msg) => `${msg.sender.username} (${msg.role}): ${msg.content}`)
        .join("\n");

      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `
        Summarize this debate discussion:
        
        Title: ${debate.title}
        Topic: ${debate.topic}
        Category: ${debate.type}
        
        Conversation:
        ${conversationText}
        
        Please provide:
        1. A concise summary of the main arguments from both sides
        2. Key points raised during the debate
        3. The overall quality and civility of the discussion
        4. Any notable insights or compelling arguments
        5. Assessment of how well each side supported their position
        
        Keep the summary under 300 words and maintain objectivity.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();

      // Update debate with summary
      await prisma.debate.update({
        where: { id: debateId },
        data: { ai_summary: summary },
      });

      return summary;
    } catch (error) {
      console.error("Summary generation failed:", error);
      throw new Error("Summary generation service unavailable");
    }
  }

  async generatePersonalizedFeedback(
    userId: string,
    debateId: string,
    userMessages: string[],
    debateContext?: { title: string; topic: string; userRole: string }
  ): Promise<{
    overall_performance: string;
    specific_feedback: string[];
    improvement_suggestions: string[];
    strengths: string[];
    score: number;
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

      const messagesText = userMessages.join("\n");
      const contextText = debateContext
        ? `Debate: ${debateContext.title}\nTopic: ${debateContext.topic}\nUser's Position: ${debateContext.userRole}`
        : "";

      const prompt = `
        Analyze this user's debate performance and provide personalized feedback:
        
        ${contextText}
        
        User's arguments:
        ${messagesText}
        
        Please provide detailed feedback in JSON format:
        {
          "overall_performance": "A comprehensive assessment of their debate performance",
          "specific_feedback": ["Specific observations about their arguments"],
          "improvement_suggestions": ["Actionable suggestions for improvement"],
          "strengths": ["What they did well"],
          "score": number (0-100 based on argument quality, logic, evidence use, tone, and topic relevance)
        }
        
        Consider:
        - Argument structure and clarity
        - Use of evidence and examples
        - Logical reasoning and consistency
        - Tone and respectfulness
        - Relevance to the debate topic
        - Persuasiveness and impact
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const feedbackText = response.text();

      const feedback = JSON.parse(
        feedbackText.replace(/```json\n?|\n?```/g, "")
      );

      // Store personalized feedback
      await prisma.aIFeedback.create({
        data: {
          debate_id: debateId,
          user_id: userId,
          feedback: feedback.overall_performance,
          areas_to_improve: feedback.improvement_suggestions,
          strengths: feedback.strengths,
          ai_score: feedback.score,
        },
      });

      return feedback;
    } catch (error) {
      console.error("Personalized feedback generation failed:", error);
      throw new Error("Feedback generation service unavailable");
    }
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `
        Detect the language of this text and respond with just the ISO 639-1 language code (e.g., "en", "es", "fr"):
        
        "${text}"
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const language = response.text().trim().toLowerCase();

      return language;
    } catch (error) {
      console.error("Language detection failed:", error);
      return "en"; // Default to English
    }
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `
        Translate the following text to ${targetLanguage}. Maintain the tone and meaning:
        
        "${text}"
        
        Respond with only the translated text.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const translation = response.text().trim();

      return translation;
    } catch (error) {
      console.error("Translation failed:", error);
      throw new Error("Translation service unavailable");
    }
  }
}

export const aiModerationService = new AIModerationService();
