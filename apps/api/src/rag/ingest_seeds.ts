import fs from "fs";
import path from "path";
import { db } from "../db";
import { knowledgeBase } from "../db/schema";
import { vertexEmbedder } from "../providers/embeddings";
import { v4 as uuidv4 } from "uuid";

async function ingestHubermanTopics() {
  const filePath = "C:\\Users\\Gamer\\Desktop\\Holy Oly 001\\huberman_topics.md";
  const content = fs.readFileSync(filePath, "utf-8");

  console.log("[Ingest] Processing huberman_topics.md...");

  const lines = content.split("\n");
  let topicsFound = 0;

  for (const line of lines) {
    // Basic Markdown Table Parser for the specific format
    if (line.includes("| [") && line.includes("](")) {
      const parts = line.split("|").filter(p => p.trim() !== "");
      if (parts.length >= 2) {
        const topicText = parts[0].trim();
        const tags = parts[1].trim();
        const combinedContent = `${topicText} - Categorized as: ${tags}`;

        try {
          const embedding = await vertexEmbedder.embed(combinedContent);
          
          await db.insert(knowledgeBase).values({
            id: uuidv4(),
            content: combinedContent,
            embedding: embedding,
            metadata: { tags, source: "huberman_topics.md" },
            source: topicText.match(/\[(.*?)\]/)?.[1] || "Huberman Topic",
          });

          topicsFound++;
          console.log(`[Ingest] Embedded: ${topicText}`);
        } catch (err) {
          console.error(`[Ingest] FAILED embedding for ${topicText}:`, err);
        }
      }
    }
  }

  console.log(`[Ingest] FINISHED. Total topics ingested: ${topicsFound}`);
}

async function main() {
  try {
    await ingestHubermanTopics();
    process.exit(0);
  } catch (err) {
    console.error("[Ingest] Main Error:", err);
    process.exit(1);
  }
}

main();
