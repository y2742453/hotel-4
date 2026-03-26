import { pool } from "../db/db.js";

/**
 * Vérifie s'il y a un conflit de réservation
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
 * Création d’un événement + réservation + services
 */
export async function createEvenement(data) {
  const {
    nom_evenement,
    type_evenement,
    description,
    date_debut,
    date_fin,
    statut,
    id_salle,
    id_organisateur,
    services = [],
  } = data;

  // Si aucun statut n'est fourni ou si statut = 'Brouillon', on force à 'Prévu'
  const statutFinal = !statut || statut === 'Brouillon' ? 'Prévu' : statut;

  // 1. Vérifier conflit
  const conflict = await hasReservationConflict(
    id_salle,
    date_debut,
    date_fin
  );

  if (conflict) {
    throw new Error("RESERVATION_CONFLICT");
  }

  // 2. Transaction
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 3. Créer événement
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
        statutFinal,
        id_salle,
        id_organisateur,
      ],
    );

    const id_evenement = evResult.insertId;

    // 4. Réservation
    await conn.query(
      `
      INSERT INTO reservations (id_salle, id_evenement, date_debut, date_fin)
      VALUES (?, ?, ?, ?)
      `,
      [id_salle, id_evenement, date_debut, date_fin],
    );

    // 5. Ajouter services
   // AJOUT SERVICES
if (services && services.length > 0) {
  console.log("INSERT SERVICES:", services); // DEBUG

  for (const id_service of services) {
    await conn.query(
      `
      INSERT INTO evenement_services (id_evenement, id_service, statut)
      VALUES (?, ?, 'Demande')
      `,
      [id_evenement, id_service]
    );
  }
}

    // 6. Commit
    await conn.commit();

    return id_evenement;

  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/**
 * Récupérer tous les événements
 */
export async function getAllEvenements() {
  const [rows] = await pool.query("SELECT * FROM evenements");
  return rows;
}