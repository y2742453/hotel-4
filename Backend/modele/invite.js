import { pool } from "../db/db.js";

/**
 * Récupère un invité par ID
 * @param {number} idInvite - l'id de l'invité
 * @returns {Promise<Object|null>} - l'invité selectionné ou null
 */
export async function getInviteById(idInvite) {
  const [rows] = await pool.execute(
    `SELECT * FROM invites WHERE id_invite = ?`,
    [idInvite],
  );

  return rows[0] || null;
}

/**
 * Récupère tous les invités d'un événement
 * @param {number} idEvenement - l'id de l'événement
 * @returns {Promise<Array<Object>>} - Les invités d'un evenement specifique
 */
export async function getInvitesByEvent(idEvenement) {
  const [rows] = await pool.execute(
    `SELECT * FROM invites WHERE id_evenement = ? ORDER BY nom, prenom`,
    [idEvenement],
  );

  return rows;
}

/**
 * Ajoute un invité
 * @param {Object} invite - Données de l'invité
 * @param {number} invite.idEvenement - ID de l'événement
 * @param {string} invite.nom - nom de l'iinvité
 * @param {string} invite.prenom - prenom de l'invité
 * @param {string} invite.email - email de l'invité
 * @param {string} [invite.statut] - 'invite' par défaut, statut de l'invité
 * @returns {Promise<number>} ID de l'invité créé
 */
export async function addInvite(invite) {
  const [result] = await pool.execute(
    `INSERT INTO invites (id_evenement, nom, prenom, email, statut)
     VALUES (?, ?, ?, ?, ?)`,
    [
      invite.id_evenement,
      invite.nom,
      invite.prenom,
      invite.email,
      invite.statut || "invite",
    ],
  );

  return result.insertId;
}

/**
 * Met à jour le statut ou les infos d'un invité
 * @param {number} idInvite - l'id de l'invité
 * @param {Object} updates - { nom?, prenom?, email?, statut? }
 * @returns {Promise<boolean>}
 */
export async function updateInvite(idInvite, updates) {
  const fields = [];
  const values = [];

  if (updates.nom) {
    fields.push("nom = ?");
    values.push(updates.nom);
  }
  if (updates.prenom) {
    fields.push("prenom = ?");
    values.push(updates.prenom);
  }
  if (updates.email) {
    fields.push("email = ?");
    values.push(updates.email);
  }
  if (updates.statut) {
    fields.push("statut = ?");
    values.push(updates.statut);
  }

  if (fields.length === 0) return false;

  values.push(idInvite);

  const [result] = await pool.execute(
    `UPDATE invites SET ${fields.join(", ")} WHERE id_invite = ?`,
    values,
  );

  return result.affectedRows > 0;
}

/**
 * Supprime un invité
 * @param {number} idInvite - l'id de l'invité
 * @returns {Promise<boolean>} true si supprimé
 */
export async function deleteInvite(idInvite) {
  const [result] = await pool.execute(
    `DELETE FROM invites WHERE id_invite = ?`,
    [idInvite],
  );

  return result.affectedRows > 0;
}
