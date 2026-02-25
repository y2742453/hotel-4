// src/auth/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../Api/Client.jsx';

const AuthContext = createContext(null);

// Hook interne (tu as aussi UseAuth.jsx, donc ici c’est pour la base)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);        // utilisateur connecté
  const [loading, setLoading] = useState(true);  // pour attendre /api/me au démarrage

  // Vérifie si l’utilisateur est déjà connecté (session active)
  async function refreshMe() {
    setLoading(true);
    const { res, data } = await apiFetch('/api/me');

    if (res.ok) setUser(data);
    else setUser(null);

    setLoading(false);
  }

  // Connexion
  async function login(email, motDePasse) {
    const { res, data } = await apiFetch('/api/connexion', {
      method: 'POST',
      body: JSON.stringify({ email, motDePasse }),
    });

    // si succès, on recharge l'utilisateur via /api/me
    if (res.ok) {
      await refreshMe();
      return { ok: true };
    }

    return { ok: false, error: data?.error || 'Connexion échouée' };
  }

  // Déconnexion
  async function logout() {
    const { res } = await apiFetch('/api/deconnexion', { method: 'POST' });
    if (res.ok) {
      setUser(null);
      return { ok: true };
    }
    return { ok: false };
  }

  // Au chargement de l’app : on tente de récupérer la session
  useEffect(() => {
    refreshMe();
  }, []);

  const value = { user, loading, login, logout, refreshMe };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  return useContext(AuthContext);
}
