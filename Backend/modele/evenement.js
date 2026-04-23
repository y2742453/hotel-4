import { pool } from "../db/db.js";

/**
 * Vérifie s'il y a un conflit de réservation
 */
export async function hasReservationConflict(id_salle, date_debut, date_fin) {
  const [rows] = await pool.query(
    `
    SELECT COUNT(*) AS nb
    FROM evenements
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
  } = data;

  const services = data.services || [];

  const statutFinal = !statut || statut === "Brouillon" ? "Prévu" : statut;

  if (new Date(date_fin) <= new Date(date_debut)) {
    throw new Error("INVALID_DATES");
  }

  const start = new Date(date_debut);
  const end = new Date(date_fin);

  if (start.getHours() < 7 || end.getHours() > 22) {
    throw new Error("HOURS_OUT_OF_RANGE");
  }

  // 🔥 1. Vérifier conflit
  const conflict = await hasReservationConflict(id_salle, date_debut, date_fin);

  if (conflict) {
    throw new Error("RESERVATION_CONFLICT");
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

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

    await conn.query(
      `
      INSERT INTO reservations (id_salle, id_evenement, date_debut, date_fin)
      VALUES (?, ?, ?, ?)
      `,
      [id_salle, id_evenement, date_debut, date_fin],
    );

    if (services && services.length > 0) {
      for (const id_service of services) {
        await conn.query(
          `
          INSERT INTO evenement_services (id_evenement, id_service, statut)
          VALUES (?, ?, 'Demande')
          `,
          [id_evenement, id_service],
        );
      }
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

/**
 * Récupérer tous les événements
 */
export async function getAllFromEvenements() {
  const [rows] = await pool.query("SELECT * FROM evenements");
  return rows;
}

export async function getEvenementById(id_evenement) {
  const [rows] = await pool.execute(
    "SELECT * FROM evenements WHERE id_evenement = ?",
    [id_evenement],
  );

  return rows[0] || null;
}

/**
 * Infos organisateur + nom événement + email
 */
export async function getEvenementInfoForNotification(id_evenement) {
  const [rows] = await pool.execute(
    `
    SELECT 
      e.id_evenement,
      e.id_organisateur,
      e.nom_evenement,
      e.statut,
      u.email
    FROM evenements e
    JOIN users u ON u.id_user = e.id_organisateur
    WHERE e.id_evenement = ?
    LIMIT 1
    `,
    [id_evenement],
  );

  return rows[0] || null;
}

/**
 * Infos organisateur + nom événement + nom service + email
 */
export async function getEvenementServiceInfoForNotification(
  id_evenement,
  id_service,
) {
  const [rows] = await pool.execute(
    `
    SELECT 
      e.id_evenement,
      e.id_organisateur,
      e.nom_evenement,
      s.id_service,
      s.nom_service,
      u.email
    FROM evenements e
    JOIN users u ON u.id_user = e.id_organisateur
    JOIN services s ON s.id_service = ?
    WHERE e.id_evenement = ?
    LIMIT 1
    `,
    [id_service, id_evenement],
  );

  return rows[0] || null;
}
export async function getAllEvenements() {
  // Auto-update: marquer comme Terminé les événements dont la date_fin est passée
  // et dont le statut n'est pas déjà Annulé ou Terminé
  await pool.query(
    `
    UPDATE evenements
    SET statut = 'Terminé'
    WHERE date_fin < NOW()
      AND statut NOT IN ('Annulé', 'Terminé')
    `
  );

  const [rows] = await pool.query("SELECT * FROM evenements");
  return rows;
}
