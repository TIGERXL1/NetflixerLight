// src/utils/response.js
// Helpers pour formater les réponses HTTP

/**
 * Envoie une réponse de succès
 * @param {Object} res - Objet réponse Express
 * @param {string} message - Message de succès
 * @param {Object} data - Données à retourner
 * @param {number} statusCode - Code HTTP (défaut: 200)
 */
function successResponse(res, message = 'Succès', data = null, statusCode = 200) {
  const response = {
    success: true,
    message
  };

  if (data) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
}

/**
 * Envoie une réponse d'erreur
 * @param {Object} res - Objet réponse Express
 * @param {string} message - Message d'erreur
 * @param {number} statusCode - Code HTTP (défaut: 400)
 * @param {Object} errors - Détails des erreurs
 */
function errorResponse(res, message = 'Erreur', statusCode = 400, errors = null) {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
}

module.exports = {
  successResponse,
  errorResponse
};
