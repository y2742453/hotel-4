# Lancer les tests automatisés

Ce projet utilise **Jest** pour exécuter les tests automatisés avec une base de données MySQL dédiée (`HotelDB_Test`).

---

## 1. Installer les dépendances

Avant tout, installe les dépendances du projet :

```bash
npm install
```

## 2. Configurer les variables d’environnement

Assurez-vous d’avoir un fichier `.test.env` avec les informations de connexion à la base de données :

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=HotelDB_Test
```

## 3. Initialiser la base de données de test

Exécute ton script SQL pour créer la base de données et les tables avec Command Prompt(Windows) ou zsh(Mac):

```bash
mysql -u admin -p < TestDB.sql
```

## 4. Lancer les tests

Pour exécuter tous les tests :

```bash
cd /Backend
npm test
```

## 5. Github

Vous pouvez lancer les test automatisé a partir du github
https://github.com/y2742453/hotel-4/

Dans l'onglet actions:

1. Cliquez `Tests Backend`

2. Puis le bouton `Run workflow`

3. Choississez une branche puis appuyez le bouton `Run workflow`
