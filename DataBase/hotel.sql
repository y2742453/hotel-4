SET NAMES utf8mb4;

SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS HotelDB;

USE HotelDB;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS historique_modifications;

DROP TABLE IF EXISTS evenement_documents;

DROP TABLE IF EXISTS notification_preferences;

DROP TABLE IF EXISTS notifications;

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

-- =========================
-- TABLE ROLES
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
-- TABLE USERS
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
    CONSTRAINT fk_users_roles FOREIGN KEY (id_role) REFERENCES roles (id_role)
);

-- =========================
-- TABLE SALLES
-- =========================
CREATE TABLE salles (
    id_salle INT AUTO_INCREMENT PRIMARY KEY,
    nom_salle VARCHAR(100) NOT NULL,
    cout DECIMAL(10, 2) NOT NULL,
    capacite INT NOT NULL,
    equipements TEXT,
    statut VARCHAR(20) DEFAULT 'Disponible',
    type VARCHAR(100) DEFAULT NULL
);

-- =========================
-- TABLE SERVICES
-- =========================
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
        300.00
    ),
    (
        'Audiovisuel',
        'Équipements audiovisuels et assistance technique',
        200.00
    ),
    (
        'Sécurité',
        'Service de sécurité pour événements',
        100.00
    );

-- =========================
-- TABLE EVENEMENTS
-- =========================
CREATE TABLE evenements (
    id_evenement INT AUTO_INCREMENT PRIMARY KEY,
    nom_evenement VARCHAR(150) NOT NULL,
    type_evenement VARCHAR(50) NOT NULL,
    description TEXT DEFAULT NULL,
    date_debut DATETIME NOT NULL,
    date_fin DATETIME NOT NULL,
    nb_participants INT DEFAULT NULL,
    budget DECIMAL(10, 2) DEFAULT NULL,
    statut VARCHAR(20) DEFAULT 'Brouillon',
    id_salle INT NOT NULL,
    id_organisateur INT NOT NULL,
    updated_at DATETIME DEFAULT NULL,
    CONSTRAINT fk_evenements_salles FOREIGN KEY (id_salle) REFERENCES salles (id_salle),
    CONSTRAINT fk_evenements_users FOREIGN KEY (id_organisateur) REFERENCES users (id_user)
);

-- =========================
-- TABLE RESERVATIONS
-- =========================
CREATE TABLE reservations (
    id_reservation INT AUTO_INCREMENT PRIMARY KEY,
    id_salle INT NOT NULL,
    id_evenement INT NOT NULL,
    date_debut DATETIME NOT NULL,
    date_fin DATETIME NOT NULL,
    CONSTRAINT fk_reservations_salles FOREIGN KEY (id_salle) REFERENCES salles (id_salle),
    CONSTRAINT fk_reservations_evenements FOREIGN KEY (id_evenement) REFERENCES evenements (id_evenement)
);

-- =========================
-- TABLE EVENEMENT_SERVICES
-- =========================
CREATE TABLE evenement_services (
    id_evenement INT NOT NULL,
    id_service INT NOT NULL,
    statut VARCHAR(20) DEFAULT 'Demande',
    details TEXT NULL,
    quantite INT DEFAULT 1,
    montant_estime DECIMAL(10, 2) DEFAULT 0.00,
    date_demande DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_evenement, id_service),
    CONSTRAINT fk_es_evenements FOREIGN KEY (id_evenement) REFERENCES evenements (id_evenement),
    CONSTRAINT fk_es_services FOREIGN KEY (id_service) REFERENCES services (id_service)
);

-- =========================
-- TABLE EVENEMENT_DOCUMENTS
-- =========================
CREATE TABLE evenement_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_evenement INT NOT NULL,
    nom_fichier VARCHAR(255) DEFAULT NULL,
    chemin_fichier VARCHAR(255) DEFAULT NULL,
    type_mime VARCHAR(100) DEFAULT NULL,
    taille INT DEFAULT NULL,
    date_upload DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evenement_documents_evenement FOREIGN KEY (id_evenement) REFERENCES evenements (id_evenement) ON DELETE CASCADE
);

