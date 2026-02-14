# Module de réservation

## Prérequis

- Node.js 18+
- Base de donnée MySQL
- Une connexion à la base de donnée (`db.js`)
- Ces tables doivent exister:
  - `reservations`
  - `salles`
  - `evenements`
- Un fichier `.env` contenant:
  - PORT
  - DB_HOST
  - DB_USER
  - DB_PASSWORD
  - DB_NAME

## Diagramme de classe pour ce module

![Diagramme de classe: Utilisateur, Role, Salle, Evenement, Reservation](/Docs/assets/DiagrammeReservations.png)

## Gestion des conflits

- La détection des conflits de date utilise:
  `date_debut < new_end AND date_fin > new_start`
- Toutes les dates sont au format MySQL `DATETIME`

---

## API – Routes Réservation

### 1. Créer une réservation

**POST** `/api/reservation`

Crée une nouvelle réservation.

#### Body (JSON)

```json
{
  "idSalle": 1,
  "idEvenement": 2,
  "dateDebut": "2026-02-20 10:00:00",
  "dateFin": "2026-02-20 12:00:00"
}
```

#### Réponses

**201 – Créé**

```json
{
  "idReservation": 15
}
```

**409 – Conflit**

```json
{
  "error": "Conflit de réservation"
}
```

**500 – Erreur serveur**

```json
{
  "error": "Erreur serveur"
}
```

---

### 2. Supprimer une réservation

**DELETE** `/api/reservation/:id`

Supprime une réservation existante.

#### Paramètres

| Nom | Type   | Description          |
| --- | ------ | -------------------- |
| id  | number | ID de la réservation |

#### Réponses

**204 – Succès** (pas de contenu)

**404 – Introuvable**

```json
{
  "error": "Réservation introuvable"
}
```

**500 – Erreur serveur**

```json
{
  "error": "Erreur serveur"
}
```

---

### 3. Obtenir les réservations d'une salle

**GET** `/api/reservation/salle/:idSalle`

Retourne toutes les réservations pour une salle.

#### Paramètres

| Nom     | Type   | Description    |
| ------- | ------ | -------------- |
| idSalle | number | ID de la salle |

#### Réponse

**200 – Succès**

```json
[
  {
    "id_reservation": 15,
    "id_salle": 1,
    "id_evenement": 2,
    "nom_evenement": "Réunion Q1",
    "date_debut": "2026-02-20T10:00:00",
    "date_fin": "2026-02-20T12:00:00",
    "description": "Réunion trimestrielle"
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

### 4. Obtenir une réservation par ID

**GET** `/api/reservation/:id`

Retourne une réservation spécifique.

#### Paramètres

| Nom | Type   | Description          |
| --- | ------ | -------------------- |
| id  | number | ID de la réservation |

#### Réponses

**200 – Succès**

```json
{
  "id_reservation": 15,
  "id_salle": 1,
  "id_evenement": 2,
  "date_debut": "2026-02-20T10:00:00",
  "date_fin": "2026-02-20T12:00:00"
}
```

**404 – Introuvable**

```json
{
  "error": "Réservation introuvable"
}
```

**500 – Erreur serveur**

```json
{
  "error": "Erreur serveur"
}
```

---

## API – Routes Salles

### 5. Obtenir toutes les salles

**GET** `/api/salles`

Retourne la liste de toutes les salles disponibles.

#### Réponse

**200 – Succès**

```json
[
  {
    "id_salle": 1,
    "nom_salle": "Salle Versailles",
    "capacite": 100,
    "equipements": "Projecteur, Micro, Wifi",
    "statut": "Disponible"
  },
  {
    "id_salle": 2,
    "nom_salle": "Salle Champs-Élysées",
    "capacite": 50,
    "equipements": "Écran, Wifi",
    "statut": "Disponible"
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

## API – Routes Événements

### 6. Obtenir tous les événements

**GET** `/api/evenements`

Retourne la liste de tous les événements.

#### Réponse

**200 – Succès**

```json
[
  {
    "id_evenement": 1,
    "nom_evenement": "Réunion Q1",
    "type_evenement": "Réunion",
    "description": "Réunion trimestrielle",
    "date_debut": "2026-02-20T10:00:00",
    "date_fin": "2026-02-20T12:00:00",
    "statut": "Confirme",
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

<br>

# Utilisation du calendrier (Frontend)

Ce calendrier permet de voir, créer et supprimer des réservations de salles.

## 1. Filtrer les salles

- Utilisez les **filtres** en haut de page pour trouver une salle:
  - **Capacité minimale**: Entrez un nombre (ex: 50)
  - **Équipement**: Tapez un équipement (ex: Projecteur)
- Cliquez sur **Réinitialiser** pour effacer les filtres.
- Le nombre de salles disponibles s'affiche sous les filtres.

## 2. Sélectionner une salle

- Choisissez une **salle** dans la liste déroulante.
- Les **détails de la salle** apparaissent (capacité, équipements, statut).
- Les réservations existantes s'affichent dans le calendrier.

## 3. Naviguer dans le calendrier

- Changez la vue:
  - **Jour** - Vue d'une journée
  - **Semaine** - Vue d'une semaine (par défaut sur ordinateur)
  - **Mois** - Vue mensuelle
- Utilisez les boutons:
  - **←** Précédent
  - **→** Suivant
  - **Aujourd'hui** - Retour à la date actuelle

## 4. Créer une réservation

1. **Sélectionnez une salle** (obligatoire).
2. **Cliquez et glissez** sur une période libre dans le calendrier.
3. Une fenêtre s'ouvre avec:
   - Les dates pré-remplies
4. **Sélectionnez un événement** dans la liste.
5. **Vérifiez** les dates et heures.
6. Cliquez sur **Créer**.
7. Une fenêtre de **confirmation** s'affiche avec le résumé.
8. Cliquez sur **Confirmer** pour créer la réservation.

### Messages possibles:

- **"Cette salle est déjà réservée pour cette période"** - Il y a un conflit.
- **"Veuillez sélectionner une salle"** - Vous devez d'abord choisir une salle.

## 5. Voir les détails d'une réservation

- Cliquez sur une **réservation** dans le calendrier.
- Une fenêtre affiche:
  - Nom de l'événement
  - Date et heure de début
  - Date et heure de fin
  - Description de l'événement

## 6. Supprimer une réservation

1. Cliquez sur la **réservation** dans le calendrier.
2. Cliquez sur le bouton **Supprimer**.
3. Confirmez la suppression.
4. La réservation disparaît du calendrier.

## 7. Notes importantes

### Restrictions:

- Vous devez **sélectionner une salle** avant de créer une réservation.
- Les événements affichés sont **filtrés par salle** (seuls les événements associés à la salle sélectionnée apparaissent).
- Les heures disponibles sont de **07:00 à 22:00**.

### Filtres:

- Si vous filtrez les salles et que la salle sélectionnée ne correspond plus aux critères, elle sera **automatiquement désélectionnée**.
- Le calendrier affiche uniquement les réservations de la **salle sélectionnée**.

---

## Dépendances Frontend

Le calendrier utilise les bibliothèques suivantes:

```json
{
  "@fullcalendar/react": "^6.x",
  "@fullcalendar/timegrid": "^6.x",
  "@fullcalendar/daygrid": "^6.x",
  "@fullcalendar/interaction": "^6.x",
  "@fullcalendar/core": "^6.x"
}
```

## Installation

```bash
npm install @fullcalendar/react @fullcalendar/timegrid @fullcalendar/daygrid @fullcalendar/interaction
```
