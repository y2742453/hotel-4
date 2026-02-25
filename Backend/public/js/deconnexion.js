document.getElementById('btn-deconnexion').addEventListener('click', async () => {
  const msg = document.getElementById('deconnexion-message');

  const response = await fetch('/api/deconnexion', {
    method: 'POST',
    credentials: 'include'
  });

  msg.textContent = (response.status === 200)
    ? "Déconnexion réussie"
    : "Erreur lors de la déconnexion";
});
