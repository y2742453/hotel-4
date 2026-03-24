import "dotenv/config";

import express from "express";
import multer from "multer";
import { Parser } from "json2csv";
// import nodemailer from "nodemailer";

import {
  addInvite,
  deleteInvite,
  getInviteById,
  getInvitesByEvent,
  getStatsByEvent,
  updateInvite,
} from "../modele/invite.js";
// import { getEvenementById } from "../modele/evenement.js";
import { emailEstValide } from "../Midlewares/validation.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Fonction pour formatter la date
// function formatDate(date) {
//   if (!date) return "À confirmer";

//   return new Date(date).toLocaleDateString("fr-CA", {
//     weekday: "long",
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });
// }

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
// router.post("/send/:id", async (req, res) => {
//   try {
//     const id = Number(req.params.id);

//     const invite = await getInviteById(id);
//     if (!invite) return res.status(404).json({ error: "Invité non trouvé" });

//     const evenement = await getEventById(invite.id_evenement);
//     if (!evenement)
//       return res.status(404).json({ error: "Événement introuvable" });

//     const baseUrl = `http://localhost:${process.env.PORT || 3000}`;
//     const confirmUrl = `${baseUrl}/api/invites/respond/${invite.id_invite}?response=confirm`;
//     const declineUrl = `${baseUrl}/api/invites/respond/${invite.id_invite}?response=refuse`;

//     const html = `
//       <div style="font-family: Arial; background:#f4f4f4; padding:20px;">
//         <div style="max-width:600px; margin:auto; background:white; border-radius:8px; overflow:hidden;">

//           <div style="background:#2563eb; color:white; padding:20px; text-align:center;">
//             <h1>Invitation</h1>
//           </div>

//           <div style="padding:25px;">
//             <p>Bonjour <strong>${invite.prenom} ${invite.nom}</strong>,</p>

//             <p>Vous êtes invité à :</p>

//             <div style="background:#f9fafb; padding:20px; border-left:4px solid #2563eb; border-radius:6px;">
//               <h2 style="margin-top:0;">${evenement.nom_evenement}</h2>
//               <p><strong>Date :</strong> ${formatDate(evenement.date_debut)}</p>
//               ${
//                 evenement.description
//                   ? `<p><strong>📝 Description :</strong> ${evenement.description}</p>`
//                   : ""
//               }
//             </div>

//             <p>Merci de confirmer votre présence :</p>

//             <div style="text-align:center; margin:30px 0;">
//               <a href="${confirmUrl}"
//                  style="background:#16a34a; color:white; padding:12px 25px; text-decoration:none; border-radius:6px; margin-right:10px;">
//                  Confirmer
//               </a>

//               <a href="${declineUrl}"
//                  style="background:#dc2626; color:white; padding:12px 25px; text-decoration:none; border-radius:6px;">
//                  Refuser
//               </a>
//             </div>

//             <p style="font-size:12px; color:#666;">
//               Si les boutons ne fonctionnent pas :<br/>
//               Confirmer : ${confirmUrl}<br/>
//               Refuser : ${declineUrl}
//             </p>
//           </div>

//           <div style="text-align:center; font-size:12px; color:#888; padding:15px;">
//             <p>Email automatique - ne pas répondre</p>
//             <p>© ${new Date().getFullYear()}</p>
//           </div>

//         </div>
//       </div>
//     `;

//     // ✅ Create Ethereal test account
//     const testAccount = await nodemailer.createTestAccount();

//     // ✅ Use Ethereal credentials
//     const transporter = nodemailer.createTransport({
//       host: testAccount.smtp.host,
//       port: testAccount.smtp.port,
//       secure: testAccount.smtp.secure,
//       auth: {
//         user: testAccount.user,
//         pass: testAccount.pass,
//       },
//     });

//     // ✅ Send email
//     const info = await transporter.sendMail({
//       from: '"Test App" <no-reply@hotel.com>',
//       to: invite.email,
//       subject: `Invitation : ${evenement.nom_evenement}`,
//       html,
//     });

//     console.log("Message sent: %s", info.messageId);
//     console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

//     // Update invite status
//     await updateInvite(id, { statut: "invite" });

//     res.json({
//       message: "Invitation envoyée",
//       previewUrl: nodemailer.getTestMessageUrl(info),
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

export default router;
