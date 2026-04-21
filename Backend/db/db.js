import "dotenv/config";
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "1234",
  database: process.env.DB_NAME || "HotelDB",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
});

// 🔥 Test connexion (important)
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Connecté à MariaDB !");
    conn.release();
  } catch (err) {
    console.error("❌ Erreur DB :", err.message);
  }
})();