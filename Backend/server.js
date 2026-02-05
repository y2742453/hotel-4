// Chargement de la configuration
import 'dotenv/config';

// Importations générales
import express, { json } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import session from 'express-session';
import memorystore from 'memorystore';
import passport from 'passport';

// Import configuration Passport
import './auth.js';

// Import modèles
import { addUtilisateur } from './modele/user.js';

// Import middlewares
import {
  emailEstValide,
  motDePasseEstValide
} from './Midlewares/validation.js';

import {
  userAuth,
  userNotAuth
} from './Midlewares/auth.js';

// Création du serveur
const app = express();

// Initialisation du store de session
const MemoryStore = memorystore(session);

// Middlewares globaux
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(json());

// Configuration des sessions
app.use(session({
  cookie: { maxAge: 3600000 },
  name: process.env.npm_package_name,
  store: new MemoryStore({ checkPeriod: 3600000 }),
  rolling: true,
  resave: false,
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET
}));

// Initialisation de Passport
app.use(passport.initialize());
app.use(passport.session());

// Fichiers statiques
app.use(express.static('public'));


// =======================
// ROUTES AUTHENTIFICATION
// =======================

// Inscription d'un utilisateur
app.post(
  '/api/inscription',
  userNotAuth,
  emailEstValide,
  motDePasseEstValide,
  async (request, response, next) => {
    try {
      const { nom, prenom, email, motDePasse, role } = request.body;

      await addUtilisateur(
        nom,
        prenom,
        email,
        motDePasse,
        role
      );

      response.sendStatus(201);

    } catch (error) {
      // Conflit (email déjà utilisé)
      if (error.code === 'ER_DUP_ENTRY') {
        response.sendStatus(409);
      } else {
        console.error(error);
        next(error);
      }
    }
  }
);

// 🔑 Connexion
app.post(
  '/api/connexion',
  userNotAuth,
  emailEstValide,
  motDePasseEstValide,
  (request, response, next) => {
    passport.authenticate('local', (error, user, info) => {
      if (error) {
        return next(error);
      }

      if (!user) {
        return response.status(401).json(info);
      }

      request.logIn(user, (error) => {
        if (error) {
          return next(error);
        }

        response.status(200).json({
          message: 'Connexion réussie',
          user: {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            role: user.role
          }
        });
      });
    })(request, response, next);
  }
);

// Déconnexion
app.post(
  '/api/deconnexion',
  userAuth,
  (request, response, next) => {
    request.logOut((error) => {
      if (error) {
        next(error);
      } else {
        response.status(200).end();
      }
    });
  }
);

// =======================
// ROUTE DE TEST PROTÉGÉE
// =======================

app.get('/api/me', userAuth, (request, response) => {
  response.json(request.user);
});

// =======================
// DÉMARRAGE DU SERVEUR
// =======================

app.listen(process.env.PORT, () => {
  console.log('Serveur démarré :');
  console.log(`http://localhost:${process.env.PORT}`);
});
