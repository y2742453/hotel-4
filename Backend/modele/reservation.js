import { pool } from "../db/db.js";

/**
 * Vérifie s'il y a un conflit de réservation
 * @param {number} idSalle - L'identifiant de la salle
 * @param {string} dateDebut - La date de début de la réservation (format YYYY-MM-DD HH:MM).
 * @param {string} dateFin - La date de fin de la réservation (format YYYY-MM-DD HH:MM).
 * @param {number} idReservationExclue - Optionnel : ID d'une réservation à exclure (utile pour les mises à jour).
 * @returns {Promise<boolean>} Retourne `true` s'il y a conflit de réservation, `false` sinon.
 */
export async function hasConflict(idSalle, dateDebut, dateFin) {
  let query = `
    SELECT COUNT(*) AS count
    FROM reservations
    WHERE id_salle = ?
      AND date_debut < ?
      AND date_fin > ?
  `;

  const params = [idSalle, dateFin, dateDebut];

  const [rows] = await pool.execute(query, params);
  return rows[0].count > 0;
}

/**
 * Ajoute une réservation
 * @param {Object} reservation  Les données de la réservation.
 * @returns {Promise<number>} L'ID de la réservation créée.
 */
export async function addReservation(reservation) {
  const [salleRows] = await pool.query(
    "SELECT statut FROM salles WHERE id_salle = ?",
    [reservation.idSalle],
  );

  if (salleRows[0].statut.toLowerCase() !== "disponible") {
    throw new Error("SALLE_INDISPONIBLE");
  }

  const conflict = await hasConflict(
    reservation.idSalle,
    reservation.dateDebut,
    reservation.dateFin,
  );

  if (conflict) {
    throw new Error("RESERVATION_CONFLICT");
  }

  const [result] = await pool.execute(
    `INSERT INTO reservations (id_salle, id_evenement, date_debut, date_fin)
     VALUES (?, ?, ?, ?)`,
    [
      reservation.idSalle,
      reservation.idEvenement,
      reservation.dateDebut,
      reservation.dateFin,
    ],
  );

  return result.insertId;
}

/**
 * Supprime une réservation
 * @param {number} idReservation
 * @returns {Promise<boolean>} `true` si la suppression a réussi, `false` sinon.
 */
export async function deleteReservation(idReservation) {
  const [result] = await pool.execute(
    `DELETE FROM reservations WHERE id_reservation = ?`,
    [idReservation],
  );

  return result.affectedRows > 0;
}

/**
 * Récupère une réservation par id
 * @param {number} idReservation L'Id de la réservation.
 * @returns {Promise<Object|null>} L'objet réservation si trouvé, sinon `null`.
 */
export async function getReservationById(idReservation) {
  const [rows] = await pool.execute(
    `SELECT * FROM reservations WHERE id_reservation = ?`,
    [idReservation],
  );

  return rows[0] || null;
}

/**
 * Récupère toutes les réservations d'une salle
 * @param {number} idSalle L'Id de la salle.
 * @returns {Promise<Array<Object>>} Un tableau de réservations.
 */
export async function getReservationsBySalle(idSalle) {
  const [rows] = await pool.execute(
    `SELECT 
        r.*, 
        e.nom_evenement,
        e.description
     FROM reservations r
     JOIN evenements e ON r.id_evenement = e.id_evenement
     WHERE r.id_salle = ?
     ORDER BY r.date_debut`,
    [idSalle],
  );

  return rows;
}
