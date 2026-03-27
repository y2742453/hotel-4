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
import { upload } from "./Midlewares/upload.js";

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
import inviteRoutes from "./routes/invite.js";

// Import middlewares
import {
  emailEstValide,
  motDePasseEstValide,
} from "./Midlewares/validation.js";

import { allowRoles, userAuth, userNotAuth } from "./Midlewares/auth.js";

// import  des services de restauration
import {
  createServiceRequest,
  getServiceRequestByEvent,
  getAllServiceRequests,
  getPendingServiceRequests,
  getAllServiceRequestsByEvent,
  updateServiceRequest,
  updateServiceRequestStatus,
  serviceRequestExists,
} from "./modele/evenementService.js";

import {
  getDemandesValideesPourDevis,
  getDemandeValideePourDevis,
  createDevis,
  getAllDevis,
  getDevisById,
  updateDevisPdfPath,
  updateDevisStatut,
  updateDevisDateEnvoi,
  deleteDevis,
} from "./modele/devis.js";
// Création du serveur  `
const app = express();

// Initialisation du store de session
const MemoryStore = memorystore(session);

// Middlewares globaux
app.use(helmet());
app.use(compression());
app.use(json());
app.use("/uploads", express.static("uploads"));

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

// Route pour import de fichier CSV/Excel des invités
app.use("/api/invites", allowRoles(2), inviteRoutes);

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

// =====================
// API - RESERVATIONS
// =====================

// Route pour créer une réservation
app.post(
  "/api/reservation",
  userAuth,
  allowRoles(1, 2),
  async (request, response) => {
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
  },
);

