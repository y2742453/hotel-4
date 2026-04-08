import express from "express";

import {
  createFacture,
  getFactureById,
  getAllFactures,
  saveStripeSession,
  markFacturePaid,
  createPaiement,
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

    const montant = event.budget;

    if (!montant) {
      return res.status(400).json({
        error: "Le budget de l'événement est requis pour générer une facture",
      });
    }

    const id_facture = await createFacture({
      id_evenement: id,
      montant_total: montant,
      taxes: montant * 0.15,
    });

    res.status(201).json({ id_facture });
  } catch (err) {
    console.error("Erreur création facture:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* GET ALL */
router.get("/", async (req, res) => {
  try {
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

/* 💳 PAYER FACTURE */
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

/* 🔐 WEBHOOK STRIPE */
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
