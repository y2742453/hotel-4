import { test, expect, beforeAll, afterEach, afterAll } from "@jest/globals";
import { pool } from "../../db/db.js";
import {
  getAllFromSalles,
  getSalleById,
  createSalle,
  updateSalle,
  deleteSalle,
} from "../../modele/salle.js";

beforeAll(async () => {
  await pool.query("USE HotelDB_Test");
});

afterEach(async () => {
  await pool.execute("SET FOREIGN_KEY_CHECKS = 0");
  await pool.execute("TRUNCATE TABLE evenements");
  await pool.execute("TRUNCATE TABLE salles");
  await pool.execute("SET FOREIGN_KEY_CHECKS = 1");
});

afterAll(async () => {
  await pool.end();
});

test("Créer une salle et la retrouver", async () => {
  const id = await createSalle(
    "Grande Salle",
    2000.0,
    "Conférence",
    200,
    "Projecteur, Micro",
    "Disponible",
  );

  expect(id).toBeGreaterThan(0);

  const salle = await getSalleById(id);
  expect(salle).toBeDefined();
  expect(salle.nom_salle).toBe("Grande Salle");
  expect(salle.capacite).toBe(200);
  expect(salle.statut).toBe("Disponible");
});

test("getSalleById retourne null si ID inexistant", async () => {
  const salle = await getSalleById(99999);
  expect(salle).toBeNull();
});

test("getAllFromSalles retourne toutes les salles", async () => {
  await createSalle(
    "Salle A",
    500,
    "Réunion",
    20,
    "Tableau blanc",
    "Disponible",
  );
  await createSalle(
    "Salle B",
    1000,
    "Séminaire",
    50,
    "Projecteur",
    "Disponible",
  );

  const salles = await getAllFromSalles();
  expect(salles.length).toBe(2);
});

test("Modifier une salle", async () => {
  const id = await createSalle(
    "Ancienne Salle",
    300,
    "Réunion",
    30,
    "Aucun",
    "Disponible",
  );

  const updated = await updateSalle(
    id,
    "Salle Rénovée",
    800,
    "Conférence",
    50,
    "Projecteur, Wifi",
    "Disponible",
  );

  expect(updated).toBe(true);

  const salle = await getSalleById(id);
  expect(salle.nom_salle).toBe("Salle Rénovée");
  expect(salle.capacite).toBe(50);
});

test("Mettre une salle en maintenance", async () => {
  const id = await createSalle(
    "Salle Maintenance",
    400,
    "Réunion",
    20,
    "Aucun",
    "Disponible",
  );

  await updateSalle(
    id,
    "Salle Maintenance",
    400,
    "Réunion",
    20,
    "Aucun",
    "Maintenance",
  );

  const salle = await getSalleById(id);
  expect(salle.statut).toBe("Maintenance");
});

test("Supprimer une salle", async () => {
  const id = await createSalle(
    "Salle a Supprimer",
    200,
    "Autre",
    10,
    "Aucun",
    "Disponible",
  );

  const deleted = await deleteSalle(id);
  expect(deleted).toBe(true);

  const salle = await getSalleById(id);
  expect(salle).toBeNull();
});

test("deleteSalle retourne false si salle inexistante", async () => {
  const deleted = await deleteSalle(99999);
  expect(deleted).toBe(false);
});

test("updateSalle retourne false si salle inexistante", async () => {
  const updated = await updateSalle(
    99999,
    "Fantôme",
    100,
    "Réunion",
    10,
    "Aucun",
    "Disponible",
  );
  expect(updated).toBe(false);
});
