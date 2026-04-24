import { test, expect, beforeAll, afterEach, afterAll } from "@jest/globals";
import {
  createNotification,
  getNotificationsByUser,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../modele/notification.js";
import { pool } from "../../db/db.js";

let testUser1;
let testUser2;
let roleId;

beforeAll(async () => {
  await pool.query("USE HotelDB_Test");

  const [roleRows] = await pool.execute(
    "SELECT id_role FROM roles WHERE nom_role = ? LIMIT 1",
    ["Organisateur"],
  );

  if (roleRows.length === 0) {
    throw new Error("Le rôle 'Organisateur' n'existe pas dans HotelDB_Test");
  }

  roleId = roleRows[0].id_role;

  await pool.execute("SET FOREIGN_KEY_CHECKS = 0");
  await pool.execute("TRUNCATE TABLE notifications");
  await pool.execute("TRUNCATE TABLE users");
  await pool.execute("SET FOREIGN_KEY_CHECKS = 1");

  const [u1] = await pool.execute(
    "INSERT INTO users (nom, prenom, email, mot_de_passe, id_role) VALUES (?, ?, ?, ?, ?)",
    ["User1", "Test", "u1@test.com", "pass", roleId],
  );
  testUser1 = u1.insertId;

  const [u2] = await pool.execute(
    "INSERT INTO users (nom, prenom, email, mot_de_passe, id_role) VALUES (?, ?, ?, ?, ?)",
    ["User2", "Test", "u2@test.com", "pass", roleId],
  );
  testUser2 = u2.insertId;
});

afterEach(async () => {
  await pool.execute("DELETE FROM notifications");
});

afterAll(async () => {
  await pool.end();
});

test("Créer une notification", async () => {
  const id = await createNotification({
    id_user: testUser1,
    type_notification: "evenement",
    titre: "Test",
    message: "Message test",
  });

  expect(id).toBeGreaterThan(0);
});

test("Récupérer notifications d'un user", async () => {
  await createNotification({
    id_user: testUser1,
    type_notification: "evenement",
    titre: "Notif1",
    message: "msg1",
  });

  const list = await getNotificationsByUser(testUser1);

  expect(list.length).toBe(1);
  expect(list[0].id_user).toBe(testUser1);
});

test("Compter non lues", async () => {
  await createNotification({
    id_user: testUser1,
    type_notification: "evenement",
    titre: "Notif",
    message: "msg",
  });

  const count = await getUnreadNotificationsCount(testUser1);
  expect(Number(count)).toBe(1);
});

test("Marquer une notification comme lue", async () => {
  const id = await createNotification({
    id_user: testUser1,
    type_notification: "evenement",
    titre: "Notif",
    message: "msg",
  });

  const updated = await markNotificationAsRead(id, testUser1);
  expect(updated).toBe(true);

  const count = await getUnreadNotificationsCount(testUser1);
  expect(Number(count)).toBe(0);
});

test("Marquer toutes comme lues", async () => {
  await createNotification({
    id_user: testUser1,
    type_notification: "evenement",
    titre: "A",
    message: "A",
  });

  await createNotification({
    id_user: testUser1,
    type_notification: "evenement",
    titre: "B",
    message: "B",
  });

  const total = await markAllNotificationsAsRead(testUser1);

  expect(Number(total)).toBe(2);

  const count = await getUnreadNotificationsCount(testUser1);
  expect(Number(count)).toBe(0);
});

test("Aucune notification", async () => {
  const list = await getNotificationsByUser(testUser2);
  expect(list.length).toBe(0);
});
