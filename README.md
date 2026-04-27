# Hotel-4

Application web de gestion d'événements pour un hôtel.

## Prérequis

Les logiciels suivants doivent être installés avant d'exécuter le projet :

1. Node.js: [https://nodejs.org/fr/download](https://nodejs.org/fr/download)
2. MySQL Server: [https://dev.mysql.com/downloads/mysql/](https://dev.mysql.com/downloads/mysql/)
3. MySQL Workbench (optionnel pour gérer la base de données):
   [https://dev.mysql.com/downloads/workbench/](https://dev.mysql.com/downloads/workbench/)
4. Git: [https://git-scm.com/install/](https://git-scm.com/install/)

## Installation du projet Hotel-4

```bash
git clone https://github.com/y2742453/hotel-4.git
cd hotel-4
cd Backend
npm install
```

Dans `Backend/.env`, ajouter :

- PORT
- DB_HOST
- DB_PORT
- DB_USER
- DB_PASSWORD
- DB_NAME
- SESSION_SECRET
- MAIL_HOST
- MAIL_PORT
- MAIL_USER
- MAIL_PASS
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET

Par exemple :

```env
PORT=5001
DB_HOST=localhost
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=admin
DB_NAME=HotelDB
SESSION_SECRET="hkjdshfkjnhfkjdnhfjdhfkjdfdfdn"
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=6a3af3ba3016dd
MAIL_PASS=85c5d8a2e6ff3f
STRIPE_SECRET_KEY=sk_test_51TJle69...
STRIPE_PUBLISHABLE_KEY=pk_test_51TJle69...
STRIPE_WEBHOOK_SECRET=whsec_fc545c...
```

Vous pouvez modifier le fichier `.env` selon vos besoins pour qu'il corresponde à votre configuration MySQL locale.

### Configuration de la base de données

Premierement, il faut creer un utilisateur `admin` avec mot de passe `admin`.

Il faut donner les permissions nécessaires à partir de `root` si vous créez un utilisateur (ici `admin`) avec une commande comme :

```sql
GRANT ALL PRIVILEGES ON HotelDB.* TO 'admin'@'%';
FLUSH PRIVILEGES;
```

La commande ci-dessous permet de donner les permissions apartir du root sur Command Prompt(Windows) ou zsh(Mac):

```bash
mysql -u root -p -e "GRANT ALL PRIVILEGES ON HotelDB.* TO 'admin'@'%'; FLUSH PRIVILEGES;"
```

Depuis workbench ou un query sql copiez, coller et executer le contenu de `hotel.sql`

Ou importer le schéma avec cette commande sur Command Prompt(Windows) ou zsh(Mac):

```bash
mysql -u admin -p < Database/hotel.sql
```

Entrer le mot de passe défini dans DB_PASSWORD.

Données pour la démonstration et les tests :

Depuis workbench ou un query sql copiez, coller et executer le contenu de `seed.sql`

Ou sur Command Prompt(Windows) ou zsh(Mac):

```bash
mysql -u admin -p HotelDB < Database/seed.sql
```

Entrer le mot de passe défini dans DB_PASSWORD.

```bash
cd ../Frontend
npm install
```

Dans `Frontend/.env`, ajouter la route du backend :

```env
VITE_API_URL=http://localhost:5001
```

### Lancer le projet:

Tout d'abord, ouvrir deux terminaux (bash ou cmd).

- Depuis un premier terminal

```bash
cd Backend
npm run dev
```

La console doit afficher le message `Connecté à la base de données MySQL`

- Depuis le deuxième terminal

```bash
cd Frontend
npm run dev
```

Les deux terminaux doivent se lancer sans erreur.

L'application sera accessible à l'adresse suivante :

http://localhost:5173

### Compte administrateur par défaut:

Email: admin@hotel.com

Mot de passe: admin123

Pour des raisons de sécurité, il est fortement recommandé de changer ce mot de passe.
