import db from '../db/db.js';
import bcrypt from 'bcryptjs';
export const findUserByEmail = async (email) => {
  const sql = `
    SELECT id, nom, prenom, email, mot_de_passe, role, actif
    FROM utilisateur
    WHERE email = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [email]);
  return rows[0];
};


/**
 * Ajouter un utilisateur dans la base de données
 */
export async function addUtilisateur(nom, prenom, email, motDePasse, role) {
  // 1 Chiffrement du mot de passe
  const motDePasseEncrypte = await bcrypt.hash(motDePasse, 10);

  // 2 Requête SQL
  const sql = `
    INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, actif)
    VALUES (?, ?, ?, ?, ?, 1)
  `;

  //  Exécution de la requête
  const [result] = await db.execute(sql, [
    nom,
    prenom,
    email,
    motDePasseEncrypte,
    role
  ]);

  // 4️⃣ Retourne l'id de l'utilisateur créé
  return result.insertId;
}
