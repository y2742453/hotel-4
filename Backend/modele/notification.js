import { pool } from "../db/db.js";

export async function createNotification({
  id_user,
  type_notification,
  titre,
  message,
  lien = null,
}) {
  const sql = `
    INSERT INTO notifications (id_user, type_notification, titre, message, lien)
    VALUES (?, ?, ?, ?, ?)
  `;

  const [result] = await pool.execute(sql, [
    id_user,
    type_notification,
    titre,
    message,
    lien,
  ]);

  return result.insertId;
}

export async function getNotificationsByUser(id_user) {
  const sql = `
    SELECT 
      id_notification,
      id_user,
      type_notification,
      titre,
      message,
      lien,
      lu,
      date_creation
    FROM notifications
    WHERE id_user = ?
    ORDER BY date_creation DESC
  `;

  const [rows] = await pool.execute(sql, [id_user]);
  return rows;
}

export async function getUnreadNotificationsCount(id_user) {
  const sql = `
    SELECT COUNT(*) AS total
    FROM notifications
    WHERE id_user = ? AND lu = 0
  `;

  const [rows] = await pool.execute(sql, [id_user]);
  return rows[0].total;
}

export async function markNotificationAsRead(id_notification, id_user) {
  const sql = `
    UPDATE notifications
    SET lu = 1
    WHERE id_notification = ? AND id_user = ?
  `;

  const [result] = await pool.execute(sql, [id_notification, id_user]);
  return result.affectedRows > 0;
}

export async function markAllNotificationsAsRead(id_user) {
  const sql = `
    UPDATE notifications
    SET lu = 1
    WHERE id_user = ? AND lu = 0
  `;

  const [result] = await pool.execute(sql, [id_user]);
  return result.affectedRows;
}