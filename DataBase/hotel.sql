SET NAMES utf8mb4;

SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS HotelDB;

USE HotelDB;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS devis;
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

CREATE TABLE roles (
    id_role INT AUTO_INCREMENT PRIMARY KEY,
    nom_role VARCHAR(50) NOT NULL UNIQUE
);

INSERT IGNORE INTO
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

CREATE TABLE services (
    id_service INT AUTO_INCREMENT PRIMARY KEY,
    nom_service VARCHAR(100) NOT NULL,
    description TEXT,
    tarif DECIMAL(10, 2) NOT NULL
);

INSERT INTO
    services (
        nom_service,
        description,
        tarif
    )
VALUES (
        'Traiteur',
        'Service de restauration pour les événements',
        0.00
    ),
    (
        'Audiovisuel',
        'Équipements audiovisuels et assistance technique',
        0.00
    ),
    (
        'Sécurité',
        'Service de sécurité pour événements',
        0.00
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

CREATE TABLE evenement_services (
    id_evenement INT NOT NULL,
    id_service INT NOT NULL,
    statut VARCHAR(20) DEFAULT 'Demande',
    details TEXT NULL,
    quantite INT DEFAULT 1,
    montant_estime DECIMAL(10, 2) DEFAULT 0.00,
    date_demande DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_evenement, id_service),
    FOREIGN KEY (id_evenement) REFERENCES evenements (id_evenement),
    FOREIGN KEY (id_service) REFERENCES services (id_service)
);

CREATE TABLE factures (
    id_facture INT AUTO_INCREMENT PRIMARY KEY,
    id_evenement INT NOT NULL UNIQUE,
    montant_total DECIMAL(10, 2),
    taxes DECIMAL(10, 2),
    statut VARCHAR(20) DEFAULT 'En attente',
    date_facture DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_evenement) REFERENCES evenements (id_evenement)
);

CREATE TABLE paiements (
    id_paiement INT AUTO_INCREMENT PRIMARY KEY,
    id_facture INT NOT NULL,
    montant DECIMAL(10, 2) NOT NULL,
    mode_paiement VARCHAR(50),
    date_paiement DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_facture) REFERENCES factures (id_facture)
);

CREATE TABLE devis (
    id_devis INT AUTO_INCREMENT PRIMARY KEY,
    id_evenement INT NOT NULL,
    id_service INT NOT NULL,
    reference VARCHAR(100) NOT NULL,
    montant_ht DECIMAL(10, 2) DEFAULT 0.00,
    taxes DECIMAL(10, 2) DEFAULT 0.00,
    montant_ttc DECIMAL(10, 2) DEFAULT 0.00,
    statut VARCHAR(20) DEFAULT 'Brouillon',
    pdf_path VARCHAR(255),
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_envoi DATETIME,
    FOREIGN KEY (id_evenement) REFERENCES evenements (id_evenement),
    FOREIGN KEY (id_service) REFERENCES services (id_service)
);

CREATE TABLE invites (
    id_invite INT AUTO_INCREMENT PRIMARY KEY,
    id_evenement INT NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    statut ENUM(
        'invite',
        'confirme',
        'refuse',
        'en_attente'
    ) DEFAULT 'en_attente',
    date_invitation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_evenement) REFERENCES evenements (id_evenement) ON DELETE CASCADE,
    UNIQUE KEY unique_email_event (email, id_evenement)
);