import db from "../../db/db.js";

export async function getAllEvenements() {
  const [rows] = await db.query("SELECT * FROM evenements");
  return rows;
}
