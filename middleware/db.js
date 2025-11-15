import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },

  // Prevent stale idle connections
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 15000
});

pool.on("error", (err) => {
  console.error("❌ PG Pool Error:", err.code, err.message);
});

export async function query(sql, params) {
  try {
    return await pool.query(sql, params);
  } catch (err) {
    console.error("❌ DB Query Error:", err.code, err.message);
    return null;
  }
}