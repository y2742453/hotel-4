import { test, expect, beforeAll, afterEach, afterAll } from "@jest/globals";
import {
  ensureNotificationPreferences,
  getNotificationPreferencesByUser,
  updateNotificationPreferences,
} from "../../modele/notificationPreference.js";
import { pool } from "../../db/db.js";

let testUser;
let roleId;

beforeAll(async () => {
  await pool.query("USE HotelDB_Test");

  const [roleRows] = await pool.execute(
    "SELECT id_role FROM roles WHERE nom_role = ? LIMIT 1",
    ["Organisateur"]
  );

  if (roleRows.length === 0) {
    throw new Error("Le rôle 'Organisateur' n'existe pas dans HotelDB_Test");
  }

  roleId = roleRows[0].id_role;

  await pool.execute("SET FOREIGN_KEY_CHECKS = 0");
  await pool.execute("TRUNCATE TABLE notification_preferences");
  await pool.execute("TRUNCATE TABLE users");
  await pool.execute("SET FOREIGN_KEY_CHECKS = 1");

  const [user] = await pool.execute(
    "INSERT INTO users (nom, prenom, email, mot_de_passe, id_role) VALUES (?, ?, ?, ?, ?)",
    ["Test", "User", "testprefs@test.com", "pass", roleId]
  );

  testUser = user.insertId;
});

afterEach(async () => {
  await pool.execute("TRUNCATE TABLE notification_preferences");
});

afterAll(async () => {
  await pool.end();
});

test("Créer préférences par défaut", async () => {
  const prefs = await ensureNotificationPreferences(testUser);

  expect(prefs).not.toBeNull();
  expect(Number(prefs.canal_interne)).toBe(1);
  expect(Number(prefs.canal_email)).toBe(0);
  expect(Number(prefs.canal_sms)).toBe(0);
});

test("Récupérer préférences", async () => {
  await ensureNotificationPreferences(testUser);

  const prefs = await getNotificationPreferencesByUser(testUser);

  expect(prefs.id_user).toBe(testUser);
});

test("Modifier préférences", async () => {
  await ensureNotificationPreferences(testUser);

  const updated = await updateNotificationPreferences(testUser, {
    canal_interne: 0,
    canal_email: 1,
    canal_sms: 1,
  });

  expect(updated).toBe(true);

  const prefs = await getNotificationPreferencesByUser(testUser);

  expect(Number(prefs.canal_interne)).toBe(0);
  expect(Number(prefs.canal_email)).toBe(1);
  expect(Number(prefs.canal_sms)).toBe(1);
});

test("ensure ne duplique pas", async () => {
  await ensureNotificationPreferences(testUser);
  await ensureNotificationPreferences(testUser);

  const [rows] = await pool.execute(
    "SELECT * FROM notification_preferences WHERE id_user = ?",
    [testUser]
  );

  expect(rows.length).toBe(1);
});