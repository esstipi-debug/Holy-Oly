import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  throw new Error("GOOGLE_API_KEY is not defined in the environment variables.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

export class GeminiProvider {
  private flashModel: GenerativeModel;

  constructor() {
    // Only using Flash family as requested
    this.flashModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generateFlash(prompt: string): Promise<string> {
    const result = await this.flashModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  // Maintaining signature for compatibility but routing to Flash
  async generatePro(prompt: string): Promise<string> {
    return this.generateFlash(prompt);
  }

  getFlashModel(): GenerativeModel {
    return this.flashModel;
  }
}

export const geminiProvider = new GeminiProvider();
