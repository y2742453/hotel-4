// Chargement du fichier de configuration
import 'dotenv/config'

// Importations générales du projet
import express, { json } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression';
import session from 'express-session'
import memorystore from 'memorystore'
import passport from 'passport'
import { Strategy } from 'passport-local'
import { findUserByEmail,addUtilisateur } from './modele/user.js'


// Configuration de la session
const MemoryStore = memorystore(session)
const sessionMiddleware = session({
  cookie: { maxAge: 86400000 },
  store: new MemoryStore({ checkPeriod: 86400000 }),
  secret: process.env.SESSION_SECRET,
  resave: false, 
 saveUninitialized: false
})
// Création du serveur
const app = express();

// Ajout des middlewares
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(json());
app.use(express.static('public'));

// Programmation des routes

// Démarrage du serveur
app.listen(process.env.PORT);
console.log('Serveur démarré:');
console.log('http://localhost:' + process.env.PORT);