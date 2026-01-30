create database HotelDB;
use HotelDB;

drop table if exists roles;
CREATE TABLE roles (
    id_role INT AUTO_INCREMENT PRIMARY KEY,
    nom_role VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO roles (nom_role) VALUES
('Administrateur'),
('Organisateur'),
('Coordonnateur'),
('Comptabilite');

drop table if exists users;
CREATE TABLE users (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    actif BOOLEAN DEFAULT TRUE,
    id_role INT NOT NULL,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_role) REFERENCES roles(id_role)
);

drop table if exists salles;
CREATE TABLE salles (
    id_salle INT AUTO_INCREMENT PRIMARY KEY,
    nom_salle VARCHAR(100) NOT NULL,
    capacite INT NOT NULL,
    equipements TEXT,
    statut VARCHAR(20) DEFAULT 'Disponible'
);
drop table if exists services;
CREATE TABLE services (
    id_service INT AUTO_INCREMENT PRIMARY KEY,
    nom_service VARCHAR(100) NOT NULL,
    description TEXT,
    tarif DECIMAL(10,2) NOT NULL
);

drop table if exists evenements;
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
    FOREIGN KEY (id_salle) REFERENCES salles(id_salle),
    FOREIGN KEY (id_organisateur) REFERENCES users(id_user)
);
drop table if exists reservations;
CREATE TABLE reservations (
    id_reservation INT AUTO_INCREMENT PRIMARY KEY,
    id_salle INT NOT NULL,
    id_evenement INT NOT NULL,
    date_debut DATETIME NOT NULL,
    date_fin DATETIME NOT NULL,
    FOREIGN KEY (id_salle) REFERENCES salles(id_salle),
    FOREIGN KEY (id_evenement) REFERENCES evenements(id_evenement)
);

drop table if exists evenement_services;
CREATE TABLE evenement_services (
    id_evenement INT NOT NULL,
    id_service INT NOT NULL,
    statut VARCHAR(20) DEFAULT 'Demande',
    PRIMARY KEY (id_evenement, id_service),
    FOREIGN KEY (id_evenement) REFERENCES evenements(id_evenement),
    FOREIGN KEY (id_service) REFERENCES services(id_service)
);

drop table if exists factures;
CREATE TABLE factures (
    id_facture INT AUTO_INCREMENT PRIMARY KEY,
    id_evenement INT NOT NULL UNIQUE,
    montant_total DECIMAL(10,2),
    taxes DECIMAL(10,2),
    statut VARCHAR(20) DEFAULT 'En attente',
    date_facture DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_evenement) REFERENCES evenements(id_evenement)
);

drop table if exists paiements;
CREATE TABLE paiements (
    id_paiement INT AUTO_INCREMENT PRIMARY KEY,
    id_facture INT NOT NULL,
    montant DECIMAL(10,2) NOT NULL,
    mode_paiement VARCHAR(50),
    date_paiement DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_facture) REFERENCES factures(id_facture)
);

