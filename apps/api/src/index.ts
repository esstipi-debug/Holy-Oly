import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { agentRouter } from "./agent/router";
import { checkConnection } from "./db";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Google Stack Backend is online" });
});

app.post("/v1/query", async (req: Request, res: Response) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  const category = await agentRouter.route(query);

  res.json({
    category,
    message: `Routed to ${category} engine. Processing...`,
    timestamp: new Date().toISOString()
  });
});

app.listen(port, async () => {
  await checkConnection();
  console.log(`Server running at http://localhost:${port}`);
});
