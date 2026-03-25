import "dotenv/config";

import express from "express";
import multer from "multer";
import { Parser } from "json2csv";
import nodemailer from "nodemailer";

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

// Ajouter un invité
router.post("/", emailEstValide, async (req, res) => {
  try {
    const { id_evenement, nom, prenom, email, statut } = req.body;
    if (!id_evenement || !nom || !prenom || !email)
      return res.status(400).json({ error: "Données manquantes" });

    const id_invite = await addInvite({
      id_evenement: Number(id_evenement),
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.trim().toLowerCase(),
      statut: statut || "en_attente",
    });

    res.status(201).json({ message: "Invité ajouté", id_invite });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "Email déjà invité" });
    res.status(500).json({ error: err.message });
  }
});

// Mettre à jour un invité
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updates = req.body;

    const invite = await getInviteById(id);
    if (!invite) return res.status(404).json({ error: "Invité non trouvé" });

    const success = await updateInvite(id, updates);
    if (success) res.json({ message: "Invité mis à jour" });
    else res.status(400).json({ error: "Aucune modification effectuée" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "Email déjà utilisé" });
    res.status(500).json({ error: err.message });
  }
});

// Supprimer un invité
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const invite = await getInviteById(id);
    if (!invite) return res.status(404).json({ error: "Invité introuvable" });

    const success = await deleteInvite(id);
    if (success) res.status(204).send();
    else res.status(400).json({ error: "Impossible de supprimer" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtenir un invité par ID
router.get("/:id", async (req, res) => {
  try {
    const invite = await getInviteById(req.params.id);

    if (invite) {
      res.json(invite);
    } else {
      res.status(404).json({ error: "Invité introuvable" });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Obtenir tous les invités d'un événement
router.get("/event/:id_evenement", async (req, res) => {
  try {
    const invites = await getInvitesByEvent(Number(req.params.id_evenement));
    res.json(invites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtenir la liste des status des invités
router.get("/stats/:id_evenement", async (req, res) => {
  try {
    const id_evenement = Number(req.params.id_evenement);
    if (isNaN(id_evenement))
      return res.status(400).json({ error: "ID invalide" });

    const stats = await getStatsByEvent(id_evenement);
    res.json(stats);
  } catch (err) {
    console.error("Erreur stats invités:", err);
    res.status(500).json({ error: "Impossible de récupérer les statistiques" });
  }
});

// Import de la liste des invités
router.post("/import/:idEvenement", async (req, res) => {
  const eventId = Number(req.params.idEvenement);
  const { rows } = req.body;

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
        erreur: err.code === "ER_DUP_ENTRY" ? "Email déjà invité" : err.message,
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
});

// Export de la liste des invites pour un evenement
router.get("/export/:id_evenement", async (req, res) => {
  try {
    const idEvenement = Number(req.params.id_evenement);

    const invites = await getInvitesByEvent(idEvenement);

    const parser = new Parser();
    const csv = parser.parse(invites);

    res.header("Content-Type", "text/csv");
    res.attachment("invites.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Envoyer une invitation
router.post("/send/:id", async (req, res) => {
  try {
    const invite = await getInviteById(Number(req.params.id));
    if (!invite) return res.status(404).json({ error: "Invité non trouvé" });

    const evenement = await getEvenementById(invite.id_evenement);
    if (!evenement)
      return res.status(404).json({ error: "Événement non trouvé" });

    await sendInvitation(invite, evenement);

    await updateInvite(invite.id_invite, { statut: "invite" });

    res.json({ message: "Invitation envoyée" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Réponse à l'invitation
router.get("/respond/:id_invite", async (req, res) => {
  try {
    const id = Number(req.params.id_invite);
    const { response } = req.query;

    if (!["confirm", "decline"].includes(response)) {
      return res.status(400).json({ error: "Réponse invalide" });
    }

    const statut = response === "confirm" ? "confirme" : "refuse";

    await updateInvite(id, { statut });

    res.send(`<h1>Merci! Réponse enregistrée!</h1>`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
