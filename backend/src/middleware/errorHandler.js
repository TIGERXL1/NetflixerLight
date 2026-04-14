// src/middleware/errorHandler.js
// Middleware centralisé de gestion des erreurs

/**
 * Middleware de gestion des erreurs globales
 * @param {Error} err - Erreur capturée
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next
 */
function errorHandler(err, req, res, next) {
  console.error('[Error]', err);

  // Erreur de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: err.details
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }

  // Erreur JWT expiré
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expiré'
    });
  }

  // Erreur SQLite
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(400).json({
      success: false,
      message: 'Violation de contrainte de base de données'
    });
  }

  // Erreur par défaut
  const statusCode = err.statusCode || 500;
  
  // En production, masquer les détails sensibles pour les erreurs serveur
  let message = err.message || 'Erreur serveur interne';
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    message = 'Une erreur est survenue. Veuillez reessayer ulterieurement.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * Middleware pour gérer les routes non trouvées
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
