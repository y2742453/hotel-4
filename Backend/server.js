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
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

// Import configuration Passport
import "./auth.js";

// Import modèles
import {
  addUtilisateur,
  getUsers,
  updateUser,
  updateUserActif,
  deleteUser,
  getAdminsActifs,
  getCoordonnateursActifs,
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
  getAllFromSalles,
} from "./modele/salle.js";
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "./modele/service.js";
import {
  createEvenement,
  getAllFromEvenements,
  getEvenementInfoForNotification,
  getEvenementServiceInfoForNotification,
} from "./modele/evenement.js";
import inviteRoutes from "./routes/invite.js";
import factureRoutes from "./routes/facture.js";

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

import {
  createNotification,
  getNotificationsByUser,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "./modele/notification.js";

import {
  ensureNotificationPreferences,
  getNotificationPreferencesByUser,
  updateNotificationPreferences,
} from "./modele/notificationPreference.js";

import { sendNotificationEmail } from "./services/notificationEmailService.js";

import {
  calculateEventTotal,
  createFacture,
  getFactureById,
} from "./modele/facture.js";

// Création du serveur  `
const app = express();

// Initialisation du store de session
const MemoryStore = memorystore(session);

// Stripe webhook
app.use("/api/factures/webhook", express.raw({ type: "application/json" }));

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
    secret: process.env.SESSION_SECRET || "fallback_secret",
  }),
);

// Initialisation de Passport
app.use(passport.initialize());
app.use(passport.session());

// Fichiers statiques
app.use(express.static("public"));

// Route pour import de fichier CSV/Excel des invités
app.use("/api/invites", userAuth, allowRoles(2), inviteRoutes);

