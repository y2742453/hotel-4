SET NAMES utf8mb4;

SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS HotelDB_Test;

USE HotelDB_Test;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS invites;

DROP TABLE IF EXISTS paiements;

DROP TABLE IF EXISTS factures;

DROP TABLE IF EXISTS evenement_services;

DROP TABLE IF EXISTS reservations;

DROP TABLE IF EXISTS evenements;

DROP TABLE IF EXISTS services;

DROP TABLE IF EXISTS salles;

DROP TABLE IF EXISTS users;

DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- ROLES
-- =========================
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

-- =========================
-- USERS
-- =========================
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

-- =========================
-- SALLES (FIX: cout REQUIRED)
-- =========================
CREATE TABLE salles (
    id_salle INT AUTO_INCREMENT PRIMARY KEY,
    nom_salle VARCHAR(100) NOT NULL,
    cout DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    capacite INT NOT NULL,
    equipements TEXT,
    statut VARCHAR(20) DEFAULT 'Disponible',
    type VARCHAR(100)
);

-- =========================
-- SERVICES
-- =========================
CREATE TABLE services (
    id_service INT AUTO_INCREMENT PRIMARY KEY,
    nom_service VARCHAR(100),
    tarif DECIMAL(10, 2) DEFAULT 0
);

-- =========================
-- EVENEMENTS (FIX: required fields)
-- =========================
CREATE TABLE evenements (
    id_evenement INT AUTO_INCREMENT PRIMARY KEY,
    nom_evenement VARCHAR(150) NOT NULL,
    type_evenement VARCHAR(50) DEFAULT 'Test',
    description TEXT,
    date_debut DATETIME NOT NULL,
    date_fin DATETIME NOT NULL,
    statut VARCHAR(20) DEFAULT 'Brouillon',
    id_salle INT NOT NULL,
    id_organisateur INT NOT NULL,
    FOREIGN KEY (id_salle) REFERENCES salles (id_salle),
    FOREIGN KEY (id_organisateur) REFERENCES users (id_user)
);

-- =========================
-- RESERVATIONS
-- =========================
CREATE TABLE reservations (
    id_reservation INT AUTO_INCREMENT PRIMARY KEY,
    id_salle INT NOT NULL,
    id_evenement INT NOT NULL,
    date_debut DATETIME NOT NULL,
    date_fin DATETIME NOT NULL,
    FOREIGN KEY (id_salle) REFERENCES salles (id_salle),
    FOREIGN KEY (id_evenement) REFERENCES evenements (id_evenement)
);

-- =========================
-- EVENEMENT SERVICES
-- =========================
CREATE TABLE evenement_services (
    id_evenement INT,
    id_service INT,
    quantite INT DEFAULT 1,
    montant_estime DECIMAL(10, 2) DEFAULT 0,
    statut VARCHAR(20) DEFAULT 'Valide'
);

-- =========================
-- FACTURES
-- =========================
CREATE TABLE factures (
    id_facture INT AUTO_INCREMENT PRIMARY KEY,
    id_evenement INT NOT NULL,
    montant_total DECIMAL(10, 2) NOT NULL,
    taxes DECIMAL(10, 2) DEFAULT 0,
    statut VARCHAR(20) DEFAULT 'en_attente',
    stripe_session_id VARCHAR(255),
    stripe_payment_intent VARCHAR(255),
    date_facture DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_evenement) REFERENCES evenements (id_evenement)
);

-- =========================
-- PAIEMENTS
-- =========================
CREATE TABLE paiements (
    id_paiement INT AUTO_INCREMENT PRIMARY KEY,
    id_facture INT,
    montant DECIMAL(10, 2),
    stripe_payment_intent VARCHAR(255),
    FOREIGN KEY (id_facture) REFERENCES factures (id_facture)
);

-- =========================
-- INVITES
-- =========================
CREATE TABLE invites (
    id_invite INT AUTO_INCREMENT PRIMARY KEY,
    id_evenement INT NOT NULL,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    email VARCHAR(150),
    statut VARCHAR(20) DEFAULT 'en_attente',
    date_invitation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_evenement) REFERENCES evenements (id_evenement)
);