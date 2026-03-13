import { pool } from "../db/db.js";

/**
 * Crée une demande de service restauration pour un événement.
 * @param {Object} data
 * @param {number} data.id_evenement
 * @param {number} data.id_service
 * @param {Object|string} data.details
 * @param {number} [data.quantite=1]
 * @param {number} [data.montant_estime=0]
 * @returns {Promise<boolean>}
 */
export async function createRestaurationRequest({
  id_evenement,
  id_service,
  details,
  quantite = 1,
  montant_estime = 0,
}) {
  if (!id_evenement || !id_service) {
    throw new Error("id_evenement et id_service sont requis");
  }

  const detailsString =
    typeof details === "string" ? details : JSON.stringify(details ?? {});

  const [result] = await pool.query(
    `
    INSERT INTO evenement_services (
      id_evenement,
      id_service,
      details,
      quantite,
      montant_estime,
      statut,
      date_demande
    )
    VALUES (?, ?, ?, ?, ?, 'Demande', NOW())
    `,
    [id_evenement, id_service, detailsString, quantite, montant_estime]
  );

  return result.affectedRows > 0;
}

/**
 * Récupère la demande restauration d'un événement.
 * @param {number} id_evenement
 * @param {number} id_service
 * @returns {Promise<Object|null>}
 */
export async function getRestaurationRequestByEvent(id_evenement, id_service) {
  const [rows] = await pool.query(
    `
    SELECT
      es.id_evenement,
      es.id_service,
      s.nom_service,
      es.details,
      es.quantite,
      es.montant_estime,
      es.statut,
      es.date_demande
    FROM evenement_services es
    JOIN services s ON s.id_service = es.id_service
    WHERE es.id_evenement = ? AND es.id_service = ?
    `,
    [id_evenement, id_service]
  );

  if (!rows[0]) return null;

  const row = rows[0];

  return {
    ...row,
    details: row.details ? safeParseJSON(row.details) : null,
  };
}

/**
 * Met à jour les besoins en restauration d'un événement.
 * @param {number} id_evenement
 * @param {number} id_service
 * @param {Object} data
 * @param {Object|string} data.details
 * @param {number} [data.quantite=1]
 * @param {number} [data.montant_estime=0]
 * @returns {Promise<boolean>}
 */
export async function updateRestaurationRequest(
  id_evenement,
  id_service,
  { details, quantite = 1, montant_estime = 0 }
) {
  const detailsString =
    typeof details === "string" ? details : JSON.stringify(details ?? {});

  const [result] = await pool.query(
    `
    UPDATE evenement_services
    SET details = ?, quantite = ?, montant_estime = ?
    WHERE id_evenement = ? AND id_service = ?
    `,
    [detailsString, quantite, montant_estime, id_evenement, id_service]
  );

  return result.affectedRows > 0;
}

/**
 * Vérifie si une demande de restauration existe déjà.
 * @param {number} id_evenement
 * @param {number} id_service
 * @returns {Promise<boolean>}
 */
export async function restaurationRequestExists(id_evenement, id_service) {
  const [rows] = await pool.query(
    `
    SELECT 1
    FROM evenement_services
    WHERE id_evenement = ? AND id_service = ?
    LIMIT 1
    `,
    [id_evenement, id_service]
  );

  return rows.length > 0;
}

function safeParseJSON(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}