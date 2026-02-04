// Chargement du fichier de configuration
import 'dotenv/config'

// Importations générales du projet
import express, { json } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression';
import { addReservation, getReservationsBySalle } from './model/reservation/reservation.js';

// Création du serveur
const app = express();

// Ajout des middlewares
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(json());
app.use(express.static('public'));

// Programmation des routes

// Route pour créer une réservation
app.post('/api/reservation', async (request, response) => {
    try {
        const idReservation = await addReservation(request.body);
        response.status(201).json({ idReservation }); //Logique pour pouvoir implementer les reservations dans le frontend
    } catch (error) {
        if (error.message === 'RESERVATION_CONFLICT') {
            response.status(409).json({ error: 'Conflit de réservation' });
        } else {
            response.status(500).json({ error: 'Erreur serveur' });
        }
    }
});

// Route pour obtenir les réservations d'une salle
app.get('/api/reservations/salle/:idSalle', async (request, response) => {
    try {
        const reservations = await getReservationsBySalle(request.params.idSalle);
        response.status(200).json(reservations);
    }catch (error) {
        response.status(500).json({ error: 'Erreur serveur' });
    }
});

// Démarrage du serveur
app.listen(process.env.PORT);
console.log('Serveur démarré:');
console.log('http://localhost:' + process.env.PORT);