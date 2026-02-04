/**
 * Valide le texte passé en paramètre.
 * @param {string} texte Texte à valider.
 * @returns Une valeur indiquant si le texte est valide ou non.
 */
export const isTexteValid = (texte) => 
    typeof texte === 'string' &&
    texte !== '';

/**
 * Valide l'identifiant passé en paramètre.
 * @param {number} id Identifiant à valider.
 * @returns Une valeur indiquant si l'identifiant est valide ou non.
 */
export const isIdValid = (id) => 
    typeof id === 'number' &&
    Number.isInteger(id) &&
    id > 0;

/**
 * Valide le mot de passe passé en paramètre.
 * @param {string} motDePasse Mot de passe à valider. 
 * @return Une valeur indiquant si le mot de passe est valide ou non.
 */
export const isMotDePasseValid = (motDePasse) => 
    typeof motDePasse === 'string' &&
    motDePasse.length >= 8;
/** * Valide l'email passé en paramètre.
 * @param {string} email Email à valider.
 * @returns Une valeur indiquant si l'email est valide ou non.
 */
export const isEmailValid = (email) => {
    if (typeof email !== 'string') {
        return false;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};