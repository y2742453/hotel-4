(async () => {
    try {
        const response = await fetch('/api/taches');
        if (response.status === 200) {
            console.log('Utilisateur connecté');
        } else {
            console.log('Utilisateur non connecté');
        }
    } catch {
        console.log('Serveur non disponible');
    }
})();
