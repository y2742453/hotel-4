import { pool } from "../db/db.js";

/**
 * Créer une facture
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
 * Récupérer une facture par ID
 */
export async function getFactureById(id_facture) {
  const [rows] = await pool.execute(
    `SELECT * FROM factures WHERE id_facture = ?`,
    [id_facture],
  );

  return rows[0] || null;
}

/**
 * Récupérer toutes les factures
 */
export async function getAllFactures() {
  const [rows] = await pool.execute(`SELECT * FROM factures`);
  return rows;
}

/**
 * Sauvegarder session Stripe
 */
export async function saveStripeSession(id_facture, sessionId) {
  await pool.execute(
    `UPDATE factures SET stripe_session_id = ? WHERE id_facture = ?`,
    [sessionId, id_facture],
  );
}

/**
 * Marquer facture payée
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
 * Ajouter paiement
 */
export async function createPaiement({ id_facture, montant, paymentIntent }) {
  await pool.execute(
    `INSERT INTO paiements (id_facture, montant, stripe_payment_intent)
     VALUES (?, ?, ?)`,
    [id_facture, montant, paymentIntent],
  );
}

/**
 *
 * @param {*} sessionId
 * @returns
 */
export async function getFactureByStripeSession(sessionId) {
  const [rows] = await pool.execute(
    `SELECT * FROM factures WHERE stripe_session_id = ?`,
    [sessionId],
  );

  return rows[0] || null;
}
