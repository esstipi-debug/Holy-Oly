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

export const macrocycleAdjustmentLog = pgTable("macrocycle_adjustment_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteId: uuid("athlete_id").references(() => users.id).notNull(),
  macrocycleId: text("macrocycle_id").notNull(),
  sessionId: uuid("session_id"),
  trigger: text("trigger", { enum: ["cns_red", "acwr_high", "injury_flag", "coach_manual", "auto_deload"] }).notNull(),
  actionType: text("action_type", { enum: ["skip", "reduce_load", "substitute_exercise", "abort_block"] }).notNull(),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  decidedBy: text("decided_by", { enum: ["system", "coach", "athlete"] }).notNull(),
  approvedBy: uuid("approved_by").references(() => users.id),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

