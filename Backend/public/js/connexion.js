import { isEmailValid, isMotDePasseValid } from "./validation.js";

// INSCRIPTION

// INSCRIPTION
document
  .getElementById("form-inscription")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const nom = document.getElementById("inscription-nom").value.trim();
    const prenom = document.getElementById("inscription-prenom").value.trim();

    const role = document.getElementById("inscription-role").value; // peut être ""

    const email = document.getElementById("inscription-email").value.trim();
    const motDePasse = document.getElementById("inscription-password").value;

    const message = document.getElementById("inscription-message");

    // validation simple
    if (
      !nom ||
      !prenom ||
      !isEmailValid(email) ||
      !isMotDePasseValid(motDePasse)
    ) {
      message.textContent = "Champs invalides";
      return;
    }

    const response = await fetch("/api/inscription", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, prenom, role, email, motDePasse }),
    });

    if (response.status === 201) {
      message.textContent = "Inscription réussie";
    } else if (response.status === 409) {
      message.textContent = "Utilisateur déjà existant";
    } else {
      message.textContent = "Erreur lors de l'inscription";
    }
  });

// CONNEXION
document
  .getElementById("form-connexion")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("connexion-email").value;
    const motDePasse = document.getElementById("connexion-password").value;
    const message = document.getElementById("connexion-message");

    const response = await fetch("/api/connexion", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, motDePasse }),
    });

    if (response.status === 200) {
      message.textContent = "Connexion réussie ";
    } else {
      const error = await response.json();
      message.textContent = "Connexion échouée ";
    }
  });
