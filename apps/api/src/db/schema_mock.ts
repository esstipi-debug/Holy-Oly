import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(), // Enum "coach" | "athlete"
  createdAt: integer("created_at", { mode: "timestamp" }),
});

export const athleteData = sqliteTable("athlete_data", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  fatigueLevel: integer("fatigue_level").default(0),
  stressLevel: integer("stress_level").default(0),
  metadata: text("metadata"), // JSON stringified
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const aiLogs = sqliteTable("ai_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  query: text("query").notNull(),
  response: text("response").notNull(),
  category: text("category").notNull(),
  latencyMs: integer("latency_ms"),
  cost: text("cost"),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

export const knowledgeBase = sqliteTable("knowledge_base", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  embedding: text("embedding"), // JSON.stringified array of numbers [0.12, 0.44, ...]
  metadata: text("metadata"), // JSON stringified
  source: text("source"),
  createdAt: integer("created_at", { mode: "timestamp" }),
});
