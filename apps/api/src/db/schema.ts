import { pgTable, uuid, text, timestamp, jsonb, integer, vector } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["coach", "athlete"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const athleteData = pgTable("athlete_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  fatigueLevel: integer("fatigue_level").default(0),
  stressLevel: integer("stress_level").default(0),
  metadata: jsonb("metadata").default({}),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiLogs = pgTable("ai_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  query: text("query").notNull(),
  response: text("response").notNull(),
  category: text("category").notNull(),
  latencyMs: integer("latency_ms"),
  cost: text("cost"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const knowledgeBase = pgTable("knowledge_base", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 768 }), // Target text-embedding-004/005
  metadata: jsonb("metadata").default({}),
  source: text("source"),
  createdAt: timestamp("created_at").defaultNow(),
});
