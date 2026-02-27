// Backend/modele/user.js
import { pool } from "../db/db.js";
import bcrypt from "bcrypt";

//  Trouver un user par email (pour passport)
export const findUserByEmail = async (email) => {
  try {
    const sql = `
    SELECT id_user, nom, prenom, email, mot_de_passe, actif, id_role, date_creation
    FROM users
    WHERE email = ?
    LIMIT 1
  `;
    const [rows] = await pool.execute(sql, [email]);
    return rows[0];
  } catch (error) {
    console.error(
      "Erreur lors de la recherche d'utilisateur par email:",
      error,
    );
    throw error;
  }
};
//  Trouver un user par ID (pour deserializeUser)
export const findUserById = async (id_user) => {
  const sql = `
    SELECT id_user, nom, prenom, email, actif, id_role, date_creation
    FROM users
    WHERE id_user = ?
    LIMIT 1
  `;
  const [rows] = await pool.execute(sql, [id_user]);
  return rows[0];
};

//  Liste des utilisateurs avec le nom du rôle
export const getUsers = async () => {
  const sql = `
    SELECT 
      u.id_user,
      u.nom,
      u.prenom,
      u.email,
      u.actif,
      u.id_role,
      r.nom_role AS role,
      u.date_creation
    FROM users u
    LEFT JOIN roles r ON r.id_role = u.id_role
    ORDER BY u.date_creation DESC
  `;

  const [rows] = await pool.execute(sql);
  return rows;
};

//  Ajouter utilisateur (id_role par défaut = 2)
export async function addUtilisateur(
  nom,
  prenom,
  email,
  motDePasse,
  id_role = 2,
) {
  const motDePasseEncrypte = await bcrypt.hash(motDePasse, 10);

  // IMPORTANT : ta table a id_role, pas "role"
  // IMPORTANT : date_creation -> on laisse la DB gérer si DEFAULT CURRENT_TIMESTAMP existe
  const sql = `
    INSERT INTO users (nom, prenom, email, mot_de_passe, actif, id_role)
    VALUES (?, ?, ?, ?, 1, ?)
  `;

  const [result] = await pool.execute(sql, [
    nom,
    prenom,
    email,
    motDePasseEncrypte,
    id_role,
  ]);

  return result.insertId;
}

//  Activer/désactiver utilisateur

export async function updateUserActif(id_user, actif) {
  const sql = `
    UPDATE users
    SET actif = ?
    WHERE id_user = ?
  `;
  const [result] = await pool.execute(sql, [actif, id_user]);
  return result.affectedRows; // 1 si OK, 0 si user introuvable
}

export async function updateUser(id_user, { nom, prenom, email, id_role }) {
  await pool.execute(
    `UPDATE users 
     SET nom=?, prenom=?, email=?, id_role=?
     WHERE id_user=?`,
    [nom, prenom, email, id_role, id_user],
  );
}

export async function deleteUser(id_user) {
  await pool.execute(`DELETE FROM users WHERE id_user=?`, [id_user]);
}
