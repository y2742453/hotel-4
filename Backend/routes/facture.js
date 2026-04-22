import express from "express";

import { pool } from "../db/db.js";

import {
  createFacture,
  getFactureById,
  getAllFactures,
  saveStripeSession,
  markFacturePaid,
  createPaiement,
  calculateEventTotal,
  getFactureByStripeSession,
} from "../modele/facture.js";

import { createCheckoutSession, stripe } from "../services/stripeService.js";
import { getEvenementById } from "../modele/evenement.js";

const router = express.Router();

/* CRÉER FACTURE (appelé lors validation événement) */
router.post("/create/:id_evenement", async (req, res) => {
  try {
    const id = Number(req.params.id_evenement);

    const event = await getEvenementById(id);
    if (!event) {
      return res.status(404).json({ error: "Événement introuvable" });
    }

    const total = await calculateEventTotal(id);

    const id_facture = await createFacture({
      id_evenement: id,
      montant_total: total,
      taxes: total * 0.13,
    });

    res.status(201).json({ id_facture });
  } catch (err) {
    console.error("Erreur création facture:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour filtrer par evenement et/ou par periode
router.get("/search", async (req, res) => {
  try {
    const { id_evenement, date_debut, date_fin, statut } = req.query;

    let query = `
      SELECT f.*, e.nom_evenement
      FROM factures f
      JOIN evenements e ON f.id_evenement = e.id_evenement
      WHERE 1=1
    `;

    const params = [];

    if (id_evenement) {
      query += ` AND f.id_evenement = ?`;
      params.push(id_evenement);
    }

    if (date_debut) {
      query += ` AND f.date_facture >= ?`;
      params.push(date_debut);
    }

    if (date_fin) {
      query += ` AND f.date_facture <= ?`;
      params.push(date_fin);
    }
    if (statut) {
      query += ` AND f.statut = ?`;
      params.push(statut);
    }

    const [rows] = await pool.execute(query, params);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* GET ALL et Mise a jour du statut */
router.get("/", async (req, res) => {
  try {
    await pool.execute(`
      UPDATE factures
      SET statut = 'en_retard'
      WHERE statut = 'en_attente'
      AND date_facture < NOW() - INTERVAL 30 DAY
    `);

    const factures = await getAllFactures();
    res.json(factures);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* GET BY ID */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const facture = await getFactureById(id);
    if (!facture) {
      return res.status(404).json({ error: "Facture introuvable" });
    }

    res.json(facture);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* PAYER FACTURE */
router.post("/payer/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const facture = await getFactureById(id);
    if (!facture) {
      return res.status(404).json({ error: "Facture introuvable" });
    }

    const session = await createCheckoutSession(facture);

    await saveStripeSession(id, session.id);

    res.json({ url: session.url });
  } catch (err) {
    console.error("Erreur paiement:", err);
    res.status(500).json({ error: "Erreur paiement" });
  }
});

/* WEBHOOK STRIPE */
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.sendStatus(400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const facture = await getFactureByStripeSession(session.id);
    if (!facture) return res.sendStatus(200);

    if (facture.statut === "paye") {
      return res.sendStatus(200);
    }

    await markFacturePaid(facture.id_facture, session.payment_intent);

    await createPaiement({
      id_facture: facture.id_facture,
      montant: facture.montant_total,
      paymentIntent: session.payment_intent,
    });
  }

  res.sendStatus(200);
});

export default router;
