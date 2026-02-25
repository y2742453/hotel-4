import express from 'express'
import { pool } from './db/db.js'
import {
  getSalles,
  getSalleById,
  createSalle,
  updateSalle,
  deleteSalle
} from './model/salle.js'
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService
} from './model/service.js'
import { createEvenement } from './model/evenement.js'



const app = express()
app.use(express.json())
// Servir les fichiers statiques du frontend
app.use(express.static('public'))
// Test Serveur
app.get('', (req, res) => {
  res.send('Backend Hôtel La Promenade fonctionne ✅')
})
// Test DB
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok')
    res.json(rows[0])
  } catch (err) {
    console.error('DB ERROR:', err.code, err.message)
    res.status(500).json({
      code: err.code,
      message: err.message
    })
  }
})



// GET toutes les salles
app.get('/api/salles', async (req, res) => {
  const salles = await getSalles()
  res.json(salles)
})

// GET salle par id
app.get('/api/salles/:id', async (req, res) => {
  const salle = await getSalleById(req.params.id)
  if (!salle) {
    return res.status(404).json({ message: 'Salle introuvable' })
  }
  res.json(salle)
})

// POST ajouter salle
app.post('/api/salles', async (req, res) => {
  const id = await createSalle(
    req.body.nom_salle,
    req.body.capacite,
    req.body.equipements,
    req.body.statut
  )
  res.status(201).json({ id })
})

// PUT modifier salle
app.put('/api/salles/:id', async (req, res) => {
  const ok = await updateSalle(
    req.params.id,
    req.body.nom_salle,
    req.body.capacite,
    req.body.equipements,
    req.body.statut
  )

  if (!ok) {
    return res.status(404).json({ message: 'Salle introuvable' })
  }

  res.json({ message: 'Salle modifiée' })
})

// DELETE salle
app.delete('/api/salles/:id', async (req, res) => {
  const ok = await deleteSalle(req.params.id)
  if (!ok) {
    return res.status(404).json({ message: 'Salle introuvable' })
  }
  res.json({ message: 'Salle supprimée' })
})

// =====================
// API - SERVICES
// =====================

// GET tous les services
app.get('/api/services', async (req, res) => {
  try {
    const services = await getServices()
    res.json(services)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET service par id
app.get('/api/services/:id', async (req, res) => {
  try {
    const service = await getServiceById(req.params.id)
    if (!service) return res.status(404).json({ message: 'Service introuvable' })
    res.json(service)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// POST ajouter un service
app.post('/api/services', async (req, res) => {
  try {
    const { nom_service, description, tarif } = req.body

    if (!nom_service || nom_service.trim().length < 2) {
      return res.status(400).json({ message: 'nom_service est requis' })
    }

    const t = Number(tarif)
    if (Number.isNaN(t) || t < 0) {
      return res.status(400).json({ message: 'tarif doit être un nombre >= 0' })
    }

    const id_service = await createService(nom_service, description, t)
    res.status(201).json({ id_service })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// PUT modifier un service
app.put('/api/services/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { nom_service, description, tarif } = req.body

    const t = Number(tarif)
    if (Number.isNaN(t) || t < 0) {
      return res.status(400).json({ message: 'tarif doit être un nombre >= 0' })
    }

    const ok = await updateService(id, nom_service, description, t)
    if (!ok) return res.status(404).json({ message: 'Service introuvable' })

    res.json({ message: 'Service modifié' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// DELETE supprimer un service
app.delete('/api/services/:id', async (req, res) => {
  try {
    const ok = await deleteService(req.params.id)
    if (!ok) return res.status(404).json({ message: 'Service introuvable' })
    res.json({ message: 'Service supprimé' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// =====================
// API - EVENEMENTS
// =====================

// GET tous les événements
app.get('/api/evenements', async (req, res) => {
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
    `)

    res.json(rows)
  } catch (err) {
    console.error("GET EVENEMENTS ERROR:", err.code, err.message)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.post('/api/evenements', async (req, res) => {
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
      services
    } = req.body

    // Validation minimale
    if (!nom_evenement || nom_evenement.trim().length < 2) {
      return res.status(400).json({ message: 'nom_evenement est requis' })
    }

    if (!date_debut || !date_fin) {
      return res.status(400).json({ message: 'date_debut et date_fin sont requis' })
    }

    const idSalle = Number(id_salle)
    const idOrg = Number(id_organisateur)

    if (!Number.isInteger(idSalle) || idSalle < 1) {
      return res.status(400).json({ message: 'id_salle invalide' })
    }
    if (!Number.isInteger(idOrg) || idOrg < 1) {
      return res.status(400).json({ message: 'id_organisateur invalide' })
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
      services: Array.isArray(services) ? services.map(Number) : []
    })

    res.status(201).json({ id_evenement })
  } catch (err) {
  console.error("EVENT ERROR:", err.code, err.message, err.sql)

  if (err.message === 'RESERVATION_CONFLICT') {
    return res.status(409).json({ message: 'Conflit : salle déjà réservée pour ce créneau' })
  }

  return res.status(500).json({
    code: err.code || "SERVER_ERROR",
    message: err.message || "Erreur serveur"
  })
}

})



const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Serveur démarré : http://localhost:${PORT}`)
})
