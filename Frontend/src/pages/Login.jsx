// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../auth/UseAuth.jsx";
import { useToast } from "../Components/Toast.jsx";
import "../styles/forms.css";
import "../styles/login.css";

import logo from "../assets/Logo.png";

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email.includes("@") || motDePasse.length < 8) {
      toast.error(
        "Veuillez entrer un email valide et un mot de passe d’au moins 8 caractères.",
      );
      return;
    }

    try {
      setLoading(true);

      const result = await login(email, motDePasse);

      if (!result.ok) {
        toast.error(result.error || "Échec de la connexion.");
        return;
      }

      toast.success("Connexion réussie.");
      navigate("/", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="landingPage">
      {/* LEFT SIDE */}
      <div className="landingLeft">
        <img src={logo} alt="Hôtel La Promenade" className="logo" />

        <h1>Hôtel La Promenade</h1>

        <p className="subtitle">
          Plateforme interne de gestion des opérations hôtelières.
        </p>

        <ul className="features">
          <li>Gestion des événements et salles</li>
          <li>Réservations et planification centralisées</li>
          <li>Suivi et statistiques en temps réel</li>
        </ul>
      </div>

      {/* RIGHT SIDE */}
      <div className="landingRight">
        <div className="loginCard">
          <h2>Connexion</h2>
          <p className="muted">Accès réservé au personnel autorisé</p>

          <form onSubmit={handleSubmit} className="form">
            <label htmlFor="email">Adresse email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: admin@hotel.com"
              required
            />

            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              required
            />

            <button className="btn btnPrimary" type="submit" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
