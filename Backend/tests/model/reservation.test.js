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
  await pool.query("CREATE DATABASE IF NOT EXISTS HotelDB_Test");
  await pool.query("USE HotelDB_Test");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id_role INT AUTO_INCREMENT PRIMARY KEY,
      nom_role VARCHAR(50) NOT NULL UNIQUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id_user INT AUTO_INCREMENT PRIMARY KEY,
      nom VARCHAR(100) NOT NULL,
      prenom VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      mot_de_passe VARCHAR(255) NOT NULL,
      actif BOOLEAN DEFAULT TRUE,
      id_role INT NOT NULL,
      date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_role) REFERENCES roles(id_role)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS salles (
      id_salle INT AUTO_INCREMENT PRIMARY KEY,
      nom_salle VARCHAR(100) NOT NULL,
      capacite INT NOT NULL,
      equipements TEXT,
      statut VARCHAR(20) DEFAULT 'Disponible'
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS evenements (
      id_evenement INT AUTO_INCREMENT PRIMARY KEY,
      nom_evenement VARCHAR(150) NOT NULL,
      type_evenement VARCHAR(50),
      description TEXT,
      date_debut DATETIME NOT NULL,
      date_fin DATETIME NOT NULL,
      statut VARCHAR(20) DEFAULT 'Brouillon',
      id_salle INT NOT NULL,
      id_organisateur INT NOT NULL,
      FOREIGN KEY (id_salle) REFERENCES salles(id_salle),
      FOREIGN KEY (id_organisateur) REFERENCES users(id_user)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservations (
      id_reservation INT AUTO_INCREMENT PRIMARY KEY,
      id_salle INT NOT NULL,
      id_evenement INT NOT NULL,
      date_debut DATETIME NOT NULL,
      date_fin DATETIME NOT NULL,
      FOREIGN KEY (id_salle) REFERENCES salles(id_salle),
      FOREIGN KEY (id_evenement) REFERENCES evenements(id_evenement)
    )
  `);

  const [roles] = await pool.query(
    "SELECT * FROM roles WHERE nom_role = 'Organisateur'",
  );
  if (roles.length === 0) {
    await pool.query(`
      INSERT INTO roles (nom_role) VALUES
      ('Administrateur'), ('Organisateur'), ('Coordonnateur'), ('Comptabilite')
    `);
  }

  await pool.execute("SET FOREIGN_KEY_CHECKS = 0");
  await pool.execute("TRUNCATE TABLE reservations");
  await pool.execute("TRUNCATE TABLE evenements");
  await pool.execute("TRUNCATE TABLE salles");
  await pool.execute("TRUNCATE TABLE users");
  await pool.execute("SET FOREIGN_KEY_CHECKS = 1");

  const [roleResult] = await pool.execute(
    "SELECT id_role FROM roles WHERE nom_role = ?",
    ["Organisateur"],
  );
  const roleId = roleResult[0].id_role;

  const [userResult] = await pool.execute(
    "INSERT INTO users (nom, prenom, email, mot_de_passe, id_role) VALUES (?, ?, ?, ?, ?)",
    ["Test", "User", "test@jest.com", "password123", roleId],
  );
  testUser = userResult.insertId;

  const [salleResult] = await pool.execute(
    "INSERT INTO salles (nom_salle, capacite, equipements, statut) VALUES (?, ?, ?, ?)",
    ["Salle Jest", 50, "Projecteur, Wifi", "Disponible"],
  );
  testSalle = salleResult.insertId;

  const [eventResult] = await pool.execute(
    `INSERT INTO evenements 
      (nom_evenement, type_evenement, description, date_debut, date_fin, statut, id_salle, id_organisateur)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "Événement Jest",
      "Test",
      "Événement pour les tests",
      "2026-03-01 10:00:00",
      "2026-03-01 12:00:00",
      "Confirme",
      testSalle,
      testUser,
    ],
  );
  testEvenement = eventResult.insertId;
});

afterEach(async () => {
  await pool.execute("SET FOREIGN_KEY_CHECKS = 0");
  await pool.execute("TRUNCATE TABLE reservations");
  await pool.execute("SET FOREIGN_KEY_CHECKS = 1");
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
  [testSalle]
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
