import { pool } from "../../db/db.js";

export async function getAllEvenements() {
  const [rows] = await pool.query("SELECT * FROM evenements");
  return rows;
}
