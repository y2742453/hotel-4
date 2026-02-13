// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../auth/UseAuth.jsx';
import '../styles/forms.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [message, setMessage] = useState(null); // {type:'error'|'success', text:''}

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    // validation simple
    if (!email.includes('@') || motDePasse.length < 8) {
      setMessage({ type: 'error', text: "Email invalide ou mot de passe < 8 caractères" });
      return;
    }

    const result = await login(email, motDePasse);

    if (!result.ok) {
      setMessage({ type: 'error', text: result.error });
      return;
    }

    // Redirection selon rôle (après /api/me)
    // Ici on suppose : 1=admin
    // Pour être sûr, on peut refaire un refreshMe mais AuthProvider le fait déjà.
    // On redirige vers une route de base et AppShell affichera le bon menu.
    navigate('/app', { replace: true });
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

          {message && (
            <div className={message.type === 'error' ? 'msg msgError' : 'msg msgSuccess'}>
              {message.text}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
