import "dotenv/config";

import express from "express";
import multer from "multer";
import { Parser } from "json2csv";

import {
  addInvite,
  deleteInvite,
  getInviteById,
  getInvitesByEvent,
  getStatsByEvent,
  updateInvite,
} from "../modele/invite.js";
import { sendInvitation } from "../services/emailService.js";
import { getEvenementById } from "../modele/evenement.js";
import { emailEstValide } from "../Midlewares/validation.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/* AJOUTER UN INVITÉ */
router.post("/", emailEstValide, async (req, res) => {
  try {
    const { id_evenement, nom, prenom, email, statut } = req.body;

    if (!id_evenement || !nom || !prenom || !email) {
      return res.status(400).json({ error: "Données manquantes" });
    }

    const id_invite = await addInvite({
      id_evenement: Number(id_evenement),
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.trim().toLowerCase(),
      statut: statut || "en_attente",
    });

    res.status(201).json({
      message: "Invité ajouté",
      id_invite,
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email déjà invité" });
    }

    console.error("Erreur POST /invites:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* MODIFIER UN INVITÉ */
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Aucune donnée fournie" });
    }

    const invite = await getInviteById(id);
    if (!invite) {
      return res.status(404).json({ error: "Invité non trouvé" });
    }

    const success = await updateInvite(id, updates);

    if (!success) {
      return res.status(400).json({ error: "Aucune modification effectuée" });
    }

    res.json({ message: "Invité mis à jour" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email déjà utilisé" });
    }

    console.error("Erreur PUT /invites:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* SUPPRIMER */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    const invite = await getInviteById(id);
    if (!invite) {
      return res.status(404).json({ error: "Invité introuvable" });
    }

    const success = await deleteInvite(id);

    if (!success) {
      return res.status(400).json({ error: "Impossible de supprimer" });
    }

    res.status(204).send();
  } catch (err) {
    console.error("Erreur DELETE /invites:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* GET BY ID */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    const invite = await getInviteById(id);

    if (!invite) {
      return res.status(404).json({ error: "Invité introuvable" });
    }

    res.json(invite);
  } catch (err) {
    console.error("Erreur GET /invites/:id:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* GET PAR ÉVÉNEMENT */
router.get("/event/:id_evenement", async (req, res) => {
  try {
    const id = Number(req.params.id_evenement);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID événement invalide" });
    }

    const invites = await getInvitesByEvent(id);
    res.json(invites);
  } catch (err) {
    console.error("Erreur GET /event:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* STATS */
router.get("/stats/:id_evenement", async (req, res) => {
  try {
    const id = Number(req.params.id_evenement);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    const stats = await getStatsByEvent(id);
    res.json(stats);
  } catch (err) {
    console.error("Erreur stats:", err);
    res.status(500).json({
      error: "Impossible de récupérer les statistiques",
    });
  }
});

/* IMPORT */
router.post("/import/:idEvenement", async (req, res) => {
  try {
    const eventId = Number(req.params.idEvenement);
    const { rows } = req.body;

    if (isNaN(eventId)) {
      return res.status(400).json({ error: "ID événement invalide" });
    }

    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: "Données invalides" });
    }

    const imported = [];
    const failed = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const nom = (row.nom || "").trim();
      const prenom = (row.prenom || "").trim();
      const email = (row.email || "").trim();

      if (!nom || !prenom || !email) {
        failed.push({
          ligne: i + 2,
          erreur: "Données manquantes",
          email: email || "N/A",
        });
        continue;
      }

      try {
        await addInvite({
          id_evenement: eventId,
          nom,
          prenom,
          email: email.toLowerCase(),
          statut: "en_attente",
        });

        imported.push(email.toLowerCase());
      } catch (err) {
        failed.push({
          ligne: i + 2,
          erreur:
            err.code === "ER_DUP_ENTRY"
              ? "Email déjà invité"
              : "Erreur insertion",
          email,
        });
      }
    }

    res.json({
      message: "Import terminé",
      success: imported.length,
      errors: failed.length,
      total: rows.length,
      details: { imported, failed },
    });
  } catch (err) {
    console.error("Erreur import:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* EXPORT */
router.get("/export/:id_evenement", async (req, res) => {
  try {
    const id = Number(req.params.id_evenement);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    const invites = await getInvitesByEvent(id);

    const parser = new Parser();
    const csv = parser.parse(invites);

    res.header("Content-Type", "text/csv");
    res.attachment("invites.csv");
    res.send(csv);
  } catch (err) {
    console.error("Erreur export:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* ENVOYER INVITATION */
router.post("/send/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    const invite = await getInviteById(id);
    if (!invite) {
      return res.status(404).json({ error: "Invité non trouvé" });
    }

    const evenement = await getEvenementById(invite.id_evenement);
    if (!evenement) {
      return res.status(404).json({ error: "Événement non trouvé" });
    }

    await sendInvitation(invite, evenement);
    await updateInvite(id, { statut: "invite" });

    res.json({ message: "Invitation envoyée" });
  } catch (err) {
    console.error("Erreur envoi invitation:", err);
    res.status(500).json({ error: "Erreur lors de l'envoi" });
  }
});

/* RÉPONSE INVITÉ */
router.get("/respond/:id_invite", async (req, res) => {
  try {
    const id = Number(req.params.id_invite);
    const { response } = req.query;

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    if (!["confirm", "decline"].includes(response)) {
      return res.status(400).json({ error: "Réponse invalide" });
    }

    const statut = response === "confirm" ? "confirme" : "refuse";

    await updateInvite(id, { statut });

    res.send(`<h1>Merci! Réponse enregistrée!</h1>`);
  } catch (err) {
    console.error("Erreur réponse invité:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
