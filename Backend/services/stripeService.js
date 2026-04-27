import "dotenv/config";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Créer une session Stripe
 */
export async function createCheckoutSession(facture) {
  const montant = Number(facture.montant_total || 0);
  const taxes = Number(facture.taxes || 0);

  const total = montant + taxes;

  return stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "cad",
          product_data: {
            name: `Facture #${facture.id_facture}`,
            description:
              facture.nom_evenement || `Événement #${facture.id_evenement}`,
          },
          unit_amount: Math.round(total * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `https://hotel-la-promenade.vercel.app/comptabilite/success`,
    cancel_url: `https://hotel-la-promenade.vercel.app/comptabilite/cancel`,
  });
}

export { stripe };
