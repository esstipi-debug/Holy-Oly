import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import dotenv from "dotenv";

dotenv.config();

// Standardizing database connection via environment variables ONLY
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export const checkConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("[DB] Conexión exitosa a Cloud SQL Postgres.");
    client.release();
    return true;
  } catch (error) {
    console.error("[DB] Error conectando a Cloud SQL:", error);
    return false;
  }
};
