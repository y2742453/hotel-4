# Module d’invitation

## Prérequis

- Node.js 18+
- Base de données MySQL
- Une connexion à la base de données (`db.js`)
- Ces tables doivent exister:
  - `invites`
  - `evenements`
- Un fichier `.env` contenant:
  - `MAILTRAP_USER`
  - `MAILTRAP_PASS`

## Installation des dépendances

Installe les librairies nécessaires :

```bash
npm install nodemailer
npm install json2csv
npm install multer
npm install papaparse xlsx
```

## Configuration de Mailtrap

1. Crée un compte sur Mailtrap (n’importe quel email)
2. Accède à Email Testing → Sandboxes
3. Sélectionne ton inbox sandbox
4. Copie le Username et Password

Exemple:

```
Username: 0a92d7adfcf71b
Password: ****4554
```

Copiee ces valeurs dans votre fichier `.env` :

```env
MAILTRAP_USER=0a92d7adfcf71b
MAILTRAP_PASS=****4554
```

Les emails envoyés seront capturés par Mailtrap, pas réellement envoyés.

## Flux

- Chaque invité est lié à un événement
- Les statuts possibles :
  en_attente
  invite
  confirme
  refuse
- L’envoi d’invitation met à jour le statut en invite
- Les réponses via email (confirm / decline) mettent à jour le statut

## Routes API

**Base URL:** `http://localhost:5001`

## 1. Créer un invité

**POST** `/api/invites`

### Request

#### Headers

```
Content-Type: application/json
```

#### Body (JSON)

```json
{
  "id_evenement": 1,
  "nom": "Ngoga",
  "prenom": "Yann",
  "email": "yann@example.com",
  "statut": "invite"
}
```

### Responses

#### 201 - Créé

```json
{
  "message": "Invité ajouté",
  "id_invite": 10
}
```

#### 400 - Données manquantes

```json
{
  "error": "Données manquantes"
}
```

#### 409 - Email déjà utilisé

```json
{
  "error": "Email déjà invité"
}
```

#### 500 - Erreur serveur

```json
{
  "error": "Erreur serveur"
}
```

## 2. Mettre à jour un invité

**PUT** `/api/invites/:id`

### Request

#### Headers

```
Content-Type: application/json
```

#### Body (JSON)

```json
{
  "nom": "Ngoga",
  "prenom": "Yann",
  "email": "yann@example.com",
  "statut": "confirme"
}
```

### Responses

#### 200 - Succès

```json
{
  "message": "Invité mis à jour"
}
```

#### 404 - Invité non trouvé

```json
{
  "error": "Invité non trouvé"
}
```

#### 409 - Email déjà utilisé

```json
{
  "error": "Email déjà utilisé"
}
```

#### 500 - Erreur serveur

```json
{
  "error": "Erreur serveur"
}
```

## 3. Supprimer un invité

**DELETE** `/api/invites/:id`

### Responses

#### 204 - Succès (pas de contenu)

Aucun body retourné

#### 404 - Invité non trouvé

```json
{
  "error": "Invité introuvable"
}
```

#### 500 - Erreur serveur

```json
{
  "error": "Erreur serveur"
}
```

## 4. Obtenir les invités d'un événement

**GET** `/api/invites/event/:id_evenement`

### Responses

#### 200 - Succès

```json
[
  {
    "id_invite": 10,
    "nom": "Ngoga",
    "prenom": "Yann",
    "email": "yann@example.com",
    "statut": "invite",
    "id_evenement": 1,
    "date_invitation": "2025-03-24T10:30:00.000Z"
  },
  {
    "id_invite": 11,
    "nom": "Dupont",
    "prenom": "Marie",
    "email": "marie@example.com",
    "statut": "confirme",
    "id_evenement": 1,
    "date_invitation": "2025-03-24T11:00:00.000Z"
  }
]
```

#### 500 - Erreur serveur

```json
{
  "error": "Erreur serveur"
}
```

