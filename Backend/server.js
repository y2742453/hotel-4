// Chargement de la configuration
import "dotenv/config";

// Importations générales
import express, { json } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import session from "express-session";
import memorystore from "memorystore";
import passport from "passport";
import { pool } from "./db/db.js";

// Import configuration Passport
import "./auth.js";

// Import modèles
import {
  addUtilisateur,
  getUsers,
  updateUser,
  updateUserActif,
  deleteUser,
} from "./modele/user.js";
import {
  addReservation,
  getReservationsBySalle,
  getReservationById,
  deleteReservation,
} from "./modele/reservation.js";
import {
  getSalles,
  getSalleById,
  createSalle,
  updateSalle,
  deleteSalle,
  getAllSalles,
} from "./modele/salle.js";
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "./modele/service.js";
import { createEvenement, getAllEvenements } from "./modele/evenement.js";

// Import middlewares
import {
  emailEstValide,
  motDePasseEstValide,
} from "./Midlewares/validation.js";

import { allowRoles, userAuth, userNotAuth } from "./Midlewares/auth.js";

// Création du serveur
const app = express();

// Initialisation du store de session
const MemoryStore = memorystore(session);

// Middlewares globaux
app.use(helmet());
app.use(compression());
app.use(json());

// CORS : en dev, le frontend est sur un port différent → on autorise les requêtes depuis localhost:5173
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
// Configuration des sessions
app.use(
  session({
    cookie: { maxAge: 3600000 },
    name: process.env.npm_package_name,
    store: new MemoryStore({ checkPeriod: 3600000 }),
    rolling: true,
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
  }),
);

// Initialisation de Passport
app.use(passport.initialize());
app.use(passport.session());

// Fichiers statiques
app.use(express.static("public"));

// ROUTES AUTHENTIFICATION

// Inscription d'un utilisateur
const roleToId = {
  Administrateur: 1,
  Organisateur: 2,
  Coordonnateur: 3,
  Comptabilite: 4,
};

app.post(
  "/api/inscription",
  userNotAuth,
  emailEstValide,
  motDePasseEstValide,
  async (req, res, next) => {
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
      if (error && error.code === "ER_DUP_ENTRY") return res.sendStatus(409);
      console.error(error);
      next(error);
    }
  },
);

/**
 * Route de connexion
 */
app.post("/api/connexion", userNotAuth, (request, response, next) => {
  passport.authenticate("local", (error, user, info) => {
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
        message: "Connexion réussie",
        user: {
          id: user.id_user,
          email: user.email,
          id_role: user.id_role,
        },
      });
    });
  })(request, response, next);
});

