CREATE DATABASE IF NOT EXISTS HotelDB_Test;

USE HotelDB_Test;

-- Supprimer les tables si elles existent
DROP TABLE IF EXISTS reservations;

DROP TABLE IF EXISTS evenement_services;

DROP TABLE IF EXISTS evenements;

DROP TABLE IF EXISTS services;

DROP TABLE IF EXISTS salles;

DROP TABLE IF EXISTS users;

DROP TABLE IF EXISTS roles;

-- Créer les tables
CREATE TABLE roles (
    id_role INT AUTO_INCREMENT PRIMARY KEY,
    nom_role VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO
    roles (nom_role)
VALUES ('Administrateur'),
    ('Organisateur'),
    ('Coordonnateur'),
    ('Comptabilite');

CREATE TABLE users (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    actif BOOLEAN DEFAULT TRUE,
    id_role INT NOT NULL,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_role) REFERENCES roles (id_role)
);

CREATE TABLE salles (
    id_salle INT AUTO_INCREMENT PRIMARY KEY,
    nom_salle VARCHAR(100) NOT NULL,
    capacite INT NOT NULL,
    equipements TEXT,
    statut VARCHAR(20) DEFAULT 'Disponible'
);

CREATE TABLE evenements (
    id_evenement INT AUTO_INCREMENT PRIMARY KEY,
    nom_evenement VARCHAR(150) NOT NULL,
    type_evenement VARCHAR(50),
    description TEXT,
    date_debut DATETIME NOT NULL,
    date_fin DATETIME NOT NULL,
    statut VARCHAR(20) DEFAULT 'Brouillon',
    id_salle INT NOT NULL,
    id_organisateur INT NOT NULL,
    FOREIGN KEY (id_salle) REFERENCES salles (id_salle),
    FOREIGN KEY (id_organisateur) REFERENCES users (id_user)
);

CREATE TABLE reservations (
    id_reservation INT AUTO_INCREMENT PRIMARY KEY,
    id_salle INT NOT NULL,
    id_evenement INT NOT NULL,
    date_debut DATETIME NOT NULL,
    date_fin DATETIME NOT NULL,
    FOREIGN KEY (id_salle) REFERENCES salles (id_salle),
    FOREIGN KEY (id_evenement) REFERENCES evenements (id_evenement)
);