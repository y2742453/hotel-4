import { pool } from "../../db/db.js";

export async function getAllSalles() {
  const [rows] = await pool.query("SELECT * FROM salles");
  return rows;
}
