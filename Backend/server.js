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


// ROUTES AUTHENTIFICATION


// Inscription d'un utilisateur
const roleToId = {
  Administrateur: 1,
  Organisateur: 2,
  Coordonnateur: 3,
  Comptabilite: 4
};

app.post('/api/inscription', userNotAuth, emailEstValide, motDePasseEstValide, async (req, res, next) => {
  try {
    const { nom, prenom, email, motDePasse, role } = req.body;

    // par défaut Organisateur
    let id_role = 2;

    //  si un role est fourni, on le convertit
    if (role && roleToId[role]) {
      id_role = roleToId[role];
    }

    await addUtilisateur(nom, prenom, email, motDePasse, id_role);

    res.sendStatus(201);
  } catch (error) {
    if (error && error.code === 'ER_DUP_ENTRY') return res.sendStatus(409);
    console.error(error);
    next(error);
  }
});

/**
 * Route de connexion
 */

app.post('/api/connexion', userNotAuth, (request, response, next) => {
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
          id: user.id_user,
          email: user.email,
          id_role: user.id_role
        }
      });
    });
  })(request, response, next);
});


// Déconnexion
app.post('/api/deconnexion', userAuth, (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
      return res.sendStatus(200);
    });
});



// ROUTE DE TEST PROTÉGÉE


app.get('/api/me', userAuth, (request, response) => {
  response.json(request.user);
});


// DÉMARRAGE DU SERVEUR

app.listen(process.env.PORT, () => {
  console.log('Serveur démarré :');
  console.log(`http://localhost:${process.env.PORT}`);
});
