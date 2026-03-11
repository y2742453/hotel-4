use HotelDB;

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
    ),
    (
        'Franck',
        'Junior',
        'franck@gmail.com',
        '$2b$10$GqotlpZNY8Kdd4thnB10SeBE67KOFAFIOay/7Bzn0tpKseBZXmteG',
        1,
        1,
        '2026-02-05 11:04:45'
    ),
    (
        'nlmnk',
        'lknmkl',
        'franckjh@gmail.com',
        '$2b$10$Q4dYR7Orruul3SD8sSM0m.VoEzWq7Xu88bwrHWe.eiECp0Ijux8Mu',
        1,
        2,
        '2026-02-05 11:18:49'
    ),
    (
        'norier',
        'linou',
        'franck234@gmail.com',
        '$2b$10$g7Nl9EtHlnpwDqpWHghtl.zjpw2HI7wxl.MRnxwKj7TDxn9qjxbhO',
        1,
        2,
        '2026-02-05 11:43:31'
    ),
    (
        'sgfdgdgz',
        'efreg',
        'fsafdfas@gmail.com',
        '$2b$10$d7oJWdTMmqk22J6A8LLV5uCjEJTy0L8v34nMqzylyZmfBprprKtBm',
        1,
        2,
        '2026-02-05 12:33:03'
    ),
    (
        'werenoi',
        'boul',
        'werenoiboul@gmail.com',
        '$2b$10$sl0mUBERxDv72wPWaH/zNu0cbGd8evPi1bSDTNbqaTkL.fqb7e4vi',
        1,
        3,
        '2026-02-05 13:08:18'
    ),
    (
        'yann',
        'tyuire',
        'yann@gmail.com',
        '$2b$10$cRDscNFZx/fXSjNWRiwWHuUw4zYqoZLDD/F31SOEiGhBjbLmW1hz6',
        1,
        2,
        '2026-02-05 18:30:08'
    ),
    (
        'Ghomba',
        'franck',
        'franckjuniorghomba@gmail.com',
        '$2b$10$m7I34iTV0cbzvs6yM/okk.CQ.gfbBKF4qf.UCcDhdFv6/4BnfGeZ.',
        1,
        1,
        '2026-02-06 09:44:56'
    ),
    (
        'jean',
        'franck',
        'jean@gmail.com',
        '$2b$10$fl5fUwryF57PxqELE3ii6eQLvVB4ZmJqniLsQEP.X6mYSY8xqN.va',
        1,
        3,
        '2026-02-06 13:50:56'
    ),
    (
        'kouam',
        'leaticia',
        'leaticiakouam@gmail.com',
        '$2b$10$tdjuNq..HprXQdOQD1eV3OTNcZh0/DYL5YikaP5JKOUNeZAFES3GG',
        1,
        3,
        '2026-02-09 16:02:11'
    ),
    (
        'kevin',
        'linou',
        'kevin@gmail.com',
        '$2b$10$.RRDW1SDJepHefbFoSYvNugPceSRE16brlOHU.sQFh1J65/BZZWmW',
        1,
        2,
        '2026-02-10 11:00:33'
    ),
    (
        'efren',
        'reyes',
        'efrenreyes@gmail.com',
        '$2b$10$Vg8F0GBgm0SEWLHonLVQhu.WRRuFe5HAW6JvtyD2atNCVAaKQwpL6',
        1,
        3,
        '2026-02-12 20:02:54'
    ),
    (
        'sammuel',
        'etoo ',
        'nmdbmnd@jskfj.com',
        '$2b$10$Nfi5BGExACef1fxb1FvqguUoqugSsnfQtzSApPToKlO3OAZQ0ZLlO',
        1,
        4,
        '2026-02-13 13:46:24'
    ),
    (
        'sammuel',
        'etoo ',
        'nmdbmnd@gmail.com',
        '$2b$10$89cN92nQSFh6VgM2RgvqDOahhry7/LqzaC.66vrz/GLNe7PGpPd9S',
        1,
        1,
        '2026-02-13 13:46:56'
    ),
    (
        'jean ',
        'bobo',
        'jeanbobo@gmail.com',
        '$2b$10$x.P/rvdN6GFxOvBfCTeN7u70m4WN6OvXtMPMLKWc2X6SAnVlQPNze',
        1,
        4,
        '2026-02-13 13:52:50'
    ),
    (
        'joel',
        'lion',
        'joel@gmail.com',
        '$2b$10$TgHMCa3qBII6fqj0DiOA2ep5vZOxC0BXqCo4UwWXaucFM6qCVDcJC',
        1,
        3,
        '2026-02-25 08:10:05'
    );

INSERT INTO
    `salles` (
        `id_salle`,
        `nom_salle`,
        `capacite`,
        `equipements`,
        `statut`
    )
VALUES (
        1,
        'Salle Versailles',
        100,
        'Projecteur',
        'Disponible'
    ),
    (
        2,
        'Salle Champs-Élysées',
        50,
        'Caméra vidéo, Pupitre (lutrin), Table de mixage, Ordinateur portable, Éclairage LED, Générateur électrique, Climatiseur portable, Barrière de sécurité, Scanner de billets, Photobooth',
        'Disponible'
    ),
    (
        3,
        'Salle Montmartre',
        30,
        NULL,
        'Disponible'
    );

INSERT INTO
    `evenements` (
        `id_evenement`,
        `nom_evenement`,
        `type_evenement`,
        `description`,
        `date_debut`,
        `date_fin`,
        `statut`,
        `id_salle`,
        `id_organisateur`
    )
VALUES (
        1,
        'Événement Test',
        'Réunion',
        'Pour tester les réservations : Cette section permet de simuler des réservations afin de vérifier le fonctionnement du système. On peut créer, modifier ou annuler des réservations fictives pour voir comment le calendrier et les notifications réagissent, sans affecter les données réelles.',
        '2026-01-01 00:00:00',
        '2026-12-31 23:59:59',
        'Brouillon',
        1,
        1
    ),
    (
        2,
        'Réunion Projet Alpha',
        'Réunion',
        'Réunion de suivi du projet Alpha',
        '2026-02-15 09:00:00',
        '2026-02-15 10:30:00',
        'Confirmé',
        1,
        1
    ),
    (
        3,
        'Conférence Marketing',
        'Conférence',
        'Présentation des nouvelles stratégies marketing',
        '2026-02-16 11:00:00',
        '2026-02-16 12:30:00',
        'Brouillon',
        2,
        1
    ),
    (
        4,
        'Atelier Design',
        'Atelier',
        'Atelier pratique sur le design UX/UI',
        '2026-02-17 14:00:00',
        '2026-02-17 16:00:00',
        'Confirmé',
        1,
        1
    ),
    (
        5,
        'Séminaire RH',
        'Séminaire',
        'Séminaire sur la gestion des talents',
        '2026-02-18 09:30:00',
        '2026-02-18 12:00:00',
        'Confirmé',
        3,
        1
    ),
    (
        6,
        'Formation Sécurité',
        'Formation',
        'Formation obligatoire sur la sécurité informatique',
        '2026-02-19 13:00:00',
        '2026-02-19 15:00:00',
        'Brouillon',
        2,
        1
    );