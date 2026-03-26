
# Module Événements (`evenement.js`)

## Prérequis

- Node.js 18+
- Connexion MySQL via `db/db.js`
- Tables en base : `evenements`, `reservations`, `evenement_services`, `salles`, `services`

## Diagramme (schéma)
![Diagramme de classe: Gestion evenements](événements.png)



---

## Description

Ce module gère la création d'événements, la création automatique des réservations associées et l'association des services demandés.

Il contient notamment :

- Détection de conflits de réservation.
- Création d'un événement dans une transaction (événement + réservation + associations de services).

---

## Routes API liées

> Les routes sont exposées via le serveur principal (voir `server.js`).

### POST /api/evenements

Crée un événement (et réserve la salle). Body (JSON) :

```json
  {
    "nom_evenement": "Conférence Node",
    "type_evenement": "Conférence",
    "description": "Journée dev",
    "date_debut": "2026-03-01 09:00:00",
    "date_fin": "2026-03-01 17:00:00",
    "statut": "Brouillon",
    "id_salle": 2,
    "id_organisateur": 1,
    "services": [1,3]
  }
  ```

  #### Réponses

  **201 – Créé**

  ```json
  {
    "id_evenement": 42
  }
  ```

  **409 – Conflit**

  ```json
  {
    "error": "Conflit : salle déjà réservée pour ce créneau"
  }
  ```

  **400/500 – Erreur**

  ```json
  {
    "error": "message"
  }
  ```

  ---

  ### 2. Obtenir tous les événements

  **GET** `/api/evenements`

  #### Réponse (200)

  ```json
  [
    {
      "id_evenement": 1,
      "nom_evenement": "Réunion Q1",
      "type_evenement": "Réunion",
      "description": "Réunion trimestrielle",
      "date_debut": "2026-02-20T10:00:00",
      "date_fin": "2026-02-20T12:00:00",
      "statut": "Confirmé",
      "id_salle": 1,
      "id_organisateur": 2
    }
  ]
  ```

  **500 – Erreur serveur**

  ```json
  {
    "error": "Erreur serveur"
  }
  ```

  ---

  ### 3. Obtenir un événement par ID

  **GET** `/api/evenements/:id`

  Retourne l'événement ou `404` si introuvable.

  ---

  ## Exemple d'utilisation (JS)

  ```js
  import { createEvenement } from '../model/evenement.js'

  try {
    const id = await createEvenement({ /* ... */ })
    console.log('ID événement créé:', id)
  } catch (err) {
    if (err.message === 'RESERVATION_CONFLICT') console.error('Conflit de réservation')
    else console.error(err)
  }
  ```

    ---

### 4. Modifier un événement

**PUT** `/api/evenements/:id`

Permet de modifier un événement existant, ainsi que sa réservation et ses services associés.

#### Body (JSON)

```json
{
  "nom_evenement": "Conférence Node JS",
  "type_evenement": "Conférence",
  "description": "Conférence mise à jour",
  "date_debut": "2026-03-01 10:00:00",
  "date_fin": "2026-03-01 18:00:00",
  "statut": "Confirmé",
  "id_salle": 2,
  "services": [1, 2]
}
```

#### Réponses

**200 – Succès**

```json
{
  "message": "Événement modifié avec succès"
}
```

**404 – Introuvable**

```json
{
  "message": "Événement introuvable"
}
```

**409 – Conflit**

```json
{
  "message": "Conflit de réservation pour la salle et la période choisies."
}
```

**500 – Erreur serveur**

```json
{
  "message": "Erreur serveur"
}
```

---

### 5. Annuler un événement

**PUT** `/api/evenements/:id/annuler`

Permet d'annuler un événement (statut = "Annulé").

#### Réponse (200)

```json
{
  "message": "Événement annulé avec succès"
}
```

**404 – Introuvable**

```json
{
  "message": "Événement introuvable"
}
```

**500 – Erreur serveur**

```json
{
  "message": "Erreur serveur"
}
```