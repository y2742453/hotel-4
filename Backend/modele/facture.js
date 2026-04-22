import { pool } from "../db/db.js";

/**
 * Crée une facture pour un événement donné.
 *
 * @param {Object} params
 * @param {number} params.id_evenement - ID de l'événement lié
 * @param {number} params.montant_total - Montant HT de la facture
 * @param {number} params.taxes - Montant des taxes
 * @returns {Promise<number>} ID de la facture créée
 */
export async function createFacture({ id_evenement, montant_total, taxes }) {
  const [result] = await pool.execute(
    `INSERT INTO factures (id_evenement, montant_total, taxes)
     VALUES (?, ?, ?)`,
    [id_evenement, montant_total, taxes],
  );

  return result.insertId;
}

/**
 * Récupère une facture par son ID avec le nom de l'événement associé.
 *
 * @param {number} id_facture
 * @returns {Promise<Object|null>} Facture ou null si inexistante
 */
export async function getFactureById(id_facture) {
  const [rows] = await pool.execute(
    `SELECT f.*, e.nom_evenement
     FROM factures f
     JOIN evenements e ON f.id_evenement = e.id_evenement
     WHERE f.id_facture = ?`,
    [id_facture],
  );

  return rows[0] || null;
}

/**
 * Récupère toutes les factures avec leur événement associé.
 *
 * @returns {Promise<Array>} Liste des factures
 */
export async function getAllFactures() {
  const [rows] = await pool.execute(`
    SELECT f.*, e.nom_evenement
    FROM factures f
    JOIN evenements e ON f.id_evenement = e.id_evenement
  `);

  return rows;
}

/**
 * Associe une session Stripe à une facture.
 *
 * @param {number} id_facture
 * @param {string} sessionId
 * @returns {Promise<void>}
 */
export async function saveStripeSession(id_facture, sessionId) {
  await pool.execute(
    `UPDATE factures SET stripe_session_id = ? WHERE id_facture = ?`,
    [sessionId, id_facture],
  );
}

/**
 * Marque une facture comme payée et enregistre le paymentIntent Stripe.
 *
 * @param {number} id_facture
 * @param {string} paymentIntent
 * @returns {Promise<void>}
 */
export async function markFacturePaid(id_facture, paymentIntent) {
  await pool.execute(
    `UPDATE factures 
     SET statut = 'paye', stripe_payment_intent = ?
     WHERE id_facture = ?`,
    [paymentIntent, id_facture],
  );
}

/**
 * Enregistre un paiement lié à une facture.
 *
 * @param {Object} params
 * @param {number} params.id_facture
 * @param {number} params.montant
 * @param {string} params.paymentIntent
 * @returns {Promise<void>}
 */
export async function createPaiement({ id_facture, montant, paymentIntent }) {
  await pool.execute(
    `INSERT INTO paiements (id_facture, montant, stripe_payment_intent)
     VALUES (?, ?, ?)`,
    [id_facture, montant, paymentIntent],
  );
}

/**
 * Récupère une facture via son ID de session Stripe.
 *
 * @param {string} sessionId
 * @returns {Promise<Object|null>}
 */
export async function getFactureByStripeSession(sessionId) {
  const [rows] = await pool.execute(
    `SELECT * FROM factures WHERE stripe_session_id = ?`,
    [sessionId],
  );

  return rows[0] || null;
}

/**
 * Récupère les détails d'une facture (salle + services validés).
 *
 * @param {number} id_evenement
 * @returns {Promise<Object>}
 */
export async function getFactureDetails(id_evenement) {
  const [salleRows] = await pool.execute(
    `SELECT s.nom_salle, s.cout
     FROM evenements e
     JOIN salles s ON e.id_salle = s.id_salle
     WHERE e.id_evenement = ?`,
    [id_evenement],
  );

  const [servicesRows] = await pool.execute(
    `SELECT s.nom_service, es.quantite, es.montant_estime
     FROM evenement_services es
     JOIN services s ON es.id_service = s.id_service
     WHERE es.id_evenement = ? AND es.statut = 'Valide'`,
    [id_evenement],
  );

  return {
    salle: salleRows[0] || null,
    services: servicesRows,
  };
}

/**
 * Calcule le montant total d'un événement (salle + services validés).
 *
 * @param {number} id_evenement
 * @returns {Promise<number>} Total HT
 */
export async function calculateEventTotal(id_evenement) {
  const [salleRows] = await pool.execute(
    `
    SELECT s.cout
    FROM evenements e
    JOIN salles s ON e.id_salle = s.id_salle
    WHERE e.id_evenement = ?
  `,
    [id_evenement],
  );

  const sallePrice = Number(salleRows[0]?.cout) || 0;

  const [serviceRows] = await pool.execute(
    `
    SELECT SUM(quantite * montant_estime) as total
    FROM evenement_services
    WHERE id_evenement = ? AND statut = 'Valide'
  `,
    [id_evenement],
  );

  const servicesTotal = Number(serviceRows[0]?.total) || 0;

  return sallePrice + servicesTotal;
}
