import { test, expect, beforeAll, afterEach, afterAll } from "@jest/globals";
import {
  addInvite,
  getInviteById,
  getInvitesByEvent,
  getStatsByEvent,
  updateInvite,
  deleteInvite,
} from "../../modele/invite.js";
import { pool } from "../../db/db.js";

let testEvenement;
let testSalle;
let testUser;

beforeAll(async () => {
  await pool.query("USE HotelDB_Test");

  await pool.execute("SET FOREIGN_KEY_CHECKS = 0");
  await pool.execute("TRUNCATE TABLE invites");
  await pool.execute("TRUNCATE TABLE evenements");
  await pool.execute("TRUNCATE TABLE salles");
  await pool.execute("TRUNCATE TABLE users");
  await pool.execute("SET FOREIGN_KEY_CHECKS = 1");

  const [role] = await pool.execute(
    "SELECT id_role FROM roles WHERE nom_role='Organisateur'",
  );

  const [user] = await pool.execute(
    `INSERT INTO users (nom, prenom, email, mot_de_passe, id_role)
     VALUES (?, ?, ?, ?, ?)`,
    ["Test", "Invite", "invite@test.com", "pass", role[0].id_role],
  );
  testUser = user.insertId;

  const [salle] = await pool.execute(
    `INSERT INTO salles (nom_salle, cout, capacite, equipements, statut)
     VALUES (?, ?, ?, ?, ?)`,
    ["Salle Invite", 1000, 100, "Wifi", "Disponible"],
  );
  testSalle = salle.insertId;

  const [event] = await pool.execute(
    `INSERT INTO evenements 
    (nom_evenement, type_evenement, description, date_debut, date_fin, statut, id_salle, id_organisateur)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "Event Invite",
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
  await pool.execute("SET FOREIGN_KEY_CHECKS = 0");
  await pool.execute("TRUNCATE TABLE invites");
  await pool.execute("SET FOREIGN_KEY_CHECKS = 1");
});

afterAll(async () => {
  await pool.end();
});

test("Ajouter un invité", async () => {
  const invite = {
    id_evenement: testEvenement,
    nom: "Doe",
    prenom: "John",
    email: "john@test.com",
  };

  const id = await addInvite(invite);

  expect(Number.isInteger(id)).toBe(true);

  const saved = await getInviteById(id);
  expect(saved).not.toBeNull();
  expect(saved.nom).toBe("Doe");
  expect(saved.email).toBe("john@test.com");
});

test("Récupérer un invité par ID", async () => {
  const id = await addInvite({
    id_evenement: testEvenement,
    nom: "Smith",
    prenom: "Anna",
    email: "anna@test.com",
  });

  const invite = await getInviteById(id);

  expect(invite).not.toBeNull();
  expect(invite.id_invite).toBe(id);
});

test("Retourne null si invité inexistant", async () => {
  const invite = await getInviteById(9999);
  expect(invite).toBeNull();
});

test("Récupérer les invités par événement", async () => {
  await addInvite({
    id_evenement: testEvenement,
    nom: "A",
    prenom: "A",
    email: "a@test.com",
  });

  await addInvite({
    id_evenement: testEvenement,
    nom: "B",
    prenom: "B",
    email: "b@test.com",
  });

  const invites = await getInvitesByEvent(testEvenement);

  expect(invites.length).toBe(2);
});

test("Mettre à jour un invité", async () => {
  const id = await addInvite({
    id_evenement: testEvenement,
    nom: "Old",
    prenom: "Name",
    email: "old@test.com",
  });

  const updated = await updateInvite(id, {
    nom: "New",
    statut: "confirme",
  });

  expect(updated).toBe(true);

  const invite = await getInviteById(id);
  expect(invite.nom).toBe("New");
  expect(invite.statut).toBe("confirme");
});

test("updateInvite retourne false si rien à update", async () => {
  const id = await addInvite({
    id_evenement: testEvenement,
    nom: "Test",
    prenom: "Test",
    email: "test@test.com",
  });

  const result = await updateInvite(id, {});
  expect(result).toBe(false);
});

test("Supprimer un invité", async () => {
  const id = await addInvite({
    id_evenement: testEvenement,
    nom: "Delete",
    prenom: "Me",
    email: "delete@test.com",
  });

  const deleted = await deleteInvite(id);
  expect(deleted).toBe(true);

  const invite = await getInviteById(id);
  expect(invite).toBeNull();
});

test("Statistiques des invités", async () => {
  await addInvite({
    id_evenement: testEvenement,
    nom: "A",
    prenom: "A",
    email: "a@test.com",
    statut: "confirme",
  });

  await addInvite({
    id_evenement: testEvenement,
    nom: "B",
    prenom: "B",
    email: "b@test.com",
    statut: "refuse",
  });

  await addInvite({
    id_evenement: testEvenement,
    nom: "C",
    prenom: "C",
    email: "c@test.com",
  });

  const stats = await getStatsByEvent(testEvenement);

  expect(stats.confirme).toBe(1);
  expect(stats.refuse).toBe(1);
  expect(stats.en_attente).toBe(1);
  expect(stats.invite).toBe(0);
});
