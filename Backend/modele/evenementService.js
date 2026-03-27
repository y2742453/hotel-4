import { pool } from "../db/db.js";

/**
 * Crée une demande de service pour un événement.
 * Fonction générique : restauration, audiovisuel, sécurité, etc.
 * @param {Object} data
 * @param {number} data.id_evenement
 * @param {number} data.id_service
 * @param {Object|string} data.details
 * @param {number} [data.quantite=1]
 * @param {number} [data.montant_estime=0]
 * @returns {Promise<boolean>}
 */
export async function createServiceRequest({
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
 * Récupère une demande de service d'un événement.
 * @param {number} id_evenement
 * @param {number} id_service
 * @returns {Promise<Object|null>}
 */
export async function getServiceRequestByEvent(id_evenement, id_service) {
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
 * Met à jour une demande de service d'un événement.
 * @param {number} id_evenement
 * @param {number} id_service
 * @param {Object} data
 * @param {Object|string} data.details
 * @param {number} [data.quantite=1]
 * @param {number} [data.montant_estime=0]
 * @returns {Promise<boolean>}
 */
export async function updateServiceRequest(
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
 * Vérifie si une demande de service existe déjà.
 * @param {number} id_evenement
 * @param {number} id_service
 * @returns {Promise<boolean>}
 */
export async function serviceRequestExists(id_evenement, id_service) {
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

/**
 * Parse une chaîne JSON en objet, ou retourne la valeur d'origine si invalide.
 * @param {string} value
 * @returns {Object|string}
 */
function safeParseJSON(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * 
 * @returns
 */
export async function getAllServiceRequests() {
  const [rows] = await pool.query(
    `
    SELECT
      es.id_evenement,
      es.id_service,
      s.nom_service,
      e.nom_evenement,
      es.details,
      es.quantite,
      es.montant_estime,
      es.statut,
      es.date_demande
    FROM evenement_services es
    JOIN services s ON s.id_service = es.id_service
    JOIN evenements e ON e.id_evenement = es.id_evenement
    ORDER BY es.date_demande DESC
    `
  );

  return rows.map((row) => ({
    ...row,
    details: row.details ? safeParseJSON(row.details) : null,
  }));
}



export async function getAllServiceRequestsByEvent(id_evenement) {
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
    WHERE es.id_evenement = ?
    ORDER BY es.date_demande DESC
    `,
    [id_evenement]  );

  return rows.map((row) => ({
    ...row,
    details: row.details ? safeParseJSON(row.details) : null,
  }));
}

export async function getPendingServiceRequests() {
  const [rows] = await pool.query(
    `
    SELECT
      es.id_evenement,
      es.id_service,
      s.nom_service,
      e.nom_evenement,
      es.details,
      es.quantite,
      es.montant_estime,
      es.statut,
      es.date_demande
    FROM evenement_services es
    JOIN services s ON s.id_service = es.id_service
    JOIN evenements e ON e.id_evenement = es.id_evenement
    WHERE es.statut = 'Demande'
    ORDER BY es.date_demande DESC
    `
  );

  return rows.map((row) => ({
    ...row,
    details: row.details ? safeParseJSON(row.details) : null,
  }));
}

/**
 * Met à jour le statut d'une demande de service.
 * @param {number} id_evenement
 * @param {number} id_service
 * @param {string} statut
 * @returns {Promise<boolean>}
 */
export async function updateServiceRequestStatus(id_evenement, id_service, statut) {
  const [result] = await pool.query(
    `
      UPDATE evenement_services
      SET statut = ?
      WHERE id_evenement = ? AND id_service = ?
    `,
    [statut, id_evenement, id_service]
  );

  return result.affectedRows > 0;
}