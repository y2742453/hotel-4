import {isTexteValid,isIdValid,isMotDePasseValid,isEmailValid} from '../public/js/validation.js';

/**
 * Middleware : valide un champ texte générique
 */
export function texteEstValide(request, response, next) {
  if (isTexteValid(request.body.texte)) {
    return next();
  }
  response.status(400).json({ message: 'Texte invalide' });
}

/**
 * Middleware : valide un identifiant (id)
 */
export function idEstValide(request, response, next) {
  if (isIdValid(request.body.id)) {
    return next();
  }
  response.status(400).json({ message: 'Identifiant invalide' });
}

/**
 * Middleware : valide un email
 */
export function emailEstValide(request, response, next) {
  if (isEmailValid(request.body.email)) {
    return next();
  }
  response.status(400).json({ message: 'Email invalide' });
}

/**
 * Middleware : valide un mot de passe
 */
export function motDePasseEstValide(request, response, next) {
  if (isMotDePasseValid(request.body.motDePasse)) {
    return next();
  }
  response.status(400).json({
    message: 'Mot de passe invalide (minimum 8 caractères)'
  });
}

/**
 * Middleware : validation complète pour la connexion (US-001)
 */

export function loginEstValide(request, response, next) {
  const { email, motDePasse } = request.body;

  if (
    isEmailValid(email) &&
    isMotDePasseValid(motDePasse)
  ) {
    return next();
  }

  response.status(400).json({
    message: 'Email ou mot de passe invalide'
  });
}