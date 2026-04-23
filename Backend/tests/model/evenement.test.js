import { test, expect, beforeAll, afterEach, afterAll } from "@jest/globals";
import { pool } from "../../db/db.js";
import {
  createEvenement,
  getAllEvenements,
} from "../../modele/evenement.js";
 
let testSalle;
let testUser;
 
beforeAll(async () => {
  await pool.query("USE HotelDB_Test");
 
  await pool.execute("SET FOREIGN_KEY_CHECKS = 0");
  await pool.execute("TRUNCATE TABLE evenements");
  await pool.execute("TRUNCATE TABLE reservations");
  await pool.execute("TRUNCATE TABLE salles");
  await pool.execute("TRUNCATE TABLE users");
  await pool.execute("TRUNCATE TABLE roles");
  await pool.execute("SET FOREIGN_KEY_CHECKS = 1");
 
  // rôle
  await pool.execute("INSERT INTO roles (nom_role) VALUES ('Organisateur')");
 
  // user
  const [user] = await pool.execute(
    "INSERT INTO users (nom, prenom, email, mot_de_passe, id_role) VALUES (?, ?, ?, ?, ?)",
    ["Test", "User", "test@test.com", "pass", 1],
  );
  testUser = user.insertId;
 
  // salle
  const [salle] = await pool.execute(
    `INSERT INTO salles (nom_salle, cout, capacite, equipements, statut)
   VALUES (?, ?, ?, ?, ?)`,
    ["Salle Test", 1000, 100, "Projecteur", "Disponible"],
  );
  testSalle = salle.insertId;
});
 
afterEach(async () => {
  try {
    await pool.execute("DELETE FROM evenement_services");
  } catch (e) {}
 
  await pool.execute("DELETE FROM reservations");
  await pool.execute("DELETE FROM evenements");
});
afterAll(async () => {
  await pool.end();
});
 
// ✅ TEST CREATE
test("Créer un événement avec réservation", async () => {
  const id = await createEvenement({
    nom_evenement: "Event Test",
    type_evenement: "Conférence",
    description: "Test",
    date_debut: "2026-04-01 10:00:00",
    date_fin: "2026-04-01 12:00:00",
    id_salle: testSalle,
    id_organisateur: testUser,
    services: [],
  });
 
  expect(id).toBeGreaterThan(0);
 
  const [rows] = await pool.execute(
    "SELECT * FROM evenements WHERE id_evenement = ?",
    [id],
  );
 
  expect(rows.length).toBe(1);
});
 
// ✅ TEST GET ALL
test("Récupérer tous les événements", async () => {
  await createEvenement({
    nom_evenement: "Event Test",
    type_evenement: "Conférence",
    description: "Test",
    date_debut: "2026-04-01 10:00:00",
    date_fin: "2026-04-01 12:00:00",
    id_salle: testSalle,
    id_organisateur: testUser,
    services: [],
  });
 
  const events = await getAllEvenements();
 
  expect(events.length).toBeGreaterThan(0);
});
 
// ✅ TEST CONFLIT
test("Refuser un événement avec conflit", async () => {
  await createEvenement({
    nom_evenement: "Event Test",
    type_evenement: "Conférence",
    description: "Test",
    date_debut: "2026-04-01 10:00:00",
    date_fin: "2026-04-01 12:00:00",
    id_salle: testSalle,
    id_organisateur: testUser,
  });
 
  await expect(
    createEvenement({
      nom_evenement: "Event Conflict",
      type_evenement: "Conférence",
      description: "Test",
      date_debut: "2026-04-01 11:00:00",
      date_fin: "2026-04-01 13:00:00",
      id_salle: testSalle,
      id_organisateur: testUser,
    }),
  ).rejects.toThrow("RESERVATION_CONFLICT");
});
 
 