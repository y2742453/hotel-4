import db from "../../db/db.js";

export async function getAllSalles() {
  const [rows] = await db.query("SELECT * FROM salles");
  return rows;
}