app.get("/api/admin/users", userAuth, allowRoles(1), async (req, res, next) => {
  try {
    const users = await getUsers();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
});

app.post(
  "/api/admin/users",
  userAuth,
  allowRoles(1),
  emailEstValide,
  motDePasseEstValide,
  async (request, response, next) => {
    try {
      const { nom, prenom, email, motDePasse, role } = request.body;

      // par défaut Organisateur
      let id_role = 2;

      //  si un role est fourni, on le convertit
      if (role && roleToId[role]) {
        id_role = roleToId[role];
      }
      await addUtilisateur(nom, prenom, email, motDePasse, id_role);

      response.sendStatus(201);
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") return response.sendStatus(409);
      next(error);
    }
  },
);

// Déconnexion
app.post("/api/deconnexion", userAuth, (request, response, next) => {
  request.logout((err) => {
    if (err) return next(err);
    return response.sendStatus(200);
  });
});

/**
 * Route pour activer/désactiver un utilisateur
 *
 * Reçoit dans le body : { actif: 0 ou 1 }
 */
app.patch(
  "/api/admin/users/:id_user/actif",
  userAuth,
  allowRoles(1),
  async (req, res, next) => {
    try {
      const id_user = Number(req.params.id_user);
      const actif = Number(req.body.actif); // 0 ou 1
      await updateUserActif(id_user, actif);
      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  },
);

/**
 * Route pour modifier les infos d'un utilisateur (nom, prenom, email, role)
 *
 * Reçoit dans le body : { nom, prenom, email, id_role }
 */
app.patch(
  "/api/admin/users/:id_user",
  userAuth,
  allowRoles(1),
  async (req, res, next) => {
    try {
      const id_user = Number(req.params.id_user);
      const { nom, prenom, email, id_role } = req.body;

      await updateUser(id_user, { nom, prenom, email, id_role });
      res.sendStatus(200);
    } catch (e) {
      if (e && e.code === "ER_DUP_ENTRY") return res.sendStatus(409);
      next(e);
    }
  },
);
/**
 * Route pour supprimer un utilisateur
 */
app.delete(
  "/api/admin/users/:id_user",
  userAuth,
  allowRoles(1),
  async (req, res, next) => {
    try {
      const id_user = Number(req.params.id_user);

      // éviter que l'admin supprime son propre compte
      if (req.user?.id_user === id_user) {
        return res
          .status(400)
          .json({ message: "Impossible de supprimer votre propre compte." });
      }

      await deleteUser(id_user);
      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  },
);

// ROUTE DE RESERVATION

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

// Route pour obtenir les réservations d'une salle (reservations)
app.get("/api/reservation/salle/:idSalle", async (request, response) => {
  try {
    const reservations = await getReservationsBySalle(request.params.idSalle);
    response.status(200).json(reservations);
  } catch (error) {
    response.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour obtenir une reservation garce a l'id (reservations)
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

// GET toutes les salles
app.get("/api/salles", async (req, res) => {
  const salles = await getSalles();
  res.json(salles);
});

// GET salle par id
app.get("/api/salles/:id", async (req, res) => {
  const salle = await getSalleById(req.params.id);
  if (!salle) {
    return res.status(404).json({ message: "Salle introuvable" });
  }
  res.json(salle);
});

// POST ajouter salle
app.post("/api/salles", async (req, res) => {
  try {
    const id = await createSalle(
      req.body.nom_salle,
      req.body.type,
      req.body.capacite,
      req.body.equipements,
      req.body.statut
    );

    res.status(201).json({ id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// PUT modifier salle
app.put("/api/salles/:id", async (req, res) => {
  const ok = await updateSalle(
    req.params.id,
    req.body.nom_salle,
    req.body.type,
    req.body.capacite,
    req.body.equipements,
    req.body.statut
  );

  if (!ok) {
    return res.status(404).json({ message: "Salle introuvable" });
  }

  res.json({ message: "Salle modifiée" });
});

// DELETE salle
app.delete("/api/salles/:id", async (req, res) => {
  const ok = await deleteSalle(req.params.id);
  if (!ok) {
    return res.status(404).json({ message: "Salle introuvable" });
  }
  res.json({ message: "Salle supprimée" });
});

// =====================
// API - SERVICES
// =====================

// GET tous les services
app.get("/api/services", async (req, res) => {
  try {
    const services = await getServices();
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET service par id
app.get("/api/services/:id", async (req, res) => {
  try {
    const service = await getServiceById(req.params.id);
    if (!service)
      return res.status(404).json({ message: "Service introuvable" });
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// POST ajouter un service
app.post("/api/services", async (req, res) => {
  try {
    const { nom_service, description, tarif } = req.body;

    if (!nom_service || nom_service.trim().length < 2) {
      return res.status(400).json({ message: "nom_service est requis" });
    }

    const t = Number(tarif);
    if (Number.isNaN(t) || t < 0) {
      return res
        .status(400)
        .json({ message: "tarif doit être un nombre >= 0" });
    }

    const id_service = await createService(nom_service, description, t);
    res.status(201).json({ id_service });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// PUT modifier un service
app.put("/api/services/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nom_service, description, tarif } = req.body;

    const t = Number(tarif);
    if (Number.isNaN(t) || t < 0) {
      return res
        .status(400)
        .json({ message: "tarif doit être un nombre >= 0" });
    }

    const ok = await updateService(id, nom_service, description, t);
    if (!ok) return res.status(404).json({ message: "Service introuvable" });

    res.json({ message: "Service modifié" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// DELETE supprimer un service
app.delete("/api/services/:id", async (req, res) => {
  try {
    const ok = await deleteService(req.params.id);
    if (!ok) return res.status(404).json({ message: "Service introuvable" });
    res.json({ message: "Service supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// =====================
// API - EVENEMENTS
// =====================

// GET tous les événements
app.get("/api/evenements", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.id_evenement,
        e.nom_evenement,
        e.type_evenement,
        e.description,
        e.date_debut,
        e.date_fin,
        e.statut,
        e.id_salle,
        e.id_organisateur
      FROM evenements e
      ORDER BY e.date_debut DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("GET EVENEMENTS ERROR:", err.code, err.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.post("/api/evenements", async (req, res) => {
  try {
    const {
      nom_evenement,
      type_evenement,
      description,
      date_debut,
      date_fin,
      statut,
      id_salle,
      id_organisateur,
      services,
    } = req.body;

    // Validation minimale
    if (!nom_evenement || nom_evenement.trim().length < 2) {
      return res.status(400).json({ message: "nom_evenement est requis" });
    }

    if (!date_debut || !date_fin) {
      return res
        .status(400)
        .json({ message: "date_debut et date_fin sont requis" });
    }

    const idSalle = Number(id_salle);
    const idOrg = Number(id_organisateur);

    if (!Number.isInteger(idSalle) || idSalle < 1) {
      return res.status(400).json({ message: "id_salle invalide" });
    }
    if (!Number.isInteger(idOrg) || idOrg < 1) {
      return res.status(400).json({ message: "id_organisateur invalide" });
    }

    const id_evenement = await createEvenement({
      nom_evenement,
      type_evenement,
      description,
      date_debut,
      date_fin,
      statut,
      id_salle: idSalle,
      id_organisateur: idOrg,
      services: Array.isArray(services) ? services.map(Number) : [],
    });
    res.status(201).json({ id_evenement });
  } catch (err) {
    console.error("EVENT ERROR:", err.code, err.message, err.sql);

    if (err.message === "RESERVATION_CONFLICT") {
      return res
        .status(409)
        .json({ message: "Conflit : salle déjà réservée pour ce créneau" });
    }

    return res.status(500).json({
      code: err.code || "SERVER_ERROR",
      message: err.message || "Erreur serveur",
    });
  }
});

// ROUTE DE TEST PROTÉGÉE

app.get("/api/me", userAuth, (request, response) => {
  response.json(request.user);
});

// DÉMARRAGE DU SERVEUR

app.listen(process.env.PORT, () => {
  console.log("Serveur démarré :");
  console.log(`http://localhost:${process.env.PORT}`);
});
