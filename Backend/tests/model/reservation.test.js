
import { test, expect, beforeAll, afterEach, afterAll } from "@jest/globals";
import {
  addReservation,
  hasConflict,
  getReservationsBySalle,
} from "../../modele/reservation.js";
import { pool } from "../../db/db.js";
 
let testSalle;
let testEvenement;
let testUser;
 
beforeAll(async () => {
  await pool.query("USE HotelDB_Test");
 
  await pool.execute("SET FOREIGN_KEY_CHECKS = 0");
  await pool.execute("TRUNCATE TABLE reservations");
  await pool.execute("TRUNCATE TABLE evenements");
  await pool.execute("TRUNCATE TABLE salles");
  await pool.execute("TRUNCATE TABLE users");
  await pool.execute("SET FOREIGN_KEY_CHECKS = 1");
 
  const [role] = await pool.execute(
    "SELECT id_role FROM roles WHERE nom_role = 'Organisateur'",
  );
 
  const [user] = await pool.execute(
    `INSERT INTO users (nom, prenom, email, mot_de_passe, id_role)
     VALUES (?, ?, ?, ?, ?)`,
    ["Test", "User", "test@jest.com", "pass", role[0].id_role],
  );
  testUser = user.insertId;
 
  const [salle] = await pool.execute(
    `INSERT INTO salles (nom_salle, cout, capacite, equipements, statut)
     VALUES (?, ?, ?, ?, ?)`,
    ["Salle Jest", 1000, 50, "Projecteur", "Disponible"],
  );
  testSalle = salle.insertId;
 
  const [event] = await pool.execute(
    `INSERT INTO evenements
    (nom_evenement, type_evenement, description, date_debut, date_fin, statut, id_salle, id_organisateur)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "Event",
      "Test",
      "desc",
      "2026-03-01 10:00:00",
      "2026-03-01 12:00:00",
      "Confirme",
      testSalle,
      testUser,
    ],
  );
  testEvenement = event.insertId;
});
 
afterEach(async () => {
  await pool.execute("TRUNCATE TABLE reservations");
});
 
afterAll(async () => {
  await pool.end();
});
 
test("Créer une réservation valide", async () => {
  // Préparation
  const reservation = {
    idSalle: testSalle,
    idEvenement: testEvenement,
    dateDebut: "2026-03-15 10:00:00",
    dateFin: "2026-03-15 12:00:00",
  };
 
  // Exécution
  const idReservation = await addReservation(reservation);
 
  // Vérification
  expect(Number.isInteger(idReservation)).toBe(true);
  expect(idReservation).toBeGreaterThan(0);
 
  // Vérifier que la réservation existe en base
  const [rows] = await pool.execute(
    "SELECT * FROM reservations WHERE id_reservation = ?",
    [idReservation],
  );
 
  expect(rows.length).toBe(1);
  expect(rows[0].id_salle).toBe(testSalle);
  expect(rows[0].id_evenement).toBe(testEvenement);
});
 
test("Détecter un conflit - même créneau", async () => {
  // Préparation
  const reservation = {
    idSalle: testSalle,
    idEvenement: testEvenement,
    dateDebut: "2026-03-15 10:00:00",
    dateFin: "2026-03-15 12:00:00",
  };
 
  // Exécution - première réservation
  await addReservation(reservation);
 
  // Vérification - deuxième réservation doit échouer
  await expect(addReservation(reservation)).rejects.toThrow(
    "RESERVATION_CONFLICT",
  );
});
 
test("Détecter un conflit - chevauchement partiel", async () => {
  // Préparation
  const reservation1 = {
    idSalle: testSalle,
    idEvenement: testEvenement,
    dateDebut: "2026-03-15 10:00:00",
    dateFin: "2026-03-15 12:00:00",
  };
 
  const reservation2 = {
    idSalle: testSalle,
    idEvenement: testEvenement,
    dateDebut: "2026-03-15 11:00:00",
    dateFin: "2026-03-15 13:00:00",
  };
 
  // Exécution
  await addReservation(reservation1);
 
  // Vérification
  await expect(addReservation(reservation2)).rejects.toThrow(
    "RESERVATION_CONFLICT",
  );
});
 
test("Créer deux réservations sans conflit", async () => {
  // Préparation
  const reservation1 = {
    idSalle: testSalle,
    idEvenement: testEvenement,
    dateDebut: "2026-03-15 10:00:00",
    dateFin: "2026-03-15 12:00:00",
  };
 
  const reservation2 = {
    idSalle: testSalle,
    idEvenement: testEvenement,
    dateDebut: "2026-03-15 14:00:00",
    dateFin: "2026-03-15 16:00:00",
  };
 
  // Exécution
  const id1 = await addReservation(reservation1);
  const id2 = await addReservation(reservation2);
 
  // Vérification
  expect(id1).not.toBe(id2);
 
  const [rows] = await pool.execute(
    "SELECT * FROM reservations WHERE id_salle = ?",
    [testSalle],
  );
 
  expect(rows.length).toBe(2);
});
 
test("Vérifier hasConflict() sans conflit", async () => {
  // Exécution
  const conflict = await hasConflict(
    testSalle,
    "2026-03-15 10:00:00",
    "2026-03-15 12:00:00",
  );
 
  // Vérification
  expect(conflict).toBe(false);
});
 
test("Vérifier hasConflict() avec conflit", async () => {
  // Préparation
  await addReservation({
    idSalle: testSalle,
    idEvenement: testEvenement,
    dateDebut: "2026-03-15 10:00:00",
    dateFin: "2026-03-15 12:00:00",
  });
 
  // Exécution
  const conflict = await hasConflict(
    testSalle,
    "2026-03-15 11:00:00",
    "2026-03-15 13:00:00",
  );
 
  // Vérification
  expect(conflict).toBe(true);
});
 