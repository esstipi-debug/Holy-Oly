import { geminiProvider } from "../providers/gemini";

export type QueryType = "coach" | "athlete" | "general";

export class AgentRouter {
  async route(query: string): Promise<QueryType> {
    const prompt = `
      You are the Agent Router for Holy Oly, an AI platform for weightlifting and recovery.
      Classify the following user query into one of these categories:
      - "coach": Queries about athlete programming, performance metrics, and coaching strategy.
      - "athlete": Queries about personal recovery, "Control de Daños", fatigue, and lifestyle stressors (Huberman protocols).
      - "general": General health queries, chit-chat, or queries not specifically related to weightlifting/recovery.

      Output ONLY the category name in lowercase.

      User Query: "${query}"
    `;

    try {
      const response = await geminiProvider.generateFlash(prompt);
      const category = response.trim().toLowerCase() as QueryType;
      
      if (["coach", "athlete", "general"].includes(category)) {
        return category;
      }
      return "general";
    } catch (error) {
      console.error("Error in AgentRouter:", error);
      return "general";
    }
  }
}

export const agentRouter = new AgentRouter();
