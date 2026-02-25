// Chargement du fichier de configuration
import "dotenv/config";

// Importations générales du projet
import express, { json } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import {
  addReservation,
  getReservationsBySalle,
  getReservationById,
  deleteReservation,
} from "./model/reservation/reservation.js";
import { getAllSalles } from "./model/salle/salle.js";
import { getAllEvenements } from "./model/evenement/evenement.js";

// Création du serveur
const app = express();

// Ajout des middlewares
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(json());
app.use(express.static("public"));

// Programmation des routes
// Route pour créer une réservation
app.post("/api/reservation", async (request, response) => {
  try {
    const idReservation = await addReservation(request.body);
    response.status(201).json({ idReservation }); //Logique pour pouvoir implementer les reservations dans le frontend
  } catch (error) {
    if (error.message === "RESERVATION_CONFLICT") {
      response.status(409).json({ error: "Conflit de réservation" });
    } else if (error.message === "SALLE_INDISPONIBLE") {
      response.status(400).json({ error: "Salle indisponible" });
    } else {
      response.status(500).json({ error: "Erreur serveur" });
    }
  }
});

// Route pour supprimer une reservation
app.delete("/api/reservation/:id", async (request, response) => {
  try {
    const deleted = await deleteReservation(request.params.id);

    if (!deleted) {
      return response.status(404).json({ error: "Réservation introuvable" });
    }

    response.status(204).json({ message: "Réservation supprimé avec succés" });
  } catch (error) {
    response.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour obtenir la liste des salles
app.get("/api/salles", async (request, response) => {
  try {
    const salles = await getAllSalles();
    response.status(200).json(salles);
  } catch (error) {
    response.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour obtenir la liste des evenements
app.get("/api/evenements", async (request, response) => {
  try {
    const evenements = await getAllEvenements();
    response.status(200).json(evenements);
  } catch (error) {
    response.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour obtenir les réservations d'une salle
app.get("/api/reservation/salle/:idSalle", async (request, response) => {
  try {
    const reservations = await getReservationsBySalle(request.params.idSalle);
    response.status(200).json(reservations);
  } catch (error) {
    response.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour obtenir une reservation garce a l'id
app.get("/api/reservation/:id", async (request, response) => {
  try {
    const reservation = await getReservationById(request.params.id);

    if (!reservation) {
      return response.status(404).json({ error: "Réservation introuvable" });
    }

    response.status(200).json(reservation);
  } catch (error) {
    response.status(500).json({ error: "Erreur serveur" });
  }
});

// Démarrage du serveur
app.listen(process.env.PORT);
console.log("Serveur démarré:");
console.log("http://localhost:" + process.env.PORT);
