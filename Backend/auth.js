import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { findUserByEmail,findUserById } from './modele/user.js';

/**
 * Configuration générale de la stratégie locale
 * On attend "email" et "motDePasse" depuis le client
 */
const config = {
  usernameField: 'email',
  passwordField: 'motDePasse'
};

/**
 * Stratégie d'authentification locale
 * 
 */
passport.use(
  new LocalStrategy(config, async (email, motDePasse, done) => {
    try {
      // 1 Cherche de l'utilisateur par son email
      const utilisateur = await findUserByEmail(email);

      // 2 Utilisateur inexistant
      if (!utilisateur) {
        return done(null, false, { error: 'mauvais_utilisateur' });
      }

      // 3 Compte désactivé
      if (!utilisateur.actif) {
        return done(null, false, { error: 'compte_desactive' });
      }

      // 4️ Vérification du mot de passe
      const valide = await bcrypt.compare(
        motDePasse,
        utilisateur.mot_de_passe
      );

      if (!valide) {
        return done(null, false, { error: 'mauvais_mot_de_passe' });
      }

      // 5 Succès → on retourne l'utilisateur
      return done(null, utilisateur);

    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id_user);
});

passport.deserializeUser(async (id_user, done) => {
  try {
    const user = await findUserById(id_user);
    if (!user) return done(null, false);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;