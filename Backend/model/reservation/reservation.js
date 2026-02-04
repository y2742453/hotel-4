// Ici je ne teste pas avec la base de données mais c'est le meme concept
import { db } from '../db/db.js';

/**
 * Vérifie s'il y a un conflit de réservation pour une salle
 * @param {number} idSalle 
 * @param {string} dateDebut 
 * @param {string} dateFin 
 * @param {number} idReservationExclue 
 * @returns true si conflit existe
 */
export async function hasConflict(idSalle, dateDebut, dateFin, idReservationExclue = null) {
    const query = `
        SELECT COUNT(*) as count 
        FROM reservations 
        WHERE id_salle = ? 
        AND date_debut < ?
        AND date_fin > ?
        ${idReservationExclue ? 'AND id_reservation != ?' : ''}
    `;
    
    const params = idReservationExclue
        ? [idSalle, dateFin, dateDebut, idReservationExclue]
        : [idSalle, dateFin, dateDebut];
    
    const result = await db.get(query, params);
    return result.count > 0;
}

/**
 * Ajoute une réservation
 * @param {object} reservation
 */
export async function addReservation(reservation) {
    const conflict = await hasConflict(
        reservation.idSalle, 
        reservation.dateDebut, 
        reservation.dateFin
    );
    
    if (conflict) {
        throw new Error('RESERVATION_CONFLICT');
    }
    
    const result = await db.run(
        `INSERT INTO reservations(id_salle, id_evenement, date_debut, date_fin) 
         VALUES(?, ?, ?, ?)`,
        [reservation.idSalle, reservation.idEvenement, reservation.dateDebut, reservation.dateFin]
    );
    
    return result.lastID;
}

export async function updateReservation(idReservation, updatedReservation) {
    const conflict = await hasConflict(
        updatedReservation.idSalle,
        updatedReservation.dateDebut,
        updatedReservation.dateFin,
        idReservation // Id de la salle actuelle pour ne pas creer les conflits avec lui meme
    );

    if (conflict) {
        throw new Error('RESERVATION_CONFLICT');
    }

    await db.run(
        `UPDATE reservations
         SET id_salle = ?, id_evenement = ?, date_debut = ?, date_fin = ?
         WHERE id_reservation = ?`,
        [
            updatedReservation.idSalle,
            updatedReservation.idEvenement,
            updatedReservation.dateDebut,
            updatedReservation.dateFin,
            idReservation
        ]
    );
}

/**
 * Récupère une réservation par ID
 */
export async function getReservationById(idReservation) {
    return await db.get(
        `SELECT * FROM reservations WHERE id_reservation = ?`,
        [idReservation]
    );
}

/**
 * Récupère toutes les réservations d'une salle
 */
export async function getReservationsBySalle(idSalle) {
    return await db.all(
        `SELECT r.*, e.nom_evenement 
         FROM reservations r
         JOIN evenements e ON r.id_evenement = e.id_evenement
         WHERE r.id_salle = ?
         ORDER BY r.date_debut`,
        [idSalle]
    );
}