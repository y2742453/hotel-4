import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { findUserByEmail } from './modele/user.js';

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

passport.serializeUser((utilisateur, done) => {
  done(null, utilisateur.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await findUserById(id); // à créer si besoin
    done(null, user);
  } catch (err) {
    done(err);
  }
});
export default passport;