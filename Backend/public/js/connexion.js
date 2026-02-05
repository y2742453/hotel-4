import { isEmailValid, isMotDePasseValid } from './validation.js';

// INSCRIPTION
document.getElementById('form-inscription').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('inscription-email').value;
    const motDePasse = document.getElementById('inscription-password').value;
    const message = document.getElementById('inscription-message');

    if (!isEmailValid(email) || !isMotDePasseValid(motDePasse)) {
        message.textContent = "Email ou mot de passe invalide (8 caractères min)";
        return;
    }

    const response = await fetch('/api/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, motDePasse })
    });

    if (response.status === 201) {
        message.textContent = "Inscription réussie ";
    } else if (response.status === 409) {
        message.textContent = "Utilisateur déjà existant ";
    } else {
        message.textContent = "Erreur lors de l'inscription";
    }
});

// CONNEXION
document.getElementById('form-connexion').addEventListener('submit', async (e) => {
    e.preventDefault();

    const courriel = document.getElementById('connexion-email').value;
    const motDePasse = document.getElementById('connexion-password').value;
    const message = document.getElementById('connexion-message');

    const response = await fetch('/api/connexion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courriel, motDePasse })
    });

    if (response.status === 200) {
        message.textContent = "Connexion réussie 🎉";
    } else {
        const error = await response.json();
        message.textContent = error?.error || "Connexion échouée ";
    }
});
