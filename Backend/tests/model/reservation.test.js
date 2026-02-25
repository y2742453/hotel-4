import { test, expect, beforeAll, afterEach, describe } from "@jest/globals";
import {
  addReservation,
  hasConflict,
  getReservationsBySalle,
} from "../../model/reservation/reservation.js";
import db from "../../db/db.js";

// Variables globales pour les tests
let testSalle;
let testEvenement;
let testUser;

beforeAll(async () => {
  // Créer un rôle si nécessaire
  const [roleCheck] = await db.execute(
    "SELECT id_role FROM roles WHERE nom_role = ?",
    ["Organisateur"],
  );
  const roleId = roleCheck.length > 0 ? roleCheck[0].id_role : 2;

  // Créer un utilisateur de test
  const [userResult] = await db.execute(
    "INSERT INTO users (nom, prenom, email, mot_de_passe, id_role) VALUES (?, ?, ?, ?, ?)",
    ["Test", "User", "test@jest.com", "password123", roleId],
  );
  testUser = userResult.insertId;

  // Créer une salle de test
  const [salleResult] = await db.execute(
    "INSERT INTO salles (nom_salle, capacite, equipements, statut) VALUES (?, ?, ?, ?)",
    ["Salle Jest", 50, "Projecteur, Wifi", "Disponible"],
  );
  testSalle = salleResult.insertId;

  // Créer un événement de test
  const [eventResult] = await db.execute(
    "INSERT INTO evenements (nom_evenement, type_evenement, description, date_debut, date_fin, statut, id_salle, id_organisateur) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
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

// Après CHAQUE test: nettoyer les réservations
afterEach(async () => {
  await db.execute("DELETE FROM reservations");
});

describe("Tests du module de réservation", () => {
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
    const [rows] = await db.execute(
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

    const reservations = await getReservationsBySalle(testSalle);
    expect(reservations.length).toBe(2);
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
});
