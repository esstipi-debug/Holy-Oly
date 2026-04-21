import { db } from "./index";
import { sql } from "drizzle-orm";

async function runMigrate() {
  console.log("[Migrate] Starting manual schema application...");

  try {
    // Enable pgvector extension just in case
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);

    // Create tables manually since drizzle-kit push is interactive
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS athlete_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        fatigue_level INTEGER DEFAULT 0,
        stress_level INTEGER DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        query TEXT NOT NULL,
        response TEXT NOT NULL,
        category TEXT NOT NULL,
        latency_ms INTEGER,
        cost TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        embedding vector(768),
        metadata JSONB DEFAULT '{}',
        source TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("[Migrate] Schema applied successfully.");
    process.exit(0);
  } catch (err) {
    console.error("[Migrate] Error:", err);
    process.exit(1);
  }
}

runMigrate();
