import { GoogleGenAI } from "@google/genai";

const globalForGoogleAI = globalThis as unknown as {
  googleAI: GoogleGenAI | undefined;
};

export function getGoogleAI(): GoogleGenAI {
  if (!globalForGoogleAI.googleAI) {
    globalForGoogleAI.googleAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }
  return globalForGoogleAI.googleAI;
}
