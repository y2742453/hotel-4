import "dotenv/config";
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 10,
});

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("Connecté à la base de données MySQL");
    conn.release();
  } catch (err) {
    console.error("Erreur de connexion MySQL :", err.message);
  }
})();
