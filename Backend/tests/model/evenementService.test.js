import { test, expect, beforeAll, afterEach, afterAll } from "@jest/globals";
import { pool } from "../../db/db.js";
import {
  createServiceRequest,
  getServiceRequestByEvent,
  updateServiceRequest,
  serviceRequestExists,
  getAllServiceRequests,
  getAllServiceRequestsByEvent,
  getPendingServiceRequests,
  updateServiceRequestStatus,
} from "../../modele/evenementService.js";

let testRoleId;
let testUserId;
let testSalleId;
let testEvenementId;
let testServiceId1;
let testServiceId2;

beforeAll(async () => {
  await pool.query("USE HotelDB_Test");

  const [roleResult] = await pool.execute(
    "SELECT id_role FROM roles WHERE nom_role = ? LIMIT 1",
    ["Organisateur"]
  );

  if (roleResult.length === 0) {
    throw new Error("Le rôle 'Organisateur' n'existe pas dans HotelDB_Test");
  }

  testRoleId = roleResult[0].id_role;

  await pool.execute("SET FOREIGN_KEY_CHECKS = 0");
  await pool.execute("TRUNCATE TABLE evenement_services");
  await pool.execute("TRUNCATE TABLE reservations");
  await pool.execute("TRUNCATE TABLE evenements");
  await pool.execute("TRUNCATE TABLE services");
  await pool.execute("TRUNCATE TABLE salles");
  await pool.execute("TRUNCATE TABLE users");
  await pool.execute("SET FOREIGN_KEY_CHECKS = 1");

  const [user] = await pool.execute(
    `
      INSERT INTO users (nom, prenom, email, mot_de_passe, id_role)
      VALUES (?, ?, ?, ?, ?)
    `,
    ["Test", "User", "test-service@test.com", "pass", testRoleId]
  );
  testUserId = user.insertId;

  const [salle] = await pool.execute(
    `
      INSERT INTO salles (nom_salle, capacite, equipements, statut)
      VALUES (?, ?, ?, ?)
    `,
    ["Salle Test", 100, "Projecteur", "Disponible"]
  );
  testSalleId = salle.insertId;

  const [evenement] = await pool.execute(
    `
      INSERT INTO evenements
      (nom_evenement, type_evenement, description, date_debut, date_fin, statut, id_salle, id_organisateur)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      "Event Test",
      "Conférence",
      "Description test",
      "2026-04-01 10:00:00",
      "2026-04-01 12:00:00",
      "En attente",
      testSalleId,
      testUserId,
    ]
  );
  testEvenementId = evenement.insertId;

  const [service1] = await pool.execute(
    `
      INSERT INTO services (nom_service, description, tarif)
      VALUES (?, ?, ?)
    `,
    ["Restauration", "Service restauration", 500]
  );
  testServiceId1 = service1.insertId;

  const [service2] = await pool.execute(
    `
      INSERT INTO services (nom_service, description, tarif)
      VALUES (?, ?, ?)
    `,
    ["Audiovisuel", "Service audiovisuel", 300]
  );
  testServiceId2 = service2.insertId;
});

afterEach(async () => {
  await pool.execute("SET FOREIGN_KEY_CHECKS = 0");
  await pool.execute("TRUNCATE TABLE evenement_services");
  await pool.execute("SET FOREIGN_KEY_CHECKS = 1");
});

afterAll(async () => {
  await pool.end();
});

test("Créer une demande de service", async () => {
  const created = await createServiceRequest({
    id_evenement: testEvenementId,
    id_service: testServiceId1,
    details: { menu: "Buffet", boissons: true },
    quantite: 2,
    montant_estime: 1500,
  });

  expect(created).toBe(true);

  const [rows] = await pool.execute(
    `
      SELECT *
      FROM evenement_services
      WHERE id_evenement = ? AND id_service = ?
    `,
    [testEvenementId, testServiceId1]
  );

  expect(rows.length).toBe(1);
  expect(rows[0].statut).toBe("Demande");
  expect(Number(rows[0].quantite)).toBe(2);
  expect(Number(rows[0].montant_estime)).toBe(1500);
});

test("Refuser la création si id_evenement ou id_service manque", async () => {
  await expect(
    createServiceRequest({
      id_evenement: null,
      id_service: testServiceId1,
      details: "Test",
    })
  ).rejects.toThrow("id_evenement et id_service sont requis");
});

test("Vérifier qu'une demande existe déjà", async () => {
  await createServiceRequest({
    id_evenement: testEvenementId,
    id_service: testServiceId1,
    details: "Buffet simple",
  });

  const exists = await serviceRequestExists(testEvenementId, testServiceId1);
  expect(exists).toBe(true);
});

test("Récupérer une demande de service par événement et service", async () => {
  await createServiceRequest({
    id_evenement: testEvenementId,
    id_service: testServiceId1,
    details: { menu: "Cocktail" },
    quantite: 3,
    montant_estime: 900,
  });

  const demande = await getServiceRequestByEvent(
    testEvenementId,
    testServiceId1
  );

  expect(demande).not.toBeNull();
  expect(demande.id_evenement).toBe(testEvenementId);
  expect(demande.id_service).toBe(testServiceId1);
  expect(demande.nom_service).toBe("Restauration");
  expect(demande.details).toEqual({ menu: "Cocktail" });
  expect(Number(demande.quantite)).toBe(3);
  expect(Number(demande.montant_estime)).toBe(900);
  expect(demande.statut).toBe("Demande");
});

test("Mettre à jour une demande de service", async () => {
  await createServiceRequest({
    id_evenement: testEvenementId,
    id_service: testServiceId1,
    details: { menu: "Standard" },
    quantite: 1,
    montant_estime: 500,
  });

  const updated = await updateServiceRequest(testEvenementId, testServiceId1, {
    details: { menu: "Premium" },
    quantite: 4,
    montant_estime: 2000,
  });

  expect(updated).toBe(true);

  const demande = await getServiceRequestByEvent(
    testEvenementId,
    testServiceId1
  );

  expect(demande.details).toEqual({ menu: "Premium" });
  expect(Number(demande.quantite)).toBe(4);
  expect(Number(demande.montant_estime)).toBe(2000);
});

test("Mettre à jour le statut d'une demande", async () => {
  await createServiceRequest({
    id_evenement: testEvenementId,
    id_service: testServiceId1,
    details: "Test statut",
  });

  const updated = await updateServiceRequestStatus(
    testEvenementId,
    testServiceId1,
    "Valide"
  );

  expect(updated).toBe(true);

  const demande = await getServiceRequestByEvent(
    testEvenementId,
    testServiceId1
  );

  expect(demande.statut).toBe("Valide");
});

test("Récupérer toutes les demandes de service", async () => {
  await createServiceRequest({
    id_evenement: testEvenementId,
    id_service: testServiceId1,
    details: { type: "Buffet" },
    quantite: 2,
    montant_estime: 1000,
  });

  await createServiceRequest({
    id_evenement: testEvenementId,
    id_service: testServiceId2,
    details: { materiel: "Micros" },
    quantite: 5,
    montant_estime: 700,
  });

  const demandes = await getAllServiceRequests();

  expect(demandes.length).toBeGreaterThanOrEqual(2);

  const restauration = demandes.find(
    (d) =>
      d.id_evenement === testEvenementId && d.id_service === testServiceId1
  );

  const audiovisuel = demandes.find(
    (d) =>
      d.id_evenement === testEvenementId && d.id_service === testServiceId2
  );

  expect(restauration).toBeDefined();
  expect(audiovisuel).toBeDefined();
});

test("Récupérer toutes les demandes d'un événement", async () => {
  await createServiceRequest({
    id_evenement: testEvenementId,
    id_service: testServiceId1,
    details: "Demande 1",
  });

  await createServiceRequest({
    id_evenement: testEvenementId,
    id_service: testServiceId2,
    details: "Demande 2",
  });

  const demandes = await getAllServiceRequestsByEvent(testEvenementId);

  expect(demandes.length).toBe(2);
  expect(demandes.every((d) => d.id_evenement === testEvenementId)).toBe(true);
});

test("Récupérer uniquement les demandes en attente", async () => {
  await createServiceRequest({
    id_evenement: testEvenementId,
    id_service: testServiceId1,
    details: "Demande en attente",
  });

  await createServiceRequest({
    id_evenement: testEvenementId,
    id_service: testServiceId2,
    details: "Demande à valider",
  });

  await updateServiceRequestStatus(testEvenementId, testServiceId2, "Valide");

  const pending = await getPendingServiceRequests();

  const demandePending = pending.find(
    (d) =>
      d.id_evenement === testEvenementId && d.id_service === testServiceId1
  );

  const demandeValidee = pending.find(
    (d) =>
      d.id_evenement === testEvenementId && d.id_service === testServiceId2
  );

  expect(demandePending).toBeDefined();
  expect(demandeValidee).toBeUndefined();
});

test("Retourner null si la demande n'existe pas", async () => {
  const demande = await getServiceRequestByEvent(99999, 99999);
  expect(demande).toBeNull();
});

test("Retourner false si la demande n'existe pas", async () => {
  const exists = await serviceRequestExists(99999, 99999);
  expect(exists).toBe(false);
});