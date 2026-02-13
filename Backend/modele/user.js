// Backend/modele/user.js
import db from '../db/db.js';
import bcrypt from 'bcrypt';

// ✅ Trouver un user par email (pour passport)
export const findUserByEmail = async (email) => {
  const sql = `
    SELECT id_user, nom, prenom, email, mot_de_passe, actif, id_role, date_creation
    FROM users
    WHERE email = ?
    LIMIT 1
  `;
  const [rows] = await db.execute(sql, [email]);
  return rows[0];
};

// ✅ Trouver un user par ID (pour deserializeUser)
export const findUserById = async (id_user) => {
  const sql = `
    SELECT id_user, nom, prenom, email, actif, id_role, date_creation
    FROM users
    WHERE id_user = ?
    LIMIT 1
  `;
  const [rows] = await db.execute(sql, [id_user]);
  return rows[0];
};

// ✅ Liste des utilisateurs avec le nom du rôle
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

  const [rows] = await db.execute(sql);
  return rows;
};

// ✅ Ajouter utilisateur (id_role par défaut = 2)
export async function addUtilisateur(nom, prenom, email, motDePasse, id_role = 2) {
  const motDePasseEncrypte = await bcrypt.hash(motDePasse, 10);

  // IMPORTANT : ta table a id_role, pas "role"
  // IMPORTANT : date_creation -> on laisse la DB gérer si DEFAULT CURRENT_TIMESTAMP existe
  const sql = `
    INSERT INTO users (nom, prenom, email, mot_de_passe, actif, id_role)
    VALUES (?, ?, ?, ?, 1, ?)
  `;

  const [result] = await db.execute(sql, [
    nom,
    prenom,
    email,
    motDePasseEncrypte,
    id_role
  ]);

  return result.insertId;
}
