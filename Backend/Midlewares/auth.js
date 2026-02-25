/**
 * Middleware pour s'assurer que l'utilisateur accédant à une route d'API
 * est authentifié (connecté).
 * 
 * Nécessite Passport + session.
 * 
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @param {import("express").NextFunction} next
 */
export function userAuth(request, response, next) {
    // Passport ajoute request.user si l'utilisateur est connecté
    if (request.user) {
        return next();
    }

    // Utilisateur non authentifié
    response.status(401).json({
        message: 'Accès non autorisé : utilisateur non connecté'
    });
}

/**
 * Middleware pour s'assurer que l'utilisateur accédant à une route d'API
 * n'est PAS connecté.
 * 
 * Utile pour : /login, /register
 * 
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @param {import("express").NextFunction} next
 */
export function userNotAuth(request, response, next) {
    if (!request.user) {
        return next();
    }

    // Utilisateur déjà connecté
    response.status(401).json({
        message: 'Action non autorisée : utilisateur déjà connecté'
    });
}

/**
 * Middleware pour les routes de pages (HTML)
 * qui ne doivent pas être accessibles par des utilisateurs connectés.
 * 
 * Exemple : page /login
 * 
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @param {import("express").NextFunction} next
 */
export function userNotAuthRedirect(request, response, next) {
    if (!request.user) {
        return next();
    }

    // Utilisateur connecté → redirection vers l'accueil
    response.redirect('/');
}

/**
 * Middleware pour restreindre l'accès à une route d'API
 * à certains rôles d'utilisateurs.
 */
export function allowRoles(...rolesAutorises) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Non connecté" });
    }

    if (!rolesAutorises.includes(req.user.id_role)) {
      return res.status(403).json({ message: "Accès interdit" });
    }

    next();
  };
}


