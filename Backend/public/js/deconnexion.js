document.getElementById('btn-deconnexion').addEventListener('click', async () => {
    const message = document.getElementById('deconnexion-message');

    const response = await fetch('/api/deconnexion', {
        method: 'POST'
    });

    if (response.status === 200) {
        message.textContent = "Déconnexion réussie ";
    } else {
        message.textContent = "Erreur lors de la déconnexion";
    }
});