// Routes pour factures
app.use("/api/factures", factureRoutes);

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
app.get("/api/reservation/salles", async (request, response) => {
  try {
    const salles = await getAllFromSalles();
    response.status(200).json(salles);
  } catch (error) {
    response.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour obtenir la liste des evenements
app.get("/api/reservation/evenements", async (request, response) => {
  try {
    const evenements = await getAllFromEvenements();
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
      req.body.cout,
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
    req.body.cout,
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

  // // supprimer anciens services
  // await pool.query("DELETE FROM evenement_services WHERE id_evenement = ?", [
  //   id,
  // ]);

  // // ajouter nouveaux
  // for (const idService of req.body.services) {
  //   await pool.query(
  //     `INSERT INTO evenement_services (id_evenement, id_service, statut)
  //    VALUES (?, ?, 'Demande')`,
  //     [id, idService],
  //   );
  // }
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

/**
 * Route pour créer un événement
 */
app.post("/api/evenements", userAuth, allowRoles(2), async (req, res) => {
  try {
    const {
      nom_evenement,
      type_evenement,
      description,
      date_debut,
      date_fin,
      statut,
      id_salle,
      services,
    } = req.body;

    if (!nom_evenement || nom_evenement.trim().length < 2) {
      return res.status(400).json({ message: "nom_evenement est requis" });
    }

    if (!date_debut || !date_fin) {
      return res
        .status(400)
        .json({ message: "date_debut et date_fin sont requis" });
    }

    const idSalle = Number(id_salle);
    const idOrg = Number(req.user.id_user);

    if (!Number.isInteger(idSalle) || idSalle < 1) {
      return res.status(400).json({ message: "id_salle invalide" });
    }

    if (!Number.isInteger(idOrg) || idOrg < 1) {
      return res.status(400).json({ message: "Utilisateur invalide" });
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

    const admins = await getAdminsActifs();

    const coordonateurs = await getCoordonnateursActifs();

    for (const admin of admins) {
      const prefs = await ensureNotificationPreferences(admin.id_user);

      if (prefs.canal_interne) {
        await createNotification({
          id_user: admin.id_user,
          type_notification: "evenement",
          titre: "Nouvel événement créé",
          message: `Un nouvel événement "${nom_evenement}" a été créé et attend traitement.`,
          lien: "/admin/evenements",
        });
      }

      if (prefs.canal_email && admin.email) {
        await sendNotificationEmail({
          to: admin.email,
          subject: "Nouvel événement créé",
          title: "Nouvel événement créé",
          message: `Un nouvel événement "${nom_evenement}" a été créé et attend traitement.`,
          actionUrl: "http://localhost:5173/admin/evenements",
        });
      }
      if (prefs.canal_sms) {
        console.log(`SMS admin ${admin.id_user} : nouvel événement créé`);
      }
    }

    for (const coord of coordonateurs) {
      const prefs = await ensureNotificationPreferences(coord.id_user);

      if (prefs.canal_interne) {
        await createNotification({
          id_user: coord.id_user,
          type_notification: "evenement",
          titre: "Nouvel événement à valider",
          message: `Un nouvel événement "${nom_evenement}" nécessite votre validation.`,
          lien: "/coordonateur/evenements",
        });
      }

      if (prefs.canal_email && coord.email) {
        await sendNotificationEmail({
          to: coord.email,
          subject: "Nouvel événement à valider",
          title: "Nouvel événement à valider",
          message: `Un nouvel événement "${nom_evenement}" attend votre validation.`,
          actionUrl: "http://localhost:5173/coordonateur/evenements",
        });
      }

      if (prefs.canal_sms) {
        console.log(
          `SMS coordonateur ${coord.id_user} : nouvel événement à valider`,
        );
      }
    }
    res.status(201).json({ id_evenement });
  } catch (err) {
    console.error("EVENT ERROR:", err.code, err.message, err.sql);

    if (err.message === "INVALID_DATES") {
      return res.status(400).json({
        message: "La date de fin doit être après la date de début",
      });
    }

    if (err.message === "HOURS_OUT_OF_RANGE") {
      return res.status(400).json({
        message: "Les événements doivent être entre 07:00 et 22:00",
      });
    }

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
  const userId = req.user?.id_user || 1;

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
    // 1. récupérer ancienne version
    const [oldRows] = await pool.query(
      "SELECT * FROM evenements WHERE id_evenement = ?",
      [id],
    );

    if (oldRows.length === 0) {
      return res.status(404).json({ message: "Événement introuvable" });
    }

    const oldEvent = oldRows[0];

    // 2. mise à jour
    await pool.query(
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

    // 3. comparer et enregistrer les changements
    const fields = {
      nom_evenement,
      type_evenement,
      description,
      date_debut,
      date_fin,
      id_salle,
      nb_participants,
      budget,
    };

    for (const key in fields) {
      if (oldEvent[key] != fields[key]) {
        await pool.query(
          `
          INSERT INTO historique_modifications 
          (id_evenement, id_user, champ_modifie, ancienne_valeur, nouvelle_valeur)
          VALUES (?, ?, ?, ?, ?)
          `,
          [id, userId, key, oldEvent[key], fields[key]],
        );
      }
    }

    res.json({ message: "Événement modifié + historique enregistré" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Route pour récupérer l'historique des modifications d'un événement
app.get("/api/evenements/:id/historique", async (req, res) => {
  try {
    const id = req.params.id;

    const [rows] = await pool.query(
      `
      SELECT 
        h.id,
        h.champ_modifie,
        h.ancienne_valeur,
        h.nouvelle_valeur,
        h.date_modification,
        u.nom,
        u.prenom
      FROM historique_modifications h
      JOIN users u ON h.id_user = u.id_user
      WHERE h.id_evenement = ?
      ORDER BY h.date_modification DESC
      `,
      [id],
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Confirmer evenement
app.put("/api/evenements/:id/confirmer", async (req, res) => {
  const id = Number(req.params.id);
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Get event
    const evenement = await getEvenementInfoForNotification(id);
    if (!evenement) {
      await conn.rollback();
      return res.status(404).json({ message: "Événement introuvable" });
    }

    // 2. Check current status
    if (evenement.statut === "Annulé") {
      await conn.rollback();
      return res.status(400).json({
        message: "Impossible de confirmer un événement annulé",
      });
    }

    if (evenement.statut === "Confirmé") {
      await conn.rollback();
      return res.status(400).json({
        message: "Événement déjà confirmé",
      });
    }

    // 3. Check services
    const [services] = await conn.query(
      `SELECT statut FROM evenement_services WHERE id_evenement = ?`,
      [id],
    );

    const hasPending = services.some(
      (s) => (s.statut || "").toLowerCase() === "demande",
    );

    if (hasPending) {
      await conn.rollback();
      return res.status(400).json({
        message:
          "Impossible de confirmer : certaines demandes sont encore en attente",
      });
    }

    // 4. Check facture BEFORE confirming
    const [[existingFacture]] = await conn.query(
      "SELECT id_facture FROM factures WHERE id_evenement = ?",
      [id],
    );

    // 5. Calculate total
    const total = await calculateEventTotal(id);

    if (existingFacture) {
      await conn.query(
        `UPDATE factures 
     SET montant_total = ?, taxes = ?, updated_at = NOW()
     WHERE id_facture = ?`,
        [total, total * 0.13, existingFacture.id_facture],
      );
    } else {
      await createFacture({
        id_evenement: id,
        montant_total: total,
        taxes: total * 0.13,
      });
    }

    // 6. Update event
    await conn.query(
      "UPDATE evenements SET statut='Confirmé', updated_at=NOW() WHERE id_evenement=?",
      [id],
    );

    // 8. Commit transaction
    await conn.commit();

    // 9. Notifications (outside critical logic is OK)
    const prefs = await ensureNotificationPreferences(
      evenement.id_organisateur,
    );

    if (prefs.canal_interne) {
      await createNotification({
        id_user: evenement.id_organisateur,
        type_notification: "evenement",
        titre: "Événement confirmé",
        message: `Votre événement "${evenement.nom_evenement}" a été confirmé.`,
        lien: "/organisateur/evenements",
      });
    }

    if (prefs.canal_email && evenement.email) {
      await sendNotificationEmail({
        to: evenement.email,
        subject: "Événement confirmé",
        title: "Événement confirmé",
        message: `Votre événement "${evenement.nom_evenement}" a été confirmé.`,
        actionUrl: "http://localhost:5173/organisateur/evenements",
      });
    }

    if (prefs.canal_sms) {
      console.log(`SMS user ${evenement.id_organisateur} : événement confirmé`);
    }

    res.json({ message: "Événement confirmé avec succès" });
  } catch (error) {
    await conn.rollback();
    console.error("Erreur confirmation événement :", error);

    res.status(500).json({ message: "Erreur serveur" });
  } finally {
    conn.release();
  }
});

//Annuler evenement
app.put("/api/evenements/:id/annuler", async (req, res) => {
  const id = req.params.id;

  try {
    const evenement = await getEvenementInfoForNotification(id);

    if (!evenement) {
      return res.status(404).json({ message: "Événement introuvable" });
    }

    const [result] = await pool.query(
      "UPDATE evenements SET statut='Annulé', updated_at=NOW() WHERE id_evenement=?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Événement introuvable" });
    }
    const prefs = await ensureNotificationPreferences(
      evenement.id_organisateur,
    );

    if (prefs.canal_interne) {
      await createNotification({
        id_user: evenement.id_organisateur,
        type_notification: "evenement",
        titre: "Événement annulé",
        message: `Votre événement "${evenement.nom_evenement}" a été annulé.`,
        lien: "/organisateur/evenements",
      });
    }

    if (prefs.canal_email && evenement.email) {
      await sendNotificationEmail({
        to: evenement.email,
        subject: "Événement annulé",
        title: "Événement annulé",
        message: `Votre événement "${evenement.nom_evenement}" a été annulé.`,
        actionUrl: "http://localhost:5173/organisateur/evenements",
      });
    }

    if (prefs.canal_sms) {
      console.log(`SMS user ${evenement.id_organisateur} : événement annulé`);
    }

    res.json({ message: "Événement annulé avec succès" });
  } catch (error) {
    console.error("Erreur annulation événement :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Restaurer evenement (Annulé à Prévu)
app.put("/api/evenements/:id/restaurer", async (req, res) => {
  const id = req.params.id;

  try {
    const [[event]] = await pool.query(
      "SELECT statut FROM evenements WHERE id_evenement = ?",
      [id],
    );

    if (!event) {
      return res.status(404).json({ message: "Événement introuvable" });
    }

    if (event.statut !== "Annulé") {
      return res.status(400).json({
        message: "Seuls les événements annulés peuvent être restaurés",
      });
    }

    await pool.query(
      "UPDATE evenements SET statut='Prévu', updated_at=NOW() WHERE id_evenement=?",
      [id],
    );

    res.json({ message: "Événement restauré" });
  } catch (error) {
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
      const { id_evenement, id_service, details, quantite } = req.body;

      if (!id_evenement || !id_service) {
        return res.status(400).json({
          message: "id_evenement et id_service sont requis",
        });
      }

      const [serviceRows] = await pool.query(
        "SELECT tarif FROM services WHERE id_service = ?",
        [id_service],
      );

      if (serviceRows.length === 0) {
        return res.status(404).json({ message: "Service introuvable" });
      }

      const tarif = Number(serviceRows[0].tarif);
      const qte = Number(quantite) || 1;

      const exists = await serviceRequestExists(id_evenement, id_service);

      const montant_estime = tarif * qte;

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

      const info = await getEvenementServiceInfoForNotification(
        id_evenement,
        id_service,
      );

      const coordonnateurs = await getCoordonnateursActifs();

      for (const coordonnateur of coordonnateurs) {
        const prefs = await ensureNotificationPreferences(
          coordonnateur.id_user,
        );

        if (prefs.canal_interne) {
          await createNotification({
            id_user: coordonnateur.id_user,
            type_notification: "service",
            titre: "Nouvelle demande de service",
            message: info
              ? `Une demande pour le service "${info.nom_service}" a été créée pour l'événement "${info.nom_evenement}".`
              : `Une nouvelle demande de service a été créée pour l'événement ${id_evenement}.`,
            lien: "/coordonnateur/demandes",
          });
        }

        if (prefs.canal_email && coordonnateur.email) {
          await sendNotificationEmail({
            to: coordonnateur.email,
            subject: "Nouvelle demande de service",
            title: "Nouvelle demande de service",
            message: info
              ? `Une demande pour le service "${info.nom_service}" a été créée pour l'événement "${info.nom_evenement}".`
              : `Une nouvelle demande de service a été créée pour l'événement ${id_evenement}.`,
            actionUrl: "http://localhost:5173/coordonnateur/demandes",
          });
        }

        if (prefs.canal_sms) {
          console.log(
            `SMS coordonnateur ${coordonnateur.id_user} : nouvelle demande de service`,
          );
        }
      }

      return res.status(201).json({
        message: "Demande de service créée avec succès",
      });
    } catch (error) {
      console.error("Erreur POST /api/evenementservices :", error);
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
      const { details, quantite } = req.body;

      const [serviceRows] = await pool.query(
        "SELECT tarif FROM services WHERE id_service = ?",
        [id_service],
      );

      const tarif = Number(serviceRows[0].tarif);
      const qte = Number(quantite) || 1;

      const montant_estime = tarif * qte;

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

      const info = await getEvenementServiceInfoForNotification(
        id_evenement,
        id_service,
      );

      if (info) {
        const prefs = await ensureNotificationPreferences(info.id_organisateur);

        if (prefs.canal_interne) {
          await createNotification({
            id_user: info.id_organisateur,
            type_notification: "service",
            titre: statut === "Valide" ? "Service validé" : "Service refusé",
            message:
              statut === "Valide"
                ? `Le service "${info.nom_service}" pour l'événement "${info.nom_evenement}" a été validé.`
                : `Le service "${info.nom_service}" pour l'événement "${info.nom_evenement}" a été refusé.`,
            lien: "/organisateur/demandes-services",
          });
        }

        if (prefs.canal_email && info.email) {
          await sendNotificationEmail({
            to: info.email,
            subject: statut === "Valide" ? "Service validé" : "Service refusé",
            title: statut === "Valide" ? "Service validé" : "Service refusé",
            message:
              statut === "Valide"
                ? `Le service "${info.nom_service}" pour l'événement "${info.nom_evenement}" a été validé.`
                : `Le service "${info.nom_service}" pour l'événement "${info.nom_evenement}" a été refusé.`,
            actionUrl: "http://localhost:5173/organisateur/demandes-services",
          });
        }

        if (prefs.canal_sms) {
          console.log(
            `SMS user ${info.id_organisateur} : ${
              statut === "Valide" ? "service validé" : "service refusé"
            }`,
          );
        }
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

    const info = await getEvenementServiceInfoForNotification(
      id_evenement,
      id_service,
    );

    if (info) {
      const prefs = await ensureNotificationPreferences(info.id_organisateur);

      if (prefs.canal_interne) {
        await createNotification({
          id_user: info.id_organisateur,
          type_notification: "devis",
          titre: "Devis créé",
          message: `Un devis a été créé pour le service "${info.nom_service}" de votre événement "${info.nom_evenement}".`,
          lien: "/organisateur/demandes-services",
        });
      }

      if (prefs.canal_email && info.email) {
        await sendNotificationEmail({
          to: info.email,
          subject: "Devis créé",
          title: "Devis créé",
          message: `Un devis a été créé pour le service "${info.nom_service}" de votre événement "${info.nom_evenement}".`,
          actionUrl: "http://localhost:5173/organisateur/demandes-services",
        });
      }

      if (prefs.canal_sms) {
        console.log(`SMS user ${info.id_organisateur} : devis créé`);
      }
    }

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

// =====================
// API - NOTIFICATIONS
// =====================

// Voir mes notifications
app.get("/api/notifications", userAuth, async (req, res) => {
  try {
    const notifications = await getNotificationsByUser(req.user.id_user);
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Erreur GET /api/notifications :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Nombre de notifications non lues
app.get("/api/notifications/unread-count", userAuth, async (req, res) => {
  try {
    const total = await getUnreadNotificationsCount(req.user.id_user);
    res.status(200).json({ total });
  } catch (error) {
    console.error("Erreur GET /api/notifications/unread-count :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Marquer une notification comme lue
app.patch("/api/notifications/:id/read", userAuth, async (req, res) => {
  try {
    const id_notification = Number(req.params.id);

    const updated = await markNotificationAsRead(
      id_notification,
      req.user.id_user,
    );

    if (!updated) {
      return res.status(404).json({ message: "Notification introuvable" });
    }

    res.status(200).json({ message: "Notification marquée comme lue" });
  } catch (error) {
    console.error("Erreur PATCH /api/notifications/:id/read :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Marquer toutes les notifications comme lues
app.patch("/api/notifications/read-all", userAuth, async (req, res) => {
  try {
    const total = await markAllNotificationsAsRead(req.user.id_user);
    res.status(200).json({
      message: "Toutes les notifications ont été marquées comme lues",
      total,
    });
  } catch (error) {
    console.error("Erreur PATCH /api/notifications/read-all :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ===================== preferences
// =====================
// API - PREFERENCES NOTIFICATIONS
// =====================

// Voir mes préférences
app.get("/api/notification-preferences", userAuth, async (req, res) => {
  try {
    const prefs = await ensureNotificationPreferences(req.user.id_user);
    return res.status(200).json(prefs);
  } catch (error) {
    console.error("Erreur GET /api/notification-preferences :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

// Modifier mes préférences
app.put("/api/notification-preferences", userAuth, async (req, res) => {
  try {
    const { canal_interne, canal_email, canal_sms } = req.body;

    const values = {
      canal_interne: canal_interne ? 1 : 0,
      canal_email: canal_email ? 1 : 0,
      canal_sms: canal_sms ? 1 : 0,
    };

    if (
      values.canal_interne === 0 &&
      values.canal_email === 0 &&
      values.canal_sms === 0
    ) {
      return res.status(400).json({
        message: "Veuillez sélectionner au moins un canal de notification.",
      });
    }

    await ensureNotificationPreferences(req.user.id_user);

    const updated = await updateNotificationPreferences(
      req.user.id_user,
      values,
    );

    if (!updated) {
      return res.status(404).json({
        message: "Préférences introuvables",
      });
    }

    return res.status(200).json({
      message: "Préférences mises à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur PUT /api/notification-preferences :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

//tableau de bord
app.get("/api/dashboard", async (req, res) => {
  try {
    const { date_debut, date_fin, id_salle, statut, type_evenement } =
      req.query;

    // =========================
    // CONSTRUCTION FILTRES SQL
    // =========================
    let conditions = [];
    let values = [];

    if (date_debut && date_fin) {
      conditions.push("e.date_debut BETWEEN ? AND ?");
      values.push(date_debut, date_fin);
    }

    if (id_salle) {
      conditions.push("e.id_salle = ?");
      values.push(id_salle);
    }

    if (statut) {
      conditions.push("e.statut = ?");
      values.push(statut);
    }

    if (type_evenement) {
      conditions.push("e.type_evenement = ?");
      values.push(type_evenement);
    }

    const whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    // =========================
    // 1. TOTAL INVITÉS
    // =========================
    const [totalGuests] = await pool.query(
      `
      SELECT COUNT(*) as total
      FROM invites i
      JOIN evenements e ON i.id_evenement = e.id_evenement
      ${whereClause}
      `,
      values,
    );

    // =========================
    // 2. INVITÉS CONFIRMÉS
    // =========================
    const [confirmedGuests] = await pool.query(
      `
      SELECT COUNT(*) as total
      FROM invites i
      JOIN evenements e ON i.id_evenement = e.id_evenement
      ${whereClause} ${whereClause ? "AND" : "WHERE"} i.statut = 'confirme'
      `,
      values,
    );

    // =========================
    // 3. COÛT TOTAL
    // =========================
    const [cost] = await pool.query(
      `
      SELECT SUM(f.montant_total) as total
      FROM factures f
      JOIN evenements e ON f.id_evenement = e.id_evenement
      ${whereClause}
      `,
      values,
    );

    // =========================
    // 4. NOMBRE ÉVÉNEMENTS
    // =========================
    const [events] = await pool.query(
      `
      SELECT COUNT(*) as total
      FROM evenements e
      ${whereClause}
      `,
      values,
    );

    // =========================
    // CALCULS
    // =========================
    const total = totalGuests[0].total;
    const confirmed = confirmedGuests[0].total;

    const participationRate =
      total > 0 ? ((confirmed / total) * 100).toFixed(2) : 0;

    res.json({
      totalGuests: total,
      confirmedGuests: confirmed,
      participationRate,
      totalCost: cost[0].total || 0,
      totalEvents: events[0].total,
    });
  } catch (err) {
    console.error("FILTER DASHBOARD ERROR:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Export Excel
app.get("/api/dashboard/export/excel", async (req, res) => {
  try {
    const { date_debut, date_fin } = req.query;

    let conditions = [];
    let values = [];

    if (date_debut && date_fin) {
      conditions.push("date_debut BETWEEN ? AND ?");
      values.push(date_debut, date_fin);
    }

    const whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const [rows] = await pool.query(
      `
      SELECT 
        e.nom_evenement,
        e.type_evenement,
        e.date_debut,
        e.date_fin,
        e.statut,
        f.montant_total
      FROM evenements e
      LEFT JOIN factures f ON e.id_evenement = f.id_evenement
      ${whereClause}
    `,
      values,
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Rapport");

    sheet.columns = [
      { header: "Nom", key: "nom_evenement", width: 25 },
      { header: "Type", key: "type_evenement", width: 20 },
      { header: "Début", key: "date_debut", width: 20 },
      { header: "Fin", key: "date_fin", width: 20 },
      { header: "Statut", key: "statut", width: 15 },
      { header: "Coût", key: "montant_total", width: 15 },
    ];

    rows.forEach((row) => sheet.addRow(row));

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader("Content-Disposition", "attachment; filename=rapport.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur export Excel" });
  }
});

// Export PDF

app.get("/api/dashboard/export/pdf", async (req, res) => {
  try {
    const { date_debut, date_fin } = req.query;

    let conditions = [];
    let values = [];

    if (date_debut && date_fin) {
      conditions.push("date_debut BETWEEN ? AND ?");
      values.push(date_debut, date_fin);
    }

    const whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const [rows] = await pool.query(
      `
      SELECT 
        e.nom_evenement,
        e.type_evenement,
        e.date_debut,
        e.statut,
        f.montant_total
      FROM evenements e
      LEFT JOIN factures f ON e.id_evenement = f.id_evenement
      ${whereClause}
    `,
      values,
    );

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=rapport.pdf");

    doc.pipe(res);

    doc.fontSize(18).text("Rapport des événements", { align: "center" });
    doc.moveDown();

    rows.forEach((row, index) => {
      doc
        .fontSize(12)
        .text(
          `${index + 1}. ${row.nom_evenement} - ${row.type_evenement} - ${row.statut} - ${row.montant_total || 0} $`,
        );
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur export PDF" });
  }
});

// Historique des événements avec filtres
app.get("/api/historique", async (req, res) => {
  try {
    const { date_debut, date_fin, statut, id_salle } = req.query;

    let conditions = [];
    let values = [];

    // filtres
    if (date_debut && date_fin) {
      conditions.push("e.date_debut BETWEEN ? AND ?");
      values.push(date_debut, date_fin);
    }

    if (statut) {
      conditions.push("e.statut = ?");
      values.push(statut);
    }

    if (id_salle) {
      conditions.push("e.id_salle = ?");
      values.push(id_salle);
    }

    const whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    // requête principale
    const [rows] = await pool.query(
      `
      SELECT 
        e.id_evenement,
        e.nom_evenement,
        e.type_evenement,
        e.date_debut,
        e.date_fin,
        e.statut,
        e.nb_participants,
        e.budget,
        s.nom_salle,
        u.nom AS organisateur_nom,
        u.prenom AS organisateur_prenom
      FROM evenements e
      JOIN salles s ON e.id_salle = s.id_salle
      JOIN users u ON e.id_organisateur = u.id_user
       LEFT JOIN invites i ON e.id_evenement = i.id_evenement
       LEFT JOIN factures f ON e.id_evenement = f.id_evenement
      ${whereClause}
      GROUP BY e.id_evenement

      ORDER BY e.date_debut DESC
      `,
      values,
    );

    res.json(rows);
  } catch (err) {
    console.error("HISTORIQUE ERROR:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
// ROUTE DE TEST PROTÉGÉE

app.get("/api/me", userAuth, (request, response) => {
  response.json(request.user);
});

// Route de paiement succes et annulé
app.get("/success", (req, res) => {
  res.send("Paiement réussi");
});

app.get("/cancel", (req, res) => {
  res.send("Paiement annulé");
});

// DÉMARRAGE DU SERVEUR
app.listen(process.env.PORT, () => {
  console.log("Serveur démarré :");
  console.log(`http://localhost:${process.env.PORT}`);
});
