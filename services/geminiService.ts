import { GoogleGenAI, Modality } from "@google/genai";
import { Issue } from "../types";
import { LEVEL_LABELS } from "../constants";

export const analyzeIssue = async (issue: Issue): Promise<string> => {
  try {
    // Following guidelines: assume process.env.API_KEY is available and use it directly
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-flash-preview for basic text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Analyze the following customer issue and provide a brief summary and sentiment analysis.
        Subject: ${issue.subject}
        Description: ${issue.description}
        Priority: ${issue.priority}
        Current Level: ${LEVEL_LABELS[issue.iterationLevel]}
        
        Output format:
        **Summary**: [1 sentence]
        **Sentiment**: [Positive/Neutral/Negative/Frustrated]
        **Recommended Immediate Action**: [1 sentence]
      `,
    });
    return response.text || "Analysis failed.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "AI Analysis unavailable.";
  }
};

export const categorizeIssue = async (issue: Issue): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-flash-preview for fast classification
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Classify the following support ticket into exactly one of these categories based on its subject and body.
        
        Subject: ${issue.subject}
        Body: ${issue.description}
        
        Categories:
        - Technical Support
        - Billing & Finance
        - Feature Request
        - Infrastructure & Network
        - Account Management
        - General Inquiry
        
        Return ONLY the category name. Do not add markdown or extra text.
      `,
    });
    return response.text?.trim() || "Uncategorized";
  } catch (error) {
    console.error("Gemini Categorization Error:", error);
    return "Uncategorized";
  }
};

export const draftResponseEmail = async (issue: Issue): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-flash-preview for good quality concise text generation
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Draft a professional response email for the following issue.
        Context: The issue is currently at ${LEVEL_LABELS[issue.iterationLevel]}.
        If the level is high (>=3), be very apologetic and mention senior management is involved.
        
        Customer Name: ${issue.customerName}
        Issue: ${issue.subject}
        
        Keep it concise and empathetic.
      `,
    });
    return response.text || "Drafting failed.";
  } catch (error) {
    console.error("Gemini Email Draft Error:", error);
    return "Could not draft email.";
  }
};

export const getStrategicAdvice = async (issue: Issue): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-pro-preview for complex reasoning tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        You are a high-level crisis management consultant for the AIME system.
        An issue has escalated to ${LEVEL_LABELS[issue.iterationLevel]}.
        
        Issue: ${issue.subject} - ${issue.description}
        
        Provide a "Root Cause Analysis" hypothesis and 3 strategic steps to resolve this immediately and prevent future occurrences.
        Analyze potential organizational failures that led to this escalation.
      `,
      config: {
        // Higher budget for more detailed reasoning on complex organizational issues
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });
    return response.text || "Strategic advice unavailable.";
  } catch (error) {
    console.error("Gemini Strategic Advice Error:", error);
    return "Could not generate advice.";
  }
};

export const generateAudioAlert = async (text: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // Using Fenrir for an authoritative alert voice
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
      },
    });

    // Return the raw base64 data to handle manual PCM decoding in the frontend
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};