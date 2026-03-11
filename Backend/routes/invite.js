import express from "express";
import multer from "multer";
import Papa from "papaparse";
import XLSX from "xlsx";

import { addInvite, getInviteByEmailAndEvent } from "../modele/invite.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/import/:idEvenement", upload.single("file"), async (req, res) => {
  const { idEvenement } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: "Fichier requis" });
  }

  let rows = [];

  try {
    // Parse CSV
    if (req.file.mimetype.includes("csv")) {
      const text = req.file.buffer.toString();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      rows = parsed.data.map((row) => {
        const cleanRow = {};
        for (const key in row) {
          cleanRow[key.trim()] = row[key]?.trim();
        }
        return cleanRow;
      });
    } else {
      // Parse Excel
      const workbook = XLSX.read(req.file.buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet).map((row) => {
        const cleanRow = {};
        for (const key in row) {
          cleanRow[key.trim()] = String(row[key]).trim();
        }
        return cleanRow;
      });
    }

    let added = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of rows) {
      const nom = (row.nom || row.Nom || "").trim();
      const prenom = (row.prenom || row.Prenom || "").trim();
      const email = (row.email || row.Email || "").trim();

      if (!nom || !prenom || !email) {
        errors++;
        continue;
      }

      try {
        // Convert string to number when checking/adding to DB
        const eventId = Number(idEvenement);

        const existing = await getInviteByEmailAndEvent(email, eventId);
        if (existing) {
          skipped++;
          continue;
        }

        await addInvite({
          idEvenement: eventId,
          nom,
          prenom,
          email,
          statut: "invite",
        });
        added++;
      } catch (err) {
        console.error("Failed to insert invite:", {
          nom,
          prenom,
          email,
          error: err.message,
        });
        errors++;
      }
    }

    res.json({
      message: "Import terminé",
      invitesAjoutes: added,
      invitesExistant: skipped,
      erreurs: errors,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'import" });
  }
});

export default router;
