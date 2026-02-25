// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../auth/UseAuth.jsx';
import { useToast } from '../Components/Toast.jsx';
import '../styles/forms.css';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();

    // Validation FRONT = juste confort utilisateur (le BACK reste la vraie sécurité)
    if (!email.includes('@') || motDePasse.length < 8) {
      toast.error("Email invalide ou mot de passe < 8 caractères");
      return;
    }

    const result = await login(email, motDePasse);

    if (!result.ok) {
      toast.error(result.error || "Connexion échouée");
      return;
    }

    toast.success("Connexion réussie");
    navigate('/', { replace: true });
  }

  return (
    <div className="authPage">
      <div className="authCard">
        <h1>Connexion</h1>
        <p className="muted">Accès employés — Hôtel La Promenade</p>

        <form onSubmit={handleSubmit} className="form">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />

          <label>Mot de passe</label>
          <input type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />

          <button className="btn btnPrimary" type="submit">Se connecter</button>
        </form>
      </div>
    </div>
  );
}