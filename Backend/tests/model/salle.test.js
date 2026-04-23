import { test, expect, beforeAll, afterEach, afterAll } from "@jest/globals";
import { pool } from "../../db/db.js";
import {
  getAllSalles,
  getSalleById,
  createSalle,
  updateSalle,
  deleteSalle,
} from "../../modele/salle.js";

// =====================
// SETUP
// =====================
beforeAll(async () => {
  // Création complète des tables nécessaires pour les tests
  
});

afterEach(async () => {
  await pool.execute("SET FOREIGN_KEY_CHECKS = 0");
  await pool.execute("TRUNCATE TABLE salles");
  await pool.execute("SET FOREIGN_KEY_CHECKS = 1");
});

afterAll(async () => {
  await pool.end();
});

// =====================
// TESTS
// =====================

test("Créer une salle et la retrouver", async () => {
  const id = await createSalle("Grande Salle", "Conférence", 200, "Projecteur, Micro", "Disponible");

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

test("getAllSalles retourne toutes les salles", async () => {
  await createSalle("Salle A", "Réunion", 20, "Tableau blanc", "Disponible");
  await createSalle("Salle B", "Séminaire", 50, "Projecteur", "Disponible");

  const salles = await getAllSalles();

  expect(salles.length).toBe(2);
});

test("Modifier une salle", async () => {
  const id = await createSalle("Ancienne Salle", "Réunion", 30, "Aucun", "Disponible");

  const updated = await updateSalle(id, "Salle Rénovée", "Conférence", 50, "Projecteur, Wifi", "Disponible");

  expect(updated).toBe(true);

  const salle = await getSalleById(id);
  expect(salle.nom_salle).toBe("Salle Rénovée");
  expect(salle.capacite).toBe(50);
});

test("Mettre une salle en maintenance", async () => {
  const id = await createSalle("Salle Maintenance", "Réunion", 20, "Aucun", "Disponible");

  await updateSalle(id, "Salle Maintenance", "Réunion", 20, "Aucun", "Maintenance");

  const salle = await getSalleById(id);
  expect(salle.statut).toBe("Maintenance");
});

test("Supprimer une salle", async () => {
  const id = await createSalle("Salle a Supprimer", "Autre", 10, "Aucun", "Disponible");

  // Désactiver les FK pour permettre la suppression dans les tests
  await pool.execute("SET FOREIGN_KEY_CHECKS = 0");
  const deleted = await deleteSalle(id);
  await pool.execute("SET FOREIGN_KEY_CHECKS = 1");

  expect(deleted).toBe(true);

  const salle = await getSalleById(id);
  expect(salle).toBeNull();
});

test("deleteSalle retourne false si salle inexistante", async () => {
  await pool.execute("SET FOREIGN_KEY_CHECKS = 0");
  const deleted = await deleteSalle(99999);
  await pool.execute("SET FOREIGN_KEY_CHECKS = 1");
  expect(deleted).toBe(false);
});

test("updateSalle retourne false si salle inexistante", async () => {
  const updated = await updateSalle(99999, "Fantôme", "Réunion", 10, "Aucun", "Disponible");
  expect(updated).toBe(false);
});