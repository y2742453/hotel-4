/**
 * Module représentant la gestion des services.
 * Permet d'effectuer les opérations CRUD sur la table services.
 */

import { pool } from '../db/db.js'

/**
 * Récupère tous les services.
 * @returns {Promise<Array>} Liste des services.
 */
export async function getServices() {
  const [rows] = await pool.query(`
    SELECT id_service, nom_service, description, tarif
    FROM services
    ORDER BY id_service DESC
  `)
  return rows
}

/**
 * Récupère un service par identifiant.
 * @param {number} id_service Identifiant du service.
 * @returns {Promise<Object|null>} Service trouvé ou null.
 */
export async function getServiceById(id_service) {
  const [rows] = await pool.query(`
    SELECT id_service, nom_service, description, tarif
    FROM services
    WHERE id_service = ?
  `, [id_service])

  return rows[0] || null
}

/**
 * Ajoute un nouveau service.
 * @param {string} nom_service Nom du service.
 * @param {string} description Description du service.
 * @param {number} tarif Tarif du service.
 * @returns {Promise<number>} Identifiant du service créé.
 */
export async function createService(nom_service, description, tarif) {
  const [result] = await pool.query(`
    INSERT INTO services (nom_service, description, tarif)
    VALUES (?, ?, ?)
  `, [nom_service, description ?? null, tarif])

  return result.insertId
}

/**
 * Met à jour un service.
 * @param {number} id_service Identifiant du service.
 * @param {string} nom_service Nouveau nom.
 * @param {string} description Nouvelle description.
 * @param {number} tarif Nouveau tarif.
 * @returns {Promise<boolean>} true si modifié, false sinon.
 */
export async function updateService(id_service, nom_service, description, tarif) {
  const [result] = await pool.query(`
    UPDATE services
    SET nom_service = ?, description = ?, tarif = ?
    WHERE id_service = ?
  `, [nom_service, description ?? null, tarif, id_service])

  return result.affectedRows > 0
}

/**
 * Supprime un service.
 * @param {number} id_service Identifiant du service.
 * @returns {Promise<boolean>} true si supprimé, false sinon.
 */
export async function deleteService(id_service) {
  const [result] = await pool.query(`
    DELETE FROM services
    WHERE id_service = ?
  `, [id_service])

  return result.affectedRows > 0
}
