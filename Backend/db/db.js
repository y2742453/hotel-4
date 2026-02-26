import "dotenv/config";
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

try {
  const conn = await pool.getConnection();
  console.log("Connecté à la base de données MySQL");
  conn.release();
} catch (err) {
  console.error("Erreur de connexion MySQL :", err.message);
}
