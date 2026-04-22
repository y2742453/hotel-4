import { test, expect, beforeAll, afterEach, afterAll } from "@jest/globals";
import {
  createFacture,
  getFactureById,
  getAllFactures,
  saveStripeSession,
  markFacturePaid,
  createPaiement,
  getFactureByStripeSession,
  calculateEventTotal,
} from "../../modele/facture.js";

import { pool } from "../../db/db.js";

let testSalle;
let testEvenement;
let testUser;

beforeAll(async () => {
  await pool.query("USE HotelDB_Test");

  await pool.execute("SET FOREIGN_KEY_CHECKS = 0");
  await pool.execute("TRUNCATE TABLE factures");
  await pool.execute("TRUNCATE TABLE paiements");
  await pool.execute("TRUNCATE TABLE evenement_services");
  await pool.execute("TRUNCATE TABLE evenements");
  await pool.execute("TRUNCATE TABLE salles");
  await pool.execute("TRUNCATE TABLE users");
  await pool.execute("SET FOREIGN_KEY_CHECKS = 1");

  // 🔹 GET ROLE
  const [roleResult] = await pool.execute(
    "SELECT id_role FROM roles WHERE nom_role = ?",
    ["Organisateur"],
  );
  const roleId = roleResult[0].id_role;

  // 🔹 USER
  const [user] = await pool.execute(
    `INSERT INTO users (nom, prenom, email, mot_de_passe, id_role)
     VALUES (?, ?, ?, ?, ?)`,
    ["Test", "User", "facture@test.com", "pass", roleId],
  );
  testUser = user.insertId;

  // 🔹 SALLE
  const [salle] = await pool.execute(
    `INSERT INTO salles (nom_salle, cout, capacite)
     VALUES (?, ?, ?)`,
    ["Salle Test", 100, 50],
  );
  testSalle = salle.insertId; // ✅ FIX

  // 🔹 EVENEMENT
  const [event] = await pool.execute(
    `INSERT INTO evenements 
     (nom_evenement, date_debut, date_fin, id_salle, id_organisateur)
     VALUES (?, ?, ?, ?, ?)`,
    [
      "Event Test",
      "2026-03-01 10:00:00",
      "2026-03-01 12:00:00",
      testSalle, // ✅ now valid
      testUser,
    ],
  );
  testEvenement = event.insertId; // ✅ FIX
});

afterEach(async () => {
  await pool.execute("SET FOREIGN_KEY_CHECKS = 0");
  await pool.execute("TRUNCATE TABLE factures");
  await pool.execute("TRUNCATE TABLE paiements");
  await pool.execute("TRUNCATE TABLE evenement_services");
  await pool.execute("SET FOREIGN_KEY_CHECKS = 1");
});

afterAll(async () => {
  await pool.end();
});

test("Créer une facture", async () => {
  const id = await createFacture({
    id_evenement: testEvenement,
    montant_total: 100,
    taxes: 13,
  });

  expect(id).toBeGreaterThan(0);
});

test("Récupérer une facture par ID", async () => {
  const id = await createFacture({
    id_evenement: testEvenement,
    montant_total: 200,
    taxes: 26,
  });

  const facture = await getFactureById(id);

  expect(facture).not.toBeNull();
  expect(facture.id_facture).toBe(id);
});

test("Récupérer toutes les factures", async () => {
  await createFacture({
    id_evenement: testEvenement,
    montant_total: 100,
    taxes: 13,
  });

  const factures = await getAllFactures();

  expect(Array.isArray(factures)).toBe(true);
});

test("Sauvegarder une session Stripe", async () => {
  const id = await createFacture({
    id_evenement: testEvenement,
    montant_total: 100,
    taxes: 13,
  });

  await saveStripeSession(id, "sess_test");

  const [rows] = await pool.execute(
    "SELECT stripe_session_id FROM factures WHERE id_facture = ?",
    [id],
  );

  expect(rows[0].stripe_session_id).toBe("sess_test");
});

test("Marquer une facture comme payée", async () => {
  const id = await createFacture({
    id_evenement: testEvenement,
    montant_total: 100,
    taxes: 13,
  });

  await markFacturePaid(id, "pi_test");

  const [rows] = await pool.execute(
    "SELECT statut FROM factures WHERE id_facture = ?",
    [id],
  );

  expect(rows[0].statut).toBe("paye");
});

test("Créer un paiement", async () => {
  const id = await createFacture({
    id_evenement: testEvenement,
    montant_total: 100,
    taxes: 13,
  });

  await createPaiement({
    id_facture: id,
    montant: 113,
    paymentIntent: "pi_test",
  });

  const [rows] = await pool.execute(
    "SELECT * FROM paiements WHERE id_facture = ?",
    [id],
  );

  expect(rows.length).toBe(1);
});

test("Trouver facture par session Stripe", async () => {
  const id = await createFacture({
    id_evenement: testEvenement,
    montant_total: 100,
    taxes: 13,
  });

  await saveStripeSession(id, "sess_test");

  const facture = await getFactureByStripeSession("sess_test");

  expect(facture).not.toBeNull();
});

test("Calcul du total événement", async () => {
  await pool.execute(
    `INSERT INTO evenement_services 
   (id_evenement, id_service, quantite, montant_estime, statut)
   VALUES (?, ?, ?, ?, ?)`,
    [testEvenement, 1, 2, 50, "Valide"],
  );

  const total = await calculateEventTotal(testEvenement);

  expect(total).toBe(200);
});
