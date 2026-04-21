import { helpers, PredictionServiceClient } from "@google-cloud/aiplatform";
import dotenv from "dotenv";

dotenv.config();

const project = "liftai-evolved-strength";
const location = "us-central1";
const model = "text-embedding-004";

// Prediction service client for Vertex AI
const client = new PredictionServiceClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export class VertexEmbedder {
  async embed(text: string): Promise<number[]> {
    const endpoint = `projects/${project}/locations/${location}/publishers/google/models/${model}`;
    
    // Vertex AI expectation for text-embedding models
    const instance = helpers.toValue({
      content: text,
      task_type: "RETRIEVAL_DOCUMENT"
    });

    const instances = [instance!];
    const parameters = helpers.toValue({});

    try {
      const [response] = await client.predict({
        endpoint,
        instances,
        parameters,
      });

      const predictions = response.predictions;
      if (!predictions || predictions.length === 0) {
        throw new Error("No predictions returned from Vertex AI");
      }

      // Structure of prediction response for text-embedding-004
      // It's usually { embeddings: { values: [...] } }
      const embedding = (predictions[0] as any).structValue.fields.embeddings.structValue.fields.values.listValue.values;
      return embedding.map((v: any) => v.numberValue);
    } catch (error) {
      console.error("[VertexEmbedder] Error:", error);
      throw error;
    }
  }
}

export const vertexEmbedder = new VertexEmbedder();
