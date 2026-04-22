import { pool } from "../db/db.js";

export async function getNotificationPreferencesByUser(id_user) {
  const [rows] = await pool.execute(
    `
    SELECT id_preference, id_user, canal_interne, canal_email, canal_sms, updated_at
    FROM notification_preferences
    WHERE id_user = ?
    LIMIT 1
    `,
    [id_user],
  );

  return rows[0] || null;
}

export async function createDefaultNotificationPreferences(id_user) {
  const [result] = await pool.execute(
    `
    INSERT INTO notification_preferences (id_user, canal_interne, canal_email, canal_sms)
    VALUES (?, 1, 0, 0)
    `,
    [id_user],
  );

  return result.insertId;
}

export async function ensureNotificationPreferences(id_user) {
  const existing = await getNotificationPreferencesByUser(id_user);

  if (existing) return existing;

  await createDefaultNotificationPreferences(id_user);
  return await getNotificationPreferencesByUser(id_user);
}

export async function updateNotificationPreferences(
  id_user,
  { canal_interne, canal_email, canal_sms },
) {
  const [result] = await pool.execute(
    `
    UPDATE notification_preferences
    SET canal_interne = ?, canal_email = ?, canal_sms = ?
    WHERE id_user = ?
    `,
    [canal_interne, canal_email, canal_sms, id_user],
  );

  return result.affectedRows > 0;
}