-- =========================
-- TABLE FACTURES
-- =========================
CREATE TABLE factures (
    id_facture INT AUTO_INCREMENT PRIMARY KEY,
    id_evenement INT NOT NULL UNIQUE,
    montant_total DECIMAL(10, 2) NOT NULL,
    taxes DECIMAL(10, 2) DEFAULT 0,
    statut ENUM(
        'paye',
        'en_retard',
        'en_attente'
    ) DEFAULT 'en_attente',
    stripe_session_id VARCHAR(255),
    stripe_payment_intent VARCHAR(255),
    date_facture DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_factures_evenements FOREIGN KEY (id_evenement) REFERENCES evenements (id_evenement)
);

-- =========================
-- TABLE PAIEMENTS
-- =========================
CREATE TABLE paiements (
    id_paiement INT AUTO_INCREMENT PRIMARY KEY,
    id_facture INT NOT NULL,
    montant DECIMAL(10, 2) NOT NULL,
    mode_paiement VARCHAR(50) DEFAULT 'stripe',
    statut ENUM('success', 'failed') DEFAULT 'success',
    stripe_payment_intent VARCHAR(255),
    date_paiement DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_paiements_factures FOREIGN KEY (id_facture) REFERENCES factures (id_facture)
);

-- =========================
-- TABLE DEVIS
-- =========================
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
    date_envoi DATETIME DEFAULT NULL,
    CONSTRAINT fk_devis_evenement FOREIGN KEY (id_evenement) REFERENCES evenements (id_evenement),
    CONSTRAINT fk_devis_service FOREIGN KEY (id_service) REFERENCES services (id_service)
);

-- =========================
-- TABLE INVITES
-- =========================
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
    CONSTRAINT fk_invites_evenement FOREIGN KEY (id_evenement) REFERENCES evenements (id_evenement) ON DELETE CASCADE,
    UNIQUE KEY unique_email_event (email, id_evenement)
);

-- =========================
-- TABLE NOTIFICATIONS
-- =========================
CREATE TABLE notifications (
    id_notification INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    type_notification VARCHAR(50) NOT NULL,
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    lien VARCHAR(255) DEFAULT NULL,
    lu BOOLEAN DEFAULT FALSE,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (id_user) REFERENCES users (id_user) ON DELETE CASCADE
);

-- =========================
-- TABLE NOTIFICATIONS Preferences
-- =========================
CREATE TABLE notification_preferences (
    id_preference INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL UNIQUE,
    canal_interne BOOLEAN DEFAULT TRUE,
    canal_email BOOLEAN DEFAULT FALSE,
    canal_sms BOOLEAN DEFAULT FALSE,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_preferences_user FOREIGN KEY (id_user) REFERENCES users (id_user) ON DELETE CASCADE
);

-- =========================
-- TABLE HISTORIQUE_MODIFICATIONS
-- =========================
CREATE TABLE historique_modifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_evenement INT NOT NULL,
    id_user INT NOT NULL,
    champ_modifie VARCHAR(100),
    ancienne_valeur TEXT,
    nouvelle_valeur TEXT,
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FOREIGN KEY (id_evenement) REFERENCES evenements (id_evenement),
    CONSTRAINT FOREIGN KEY (id_user) REFERENCES users (id_user)
);

INSERT INTO
    `users` (
        `nom`,
        `prenom`,
        `email`,
        `mot_de_passe`,
        `actif`,
        `id_role`,
        `date_creation`
    )
VALUES (
        'Admin',
        'System',
        'admin@hotel.com',
        '$2b$10$GEjPDdjVrCXQtQXXr18GxeL5TYfcOTgEK8.KTxy8vrjZLwjYB1SBq',
        1,
        1,
        NOW()
    );