import { pool } from "../db/db.js";

/**
 * Récupère toutes les salles enregistrées dans la base de données.
 * @returns {Promise<Array>} Liste des salles.
 */
export async function getSalles() {
  const [rows] = await pool.query(`
    SELECT id_salle, nom_salle, cout, type, capacite, equipements, statut
    FROM salles
  `);
  return rows;
}

/**
 * Récupère toutes les salles enregistrées dans la base de données.
 * @returns {Promise<Array>} Liste des salles.
 */
export async function getAllFromSalles() {
  const [rows] = await pool.query("SELECT * FROM salles");
  return rows;
}
export async function getAllSalles() {
  const [rows] = await pool.query("SELECT * FROM salles");
  return rows;
}

/**
 * Récupère une salle à partir de son identifiant.
 * @param {number} id_salle Identifiant de la salle.
 * @returns {Promise<Object|null>} Salle trouvée ou null.
 */
export async function getSalleById(id_salle) {
  const [rows] = await pool.query(
    `
    SELECT id_salle, nom_salle, cout, type, capacite, equipements, statut
    FROM salles
    WHERE id_salle = ?
  `,
    [id_salle],
  );

  return rows[0] || null;
}

/**
 * Ajoute une nouvelle salle dans la base de données.
 * @param {string} nom_salle Nom de la salle.
 * @param {number} capacite Capacité maximale.
 * @param {string} equipements Équipements disponibles.
 * @param {string} statut Statut de la salle.
 * @returns {Promise<number>} Identifiant de la salle créée.
 */
export async function createSalle(
  nom_salle,
  cout,
  type,
  capacite,
  equipements,
  statut = "Disponible",
) {
  const [result] = await pool.query(
    `
    INSERT INTO salles (nom_salle, cout, type, capacite, equipements, statut)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [nom_salle, cout, type, capacite, equipements, statut],
  );

  return result.insertId;
}

/**
 * Met à jour les informations d'une salle existante.
 * @param {number} id_salle Identifiant de la salle.
 * @param {string} nom_salle Nouveau nom.
 * @param {number} capacite Nouvelle capacité.
 * @param {string} equipements Nouveaux équipements.
 * @param {string} statut Nouveau statut.
 * @returns {Promise<boolean>} true si modifiée, false sinon.
 */
export async function updateSalle(
  id_salle,
  nom_salle,
  cout,
  type,
  capacite,
  equipements,
  statut,
) {
  const [result] = await pool.query(
    `
    UPDATE salles
    SET nom_salle = ?, cout = ?, type = ?, capacite = ?, equipements = ?, statut = ?
    WHERE id_salle = ?
    `,
    [nom_salle, cout, type, capacite, equipements ?? null, statut, id_salle],
  );

  return result.affectedRows > 0;
}

/**
 * Supprime une salle de la base de données.
 * @param {number} id_salle Identifiant de la salle.
 * @returns {Promise<boolean>} true si supprimée, false sinon.
 */
export async function deleteSalle(id_salle) {
  const [result] = await pool.query(
    `
    DELETE FROM salles
    WHERE id_salle = ?
  `,
    [id_salle],
  );

  return result.affectedRows > 0;
}
