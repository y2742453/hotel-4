import db from '../db/db.js';
import bcrypt from 'bcrypt';

/**
 * recherche d'un utilisateur par son email
 * @param {*} email 
 * @returns 
 */
export const findUserByEmail = async (email) => {
  const sql = `
    SELECT 
      id_user,
      nom,
      prenom,
      email,
      mot_de_passe,
      id_role,
      actif
    FROM users
    WHERE email = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [email]);
  return rows[0];
}

/**
 * recherche d'un utilisateur par son id
 * @param {*} id_user 
 * @returns 
 */
export const findUserById = async (id_user) => {
  const sql = `
    SELECT
      id_user, nom, prenom, email, mot_de_passe, id_role, actif
    FROM users
    WHERE id_user = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [id_user]);
  return rows[0];
};

/**
 * Ajouter un utilisateur dans la base de données
 * @param {*} nom 
 * @param {*} prenom 
 * @param {*} email 
 * @param {*} motDePasse 
 * @param {*} id_role 
 * @returns l'id de l'utilisateur créé
 */
export async function addUtilisateur(nom, prenom, email, motDePasse, id_role) {
  // 1 Chiffrement du mot de passe
  const motDePasseEncrypte = await bcrypt.hash(motDePasse, 10);
  const role = id_role || 2; // Par défaut, rôle utilisateur
  // 2 Requête SQL
  const sql = `
    INSERT INTO users (nom, prenom, email, mot_de_passe, id_role, actif)
    VALUES (?, ?, ?, ?, ?, 1)
  `;

  //  Exécution de la requête
  const [result] = await db.execute(sql, [
    nom,
    prenom,
    email,
    motDePasseEncrypte,
    id_role
  ]);

  //Retourne l'id de l'utilisateur créé
  return result.insertId;
}