## 5. Obtenir les statistiques des invités

**GET** `/api/invites/stats/:id_evenement`

### Responses

#### 200 - Succès

```json
{
  "total": 11,
  "invite": 3,
  "confirme": 2,
  "refuse": 1,
  "en_attente": 5
}
```

#### 500 - Erreur serveur

```json
{
  "error": "Erreur serveur"
}
```

## 6. Envoyer une invitation par email

**POST** `/api/invites/send/:id_invite`

### Description

Envoie un email d'invitation avec un template HTML personnalisé contenant :

- Les détails de l'événement
- Un bouton "Confirmer la présence"
- Un bouton "Décliner l'invitation"

### Responses

#### 200 - Succès

```json
{
  "message": "Invitation envoyée"
}
```

#### 404 - Invité ou événement non trouvé

```json
{
  "error": "Invité non trouvé"
}
```

#### 500 - Erreur serveur

```json
{
  "error": "Erreur lors de l'envoi de l'email"
}
```

## 7. Répondre à une invitation (via lien email)

### Confirmer la présence

**GET** `/api/invites/invitation/:id_invite/confirm`

### Décliner l'invitation

**GET** `/api/invites/invitation/:id_invite/decline`

### Description

Ces routes sont appelées automatiquement lorsque l'invité clique sur les boutons dans l'email d'invitation.

### Comportement

| Route      | Action                | Statut mis à jour |
| ---------- | --------------------- | ----------------- |
| `/confirm` | Confirmer la présence | `confirme`        |
| `/decline` | Refuser l'invitation  | `refuse`          |

### Response

Redirige vers : `${FRONTEND_URL}/merci?statut=confirme` ou `${FRONTEND_URL}/merci?statut=refuse`

### Exemple

```
http://localhost:5001/api/invites/invitation/10/confirm
→ Redirige vers http://localhost:5173/merci?statut=confirme
```

## 8. Importer des invités (CSV/Excel)

**POST** `/api/invites/import/:id_evenement`

### Request

#### Headers

```
Content-Type: multipart/form-data
```

#### Body (Form Data)

| Champ  | Type | Description                              |
| ------ | ---- | ---------------------------------------- |
| `file` | File | Fichier CSV ou Excel (.csv, .xlsx, .xls) |

### Format du fichier CSV

```csv
nom,prenom,email
Dupont,Jean,jean@example.com
Martin,Marie,marie@example.com
Lefebvre,Pierre,pierre@example.com
```

> **Notes importantes:**
>
> - Les colonnes `nom`, `prenom`, `email` sont **obligatoires**
> - Les noms de colonnes sont insensibles à la casse (Nom, NOM, nom acceptés)
> - Les doublons (même email pour le même événement) sont **ignorés**
> - Taille maximum du fichier : **5 MB**

### Responses

#### 200 - Import réussi

```json
{
  "message": "Import terminé",
  "success": 3,
  "errors": 0,
  "total": 3,
  "details": {
    "imported": ["jean@example.com", "marie@example.com", "pierre@example.com"],
    "failed": []
  }
}
```

#### 200 - Import avec erreurs

```json
{
  "message": "Import terminé",
  "success": 2,
  "errors": 1,
  "total": 3,
  "details": {
    "imported": ["jean@example.com", "marie@example.com"],
    "failed": [
      {
        "ligne": 3,
        "erreur": "Email déjà invité",
        "email": "pierre@example.com"
      }
    ]
  }
}
```

#### 400 - Fichier manquant ou invalide

```json
{
  "error": "Fichier requis"
}
```

```json
{
  "error": "Fichier vide ou invalide"
}
```

#### 500 - Erreur serveur

```json
{
  "error": "Erreur lors de l'import"
}
```

## 9. Exporter la liste des invités (CSV)

**GET** `/api/invites/export/:id_evenement`

### Description

Exporte tous les invités d'un événement au format CSV avec encodage UTF-8 (compatible Excel).

### Responses

