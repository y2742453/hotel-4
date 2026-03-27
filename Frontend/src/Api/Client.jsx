// src/Api/Client.jsx
// BUT : centraliser tous les appels HTTP vers le backend.
// Avantages :
// - on évite de répéter fetch() partout
// - on envoie TOUJOURS les cookies de session (credentials: 'include')
// - on garde un format simple pour gérer les statuts

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";
// Si vide, on appelle le même domaine (utile en production)

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include", // IMPORTANT pour envoyer le cookie de session
  });

  // On tente de lire le JSON seulement si la réponse est du JSON
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : null;

  return { res, data };
}
