import db from "../db/db.js";

/**
 * Vérifie s'il y a un conflit de réservation
 * @param {number} idSalle
 * @param {} dateDebut
 * @param {*} dateFin
 * @param {*} idReservationExclue
 * @returns
 */
export async function hasConflict(
  idSalle,
  dateDebut,
  dateFin,
  idReservationExclue = null,
) {
  let query = `
    SELECT COUNT(*) AS count
    FROM reservations
    WHERE id_salle = ?
      AND date_debut < ?
      AND date_fin > ?
  `;

  const params = [idSalle, dateFin, dateDebut];

  if (idReservationExclue) {
    query += " AND id_reservation != ?";
    params.push(idReservationExclue);
  }

  const [rows] = await db.execute(query, params);
  return rows[0].count > 0;
}

/**
 * Ajoute une réservation
 */
export async function addReservation(reservation) {
  const conflict = await hasConflict(
    reservation.idSalle,
    reservation.dateDebut,
    reservation.dateFin,
  );

  if (conflict) {
    throw new Error("RESERVATION_CONFLICT");
  }

  const [result] = await db.execute(
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
 * Met à jour une réservation
 */
export async function updateReservation(idReservation, reservation) {
  const conflict = await hasConflict(
    reservation.idSalle,
    reservation.dateDebut,
    reservation.dateFin,
    idReservation,
  );

  if (conflict) {
    throw new Error("RESERVATION_CONFLICT");
  }

  const [result] = await db.execute(
    `UPDATE reservations
     SET id_salle = ?, id_evenement = ?, date_debut = ?, date_fin = ?
     WHERE id_reservation = ?`,
    [
      reservation.idSalle,
      reservation.idEvenement,
      reservation.dateDebut,
      reservation.dateFin,
      idReservation,
    ],
  );

  return result.affectedRows > 0;
}

/**
 * Supprime une réservation
 */
export async function deleteReservation(idReservation) {
  const [result] = await db.execute(
    `DELETE FROM reservations WHERE id_reservation = ?`,
    [idReservation],
  );

  return result.affectedRows > 0;
}

/**
 * Récupère une réservation par ID
 */
export async function getReservationById(idReservation) {
  const [rows] = await db.execute(
    `SELECT * FROM reservations WHERE id_reservation = ?`,
    [idReservation],
  );

  return rows[0] || null;
}

/**
 * Récupère toutes les réservations d'une salle
 */
export async function getReservationsBySalle(idSalle) {
  const [rows] = await db.execute(
    `SELECT r.*, e.nom_evenement
     FROM reservations r
     JOIN evenements e ON r.id_evenement = e.id_evenement
     WHERE r.id_salle = ?
     ORDER BY r.date_debut`,
    [idSalle],
  );

  return rows;
}
