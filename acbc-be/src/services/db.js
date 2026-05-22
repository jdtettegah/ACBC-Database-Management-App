import pg from "pg";

const { Pool } = pg;
console.log("DATABASE_URL =", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
  ? { rejectUnauthorized: false }
  : false,
});

export default pool;