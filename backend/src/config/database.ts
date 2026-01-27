import { Pool, PoolClient, QueryResult } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

/**
 * Execute a query with parameters
 * @param text SQL query
 * @param params Query parameters
 * @returns Query result
 */
export async function query(
  text: string,
  params?: any[],
): Promise<QueryResult> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.LOG_LEVEL === "debug") {
      console.log("Executed query", { text, duration, rows: result.rowCount });
    }
    return result;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Close all connections
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

export default pool;
