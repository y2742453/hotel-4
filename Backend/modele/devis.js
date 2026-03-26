// Backend/modele/devis.js
import { pool } from "../db/db.js";

export async function getDemandesValideesPourDevis() {
  const [rows] = await pool.query(`
    SELECT
      es.id_evenement,
      es.id_service,
      es.quantite,
      es.details,
      es.montant_estime,
      es.statut,

      e.nom_evenement,
      e.id_organisateur,

      s.nom_service,
      s.tarif,

      u.email,
      u.nom,
      u.prenom

    FROM evenement_services es
    INNER JOIN evenements e ON e.id_evenement = es.id_evenement
    INNER JOIN services s ON s.id_service = es.id_service
    INNER JOIN users u ON u.id_user = e.id_organisateur
    WHERE es.statut = 'Valide'
    ORDER BY es.id_evenement DESC, es.id_service ASC
  `);

  return rows;
}

export async function getDemandeValideePourDevis(id_evenement, id_service) {
  const [rows] = await pool.query(
    `
    SELECT
      es.id_evenement,
      es.id_service,
      es.quantite,
      es.details,
      es.montant_estime,
      es.statut,

      e.nom_evenement,
      e.id_organisateur,

      s.nom_service,
      s.tarif,

      u.email,
      u.nom,
      u.prenom

    FROM evenement_services es
    INNER JOIN evenements e ON e.id_evenement = es.id_evenement
    INNER JOIN services s ON s.id_service = es.id_service
    INNER JOIN users u ON u.id_user = e.id_organisateur
    WHERE es.id_evenement = ? AND es.id_service = ? AND es.statut = 'Valide'
    LIMIT 1
    `,
    [id_evenement, id_service]
  );

  return rows[0] || null;
}

export async function createDevis({
  id_evenement,
  id_service,
  reference,
  montant_ht,
  taxes,
  montant_ttc,
  statut = "Brouillon",
  pdf_path = null,
}) {
  const [result] = await pool.query(
    `
    INSERT INTO devis (
      id_evenement,
      id_service,
      reference,
      montant_ht,
      taxes,
      montant_ttc,
      statut,
      pdf_path
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      id_evenement,
      id_service,
      reference,
      montant_ht,
      taxes,
      montant_ttc,
      statut,
      pdf_path,
    ]
  );

  return result.insertId;
}

export async function getAllDevis() {
  const [rows] = await pool.query(`
    SELECT
      d.id_devis,
      d.id_evenement,
      d.id_service,
      d.reference,
      d.montant_ht,
      d.taxes,
      d.montant_ttc,
      d.statut,
      d.pdf_path,
      d.date_creation,
      d.date_envoi,

      e.nom_evenement,
      s.nom_service

    FROM devis d
    INNER JOIN evenements e ON e.id_evenement = d.id_evenement
    INNER JOIN services s ON s.id_service = d.id_service
    ORDER BY d.date_creation DESC
  `);

  return rows;
}

export async function getDevisById(id_devis) {
  const [rows] = await pool.query(
    `
    SELECT
      d.id_devis,
      d.reference,
      d.montant_ht,
      d.taxes,
      d.montant_ttc,
      d.statut,
      d.date_creation,

      e.nom_evenement,

      s.nom_service,
      s.tarif,

      es.quantite,
      es.details,
      es.montant_estime,

      u.nom AS nom_user,
      u.prenom AS prenom_user,
      u.email

    FROM devis d
    JOIN evenements e ON e.id_evenement = d.id_evenement
    JOIN services s ON s.id_service = d.id_service
    JOIN evenement_services es 
      ON es.id_evenement = d.id_evenement 
      AND es.id_service = d.id_service
    JOIN users u ON u.id_user = e.id_organisateur

    WHERE d.id_devis = ?
    LIMIT 1
    `,
    [id_devis]
  );

  return rows[0] || null;
}
export async function updateDevisPdfPath(id_devis, pdf_path) {
  const [result] = await pool.query(
    `
    UPDATE devis
    SET pdf_path = ?
    WHERE id_devis = ?
    `,
    [pdf_path, id_devis]
  );

  return result.affectedRows > 0;
}

export async function updateDevisStatut(id_devis, statut) {
  const [result] = await pool.query(
    `
    UPDATE devis
    SET statut = ?
    WHERE id_devis = ?
    `,
    [statut, id_devis]
  );

  return result.affectedRows > 0;
}

export async function updateDevisDateEnvoi(id_devis) {
  const [result] = await pool.query(
    `
    UPDATE devis
    SET date_envoi = NOW()
    WHERE id_devis = ?
    `,
    [id_devis]
  );

  return result.affectedRows > 0;
}

export async function deleteDevis(id_devis) {
  const [result] = await pool.query(
    `
    DELETE FROM devis
    WHERE id_devis = ?
    `,
    [id_devis]
  );

  return result.affectedRows > 0;
}

