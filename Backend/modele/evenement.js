import { pool } from "../db/db.js";

/**
 *
 * @param {number} id_salle Identifiant de la salle.
 * @param {string} date_debut Date/heure de début (format DATETIME).
 * @param {string} date_fin Date/heure de fin (format DATETIME).
 * @returns {Promise<boolean>} true si conflit détecté, false sinon.
 */
export async function hasReservationConflict(id_salle, date_debut, date_fin) {
  const [rows] = await pool.query(
    `
    SELECT COUNT(*) AS nb
    FROM reservations
    WHERE id_salle = ?
      AND (date_debut < ? AND date_fin > ?)
    `,
    [id_salle, date_fin, date_debut],
  );

  return rows[0].nb > 0;
}

/**
 *
 * @param {Object} data Données de l'événement.
 * @param {string} data.nom_evenement Nom de l'événement.
 * @param {string} [data.type_evenement] Type de l'événement.
 * @param {string} [data.description] Description de l'événement.
 * @param {string} data.date_debut Date/heure de début.
 * @param {string} data.date_fin Date/heure de fin.
 * @param {string} [data.statut] Statut (ex : Brouillon, Confirmé).
 * @param {number} data.id_salle Identifiant de la salle.
 * @param {number} data.id_organisateur Identifiant de l'organisateur.
 * @param {Array<number>} [data.services] Liste des identifiants de services.
 *
 * @returns {Promise<number>} Identifiant de l'événement créé.
 */
export async function createEvenement(data) {
  const {
    nom_evenement,
    type_evenement,
    description,
    date_debut,
    date_fin,
    statut = "Brouillon",
    id_salle,
    id_organisateur,
    services = [],
  } = data;

  // Vérification d'un éventuel conflit de réservation
  const conflict = await hasReservationConflict(id_salle, date_debut, date_fin);

  if (conflict) {
    const err = new Error("RESERVATION_CONFLICT");
    throw err;
  }

  // Démarrage de la transaction
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Insertion de l'événement
    const [evResult] = await conn.query(
      `
      INSERT INTO evenements
        (nom_evenement, type_evenement, description, date_debut, date_fin, statut, id_salle, id_organisateur)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        nom_evenement,
        type_evenement ?? null,
        description ?? null,
        date_debut,
        date_fin,
        statut,
        id_salle,
        id_organisateur,
      ],
    );

    const id_evenement = evResult.insertId;

    // Insertion de la réservation associée
    await conn.query(
      `
      INSERT INTO reservations (id_salle, id_evenement, date_debut, date_fin)
      VALUES (?, ?, ?, ?)
      `,
      [id_salle, id_evenement, date_debut, date_fin],
    );

    // Association des services (si fournis)
    for (const id_service of services) {
      await conn.query(
        `
        INSERT INTO evenement_services (id_evenement, id_service, statut)
        VALUES (?, ?, 'Demande')
        `,
        [id_evenement, id_service],
      );
    }

    await conn.commit();
    return id_evenement;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function getAllEvenements() {
  const [rows] = await pool.query("SELECT * FROM evenements");
  return rows;
}