#### 200 - Succès

Le fichier CSV est téléchargé automatiquement.

**Format du fichier:**

```csv
Nom,Prénom,Email,Statut,Date
"Dupont","Jean","jean@example.com","confirme","24/03/2025"
"Martin","Marie","marie@example.com","invite","24/03/2025"
"Lefebvre","Pierre","pierre@example.com","refuse","24/03/2025"
```

**Headers de réponse:**

```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="invites_1711276800000.csv"
```

#### 404 - Aucun invité

```json
{
  "error": "Aucun invité"
}
```

#### 500 - Erreur serveur

```json
{
  "error": "Erreur serveur"
}
```

### Récapitulatif des routes

| Méthode    | Route                                        | Description                      |
| ---------- | -------------------------------------------- | -------------------------------- |
| **POST**   | `/api/invites`                               | Créer un invité                  |
| **PUT**    | `/api/invites/:id`                           | Modifier un invité               |
| **DELETE** | `/api/invites/:id`                           | Supprimer un invité              |
| **GET**    | `/api/invites/event/:id_evenement`           | Liste des invités d'un événement |
| **GET**    | `/api/invites/stats/:id_evenement`           | Statistiques des invités         |
| **POST**   | `/api/invites/send/:id_invite`               | Envoyer email individuel         |
| **GET**    | `/api/invites/invitation/:id_invite/confirm` | Confirmer présence (lien email)  |
| **GET**    | `/api/invites/invitation/:id_invite/decline` | Refuser invitation (lien email)  |
| **POST**   | `/api/invites/import/:id_evenement`          | Importer CSV/Excel               |
| **GET**    | `/api/invites/export/:id_evenement`          | Exporter CSV                     |

---

### Codes de statut HTTP

| Code    | Signification         | Usage                           |
| ------- | --------------------- | ------------------------------- |
| **200** | OK                    | Requête réussie                 |
| **201** | Created               | Ressource créée avec succès     |
| **204** | No Content            | Suppression réussie             |
| **400** | Bad Request           | Données invalides ou manquantes |
| **404** | Not Found             | Ressource non trouvée           |
| **409** | Conflict              | Doublon détecté                 |
| **500** | Internal Server Error | Erreur serveur                  |

### Statuts d'invités

| Statut       | Description                               |
| ------------ | ----------------------------------------- |
| `invite`     | Invitation envoyée, en attente de réponse |
| `confirme`   | Présence confirmée                        |
| `refuse`     | Invitation refusée                        |
| `en_attente` | En attente de validation                  |

### Variables d'environnement (.env)

```env
PORT="A inserer ici"
DB_HOST="A inserer ici"
DB_USER="A inserer ici"
DB_PASSWORD="A inserer ici"
DB_NAME="A inserer ici"
SESSION_SECRET="A inserer ici"
MAILTRAP_USER="A inserer ici"
MAILTRAP_PASS="A inserer ici"
```

### Template Email

L'email envoyé contient :

- Header avec gradient bleu
- Nom de l'invité personnalisé
- Détails de l'événement (nom, date, description)
- Bouton "Confirmer" (vert)
- Bouton "Refuser" (rouge)
- Footer

## Technologies utilisées

### Dépendances Backend

```json
{
  "express": "^4.x",
  "nodemailer": "^6.x",
  "multer": "^1.x",
  "json2csv": "^6.x",
  "papaparse": "^5.x",
  "xlsx": "^0.18.x",
  "mysql2": "^3.x"
}
```

### Installations Backend

```bash
npm install express nodemailer multer json2csv papaparse xlsx mysql2
```

### Frontend

```json
{
  "react": "^19.x",
  "react-dom": "^19.x",
  "react-icons": "^5.x",
  "papaparse": "^5.x",
  "xlsx": "^0.18.x",
  "react-router-dom": "^7.x"
}
```

### Installations Frontend

```bash
npm install react react-dom react-icons papaparse xlsx react-router-dom
```
