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
  private proModel: GenerativeModel;

  constructor() {
    this.flashModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    this.proModel = genAI.getGenerativeModel({ model: "gemini-2.0-pro-exp-02-05" });
  }

  async generateFlash(prompt: string): Promise<string> {
    const result = await this.flashModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  async generatePro(prompt: string): Promise<string> {
    const result = await this.proModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  getFlashModel(): GenerativeModel {
    return this.flashModel;
  }

  getProModel(): GenerativeModel {
    return this.proModel;
  }
}

export const geminiProvider = new GeminiProvider();
