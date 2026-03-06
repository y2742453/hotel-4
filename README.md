# Installation du projet Hotel-4

```bash
git clone https://github.com/y2742453/hotel-4.git
cd hotel-4
cd Backend
npm install
```

Dans `Backend/.env`, ajouter :

- PORT
- DB_HOST
- DB_USER
- DB_PASSWORD
- DB_NAME
- SESSION_SECRET

Par exemple :

```env
PORT=5001
DB_HOST=localhost
DB_USER=admin
DB_PASSWORD=admin
DB_NAME=HotelDB
SESSION_SECRET="hkjdshfkjnhfkjdnhfjdhfkjdfdfdn"
```

Vous pouvez modifier le fichier `.env` selon vos besoins pour qu'il corresponde à votre configuration MySQL locale.

Il faut donner les permissions nécessaires si vous créez un utilisateur (ici `admin`) avec une commande comme :

```sql
GRANT ALL PRIVILEGES ON HotelDB.* TO 'admin'@'%';
FLUSH PRIVILEGES;
```

Importer le schéma :

```bash
mysql -u admin -p < Database/schema.sql
```

Entrer le mot de passe : `admin` (ou `DB_PASSWORD`).

Données pour la démonstration et les tests :

```bash
mysql -u admin -p HotelDB < Database/seed.sql
```

Entrer le mot de passe : `admin` (ou `DB_PASSWORD`).

```bash
cd ../Frontend
npm install
```

Dans `Frontend/.env`, ajouter la route du backend :

```env
VITE_API_URL=http://localhost:5001
```

(Remplacer par votre route backend si différente.)
