import "dotenv/config";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Créer une session Stripe
 */
export async function createCheckoutSession(facture) {
  return stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "cad",
          product_data: {
            name: `Facture #${facture.id_facture}`,
          },
          unit_amount: Math.round(facture.montant_total * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `http://localhost:${process.env.PORT}/success`,
    cancel_url: `http://localhost:${process.env.PORT}/cancel`,
  });
}

export { stripe };