// Route pour supprimer une reservation
app.delete(
  "/api/reservation/:id",
  userAuth,
  allowRoles(1, 2),
  async (request, response) => {
    try {
      const deleted = await deleteReservation(request.params.id);

      if (!deleted) {
        return response.status(404).json({ error: "Réservation introuvable" });
      }

      response
        .status(204)
        .json({ message: "Réservation supprimé avec succés" });
    } catch (error) {
      response.status(500).json({ error: "Erreur serveur" });
    }
  },
);

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
      req.body.statut,
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
    req.body.statut,
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
  // supprimer anciens services
  await pool.query("DELETE FROM evenement_services WHERE id_evenement = ?", [
    id,
  ]);

  // ajouter nouveaux
  for (const idService of req.body.services) {
    await pool.query(
      `INSERT INTO evenement_services (id_evenement, id_service, statut)
     VALUES (?, ?, 'Demande')`,
      [id, idService],
    );
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
// API - SERVICES D'UN EVENEMENT
// =====================

app.get("/api/evenements/:id/services", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [rows] = await pool.query(
      `
      SELECT s.id_service, s.nom_service, es.statut
      FROM evenement_services es
      JOIN services s ON es.id_service = s.id_service
      WHERE es.id_evenement = ?
      `,
      [id],
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
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
//Modification d'un événement
app.put("/api/evenements/:id", async (req, res) => {
  const id = req.params.id;

  const {
    nom_evenement,
    type_evenement,
    description,
    date_debut,
    date_fin,
    id_salle,
    nb_participants,
    budget,
  } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE evenements
       SET nom_evenement=?, type_evenement=?, description=?, date_debut=?, date_fin=?, id_salle=?, nb_participants=?, budget=?, updated_at=NOW()
       WHERE id_evenement=?`,
      [
        nom_evenement,
        type_evenement,
        description,
        date_debut,
        date_fin,
        id_salle,
        nb_participants,
        budget,
        id,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Événement introuvable" });
    }

    res.json({ message: "Événement modifié avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
// Confirmer evenement
app.put("/api/evenements/:id/confirmer", async (req, res) => {
  const id = req.params.id;
  try {
    const [result] = await pool.query(
      "UPDATE evenements SET statut='Confirmé', updated_at=NOW() WHERE id_evenement=?",
      [id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Événement introuvable" });
    }
    res.json({ message: "Événement confirmé avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

//Annuler evenement
app.put("/api/evenements/:id/annuler", async (req, res) => {
  const id = req.params.id;
  try {
    const [result] = await pool.query(
      "UPDATE evenements SET statut='Annulé', updated_at=NOW() WHERE id_evenement=?",
      [id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Événement introuvable" });
    }
    res.json({ message: "Événement annulé avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
// Route pour uploader un document lié à un événement
app.post(
  "/api/evenements/:id/documents",
  upload.single("file"),
  async (req, res) => {
    try {
      const id_evenement = req.params.id;

      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier" });
      }

      const { filename, path, mimetype, size } = req.file;

      await pool.execute(
        `INSERT INTO evenement_documents 
      (id_evenement, nom_fichier, chemin_fichier, type_mime, taille)
      VALUES (?, ?, ?, ?, ?)`,
        [id_evenement, filename, path, mimetype, size],
      );

      res.json({ message: "Upload réussi" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur serveur" });
    }
  },
);

app.get("/api/evenements/:id/documents", async (req, res) => {
  const id_evenement = req.params.id;

  const [rows] = await pool.execute(
    "SELECT * FROM evenement_documents WHERE id_evenement = ?",
    [id_evenement],
  );

  res.json(rows);
});
// Route pour supprimer un document lié à un événement
import fs from "fs";

app.delete("/api/documents/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // récupérer le document
    const [rows] = await pool.execute(
      "SELECT * FROM evenement_documents WHERE id = ?",
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Document introuvable" });
    }

    const doc = rows[0];

    // supprimer fichier physique
    if (fs.existsSync(doc.chemin_fichier)) {
      fs.unlinkSync(doc.chemin_fichier);
    }

    // supprimer dans DB
    await pool.execute("DELETE FROM evenement_documents WHERE id = ?", [id]);

    res.json({ message: "Document supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/**
 * Créer une demande de service
 * POST /api/services
 * Accès : Organisateur
 */
app.post(
  "/api/evenementservices",
  userAuth,
  allowRoles(1, 2),
  async (req, res) => {
    try {
      const { id_evenement, id_service, details, quantite, montant_estime } =
        req.body;

      if (!id_evenement || !id_service) {
        return res.status(400).json({
          message: "id_evenement et id_service sont requis",
        });
      }

      const exists = await serviceRequestExists(id_evenement, id_service);

      if (exists) {
        return res.status(409).json({
          message: "Une demande existe déjà pour cet événement et ce service",
        });
      }

      const created = await createServiceRequest({
        id_evenement,
        id_service,
        details,
        quantite,
        montant_estime,
      });

      if (!created) {
        return res.status(500).json({
          message: "Erreur lors de la création de la demande de service",
        });
      }

      return res.status(201).json({
        message: "Demande de service créée avec succès",
      });
    } catch (error) {
      console.error("Erreur POST /api/services :", error);
      return res.status(500).json({
        message: "Erreur serveur",
        error: error.message,
      });
    }
  },
);
/**
 * Voir toutes les demandes de services
 * GET /api/evenementservices
 * Accès : Organisateur, Coordonnateur, Admin
 */
app.get(
  "/api/evenementservices",
  userAuth,
  allowRoles(1, 2, 3),
  async (req, res) => {
    try {
      const demandes = await getAllServiceRequests();

      return res.status(200).json(demandes);
    } catch (error) {
      console.error("Erreur GET /api/evenementservices :", error);

      return res.status(500).json({
        message: "Erreur serveur",
        error: error.message,
      });
    }
  },
);

app.get(
  "/api/evenementservices/evenement/:id_evenement",
  userAuth,
  allowRoles(1, 2, 3),
  async (req, res) => {
    try {
      const { id_evenement } = req.params;

      const demandes = await getAllServiceRequestsByEvent(id_evenement);

      return res.status(200).json(demandes);
    } catch (error) {
      console.error(
        "Erreur GET /api/evenementservices/evenement/:id_evenement :",
        error,
      );

      return res.status(500).json({
        message: "Erreur serveur",
        error: error.message,
      });
    }
  },
);
/**
 * Lire une demande de service
 * GET /api/services/:id_evenement/:id_service
 * Accès : Organisateur
 */
app.get(
  "/api/evenementservices/:id_evenement/:id_service",
  userAuth,
  allowRoles(1, 2),
  async (req, res) => {
    try {
      const { id_evenement, id_service } = req.params;

      const demande = await getServiceRequestByEvent(id_evenement, id_service);

      if (!demande) {
        return res.status(404).json({
          message: "Demande de service introuvable",
        });
      }

      return res.status(200).json(demande);
    } catch (error) {
      console.error(
        "Erreur GET /api/services/:id_evenement/:id_service :",
        error,
      );
      return res.status(500).json({
        message: "Erreur serveur",
        error: error.message,
      });
    }
  },
);

/**
 * Modifier une demande de service
 * PUT /api/services/:id_evenement/:id_service
 * Accès : Organisateur
 */
app.put(
  "/api/evenementservices/:id_evenement/:id_service",
  userAuth,
  allowRoles(1, 2),
  async (req, res) => {
    try {
      const { id_evenement, id_service } = req.params;
      const { details, quantite, montant_estime } = req.body;

      const exists = await serviceRequestExists(id_evenement, id_service);

      if (!exists) {
        return res.status(404).json({
          message: "Aucune demande de service à modifier",
        });
      }

      const updated = await updateServiceRequest(id_evenement, id_service, {
        details,
        quantite,
        montant_estime,
      });

      if (!updated) {
        return res.status(500).json({
          message: "Erreur lors de la mise à jour de la demande de service",
        });
      }

      return res.status(200).json({
        message: "Demande de service mise à jour avec succès",
      });
    } catch (error) {
      console.error(
        "Erreur PUT /api/services/:id_evenement/:id_service :",
        error,
      );
      return res.status(500).json({
        message: "Erreur serveur",
        error: error.message,
      });
    }
  },
);

app.put(
  "/api/evenementservices/:id_evenement/:id_service/statut",
  userAuth,
  allowRoles(1, 3),
  async (req, res) => {
    try {
      const { id_evenement, id_service } = req.params;
      const { statut } = req.body;

      if (!["Valide", "Refuse"].includes(statut)) {
        return res.status(400).json({ message: "Statut invalide" });
      }

      const exists = await serviceRequestExists(id_evenement, id_service);

      if (!exists) {
        return res.status(404).json({
          message: "Demande de service introuvable",
        });
      }

      const updated = await updateServiceRequestStatus(
        id_evenement,
        id_service,
        statut,
      );

      if (!updated) {
        return res.status(500).json({
          message: "Impossible de mettre à jour le statut",
        });
      }

      return res.status(200).json({
        message: "Statut mis à jour avec succès",
      });
    } catch (error) {
      console.error(
        "Erreur PUT /api/evenementservices/:id_evenement/:id_service/statut :",
        error,
      );

      return res.status(500).json({
        message: "Erreur serveur",
        error: error.message,
      });
    }
  },
);

// Voir les demandes validées prêtes pour devis
app.get(
  "/api/devis/demandes-validees",
  userAuth,
  allowRoles(1, 3),
  async (req, res) => {
    try {
      const rows = await getDemandesValideesPourDevis();
      return res.status(200).json(rows);
    } catch (error) {
      console.error("Erreur GET /api/devis/demandes-validees :", error);
      return res.status(500).json({
        message: "Erreur serveur",
        error: error.message,
      });
    }
  },
);

// Créer un devis simple
app.post("/api/devis", userAuth, allowRoles(1, 3), async (req, res) => {
  try {
    const { id_evenement, id_service, montant_ht, taxes, montant_ttc } =
      req.body;

    if (!id_evenement || !id_service) {
      return res.status(400).json({
        message: "id_evenement et id_service sont requis",
      });
    }

    const demande = await getDemandeValideePourDevis(id_evenement, id_service);

    if (!demande) {
      return res.status(404).json({
        message: "Demande validée introuvable",
      });
    }

    const reference = `DEV-${id_evenement}-${id_service}-${Date.now()}`;

    const id_devis = await createDevis({
      id_evenement,
      id_service,
      reference,
      montant_ht,
      taxes,
      montant_ttc,
      statut: "Brouillon",
    });

    return res.status(201).json({
      message: "Devis créé avec succès",
      id_devis,
      reference,
    });
  } catch (error) {
    console.error("Erreur POST /api/devis :", error);
    return res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
});

// Voir tous les devis
app.get("/api/devis", userAuth, allowRoles(1, 3), async (req, res) => {
  try {
    const rows = await getAllDevis();
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Erreur GET /api/devis :", error);
    return res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
});

// Voir un devis précis
app.get(
  "/api/devis/:id_devis",
  userAuth,
  allowRoles(1, 3),
  async (req, res) => {
    try {
      const { id_devis } = req.params;
      const devis = await getDevisById(id_devis);

      if (!devis) {
        return res.status(404).json({
          message: "Devis introuvable",
        });
      }

      return res.status(200).json(devis);
    } catch (error) {
      console.error("Erreur GET /api/devis/:id_devis :", error);
      return res.status(500).json({
        message: "Erreur serveur",
        error: error.message,
      });
    }
  },
);

app.delete(
  "/api/devis/:id_devis",
  userAuth,
  allowRoles(1, 3),
  async (req, res) => {
    try {
      const { id_devis } = req.params;

      const deleted = await deleteDevis(id_devis);

      if (!deleted) {
        return res.status(404).json({
          message: "Devis introuvable",
        });
      }

      return res.status(200).json({
        message: "Devis supprimé avec succès",
      });
    } catch (error) {
      console.error("Erreur DELETE /api/devis/:id_devis :", error);
      return res.status(500).json({
        message: "Erreur serveur",
        error: error.message,
      });
    }
  },
);

// ROUTE DE TEST PROTÉGÉE

app.get("/api/me", userAuth, (request, response) => {
  response.json(request.user);
});

// DÉMARRAGE DU SERVEUR

app.listen(process.env.PORT, () => {
  console.log("Serveur démarré :");
  console.log(`http://localhost:${process.env.PORT}`);
});
