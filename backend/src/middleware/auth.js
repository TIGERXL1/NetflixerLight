// src/middleware/auth.js
// Middleware d'authentification (JWT + Session)

const { verifyToken } = require('../config/jwt');
const { errorResponse } = require('../utils/response');

/**
 * Middleware de vérification JWT
 * Vérifie le token JWT dans l'header Authorization
 */
function requireJWT(req, res, next) {
  try {
    // Récupérer le token depuis l'header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Token non fourni', 401);
    }

    const token = authHeader.substring(7); // Enlever 'Bearer '

    // Vérifier le token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return errorResponse(res, 'Token invalide', 401);
    }

    // Ajouter les infos utilisateur à la requête
    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username
    };

    next();
  } catch (error) {
    return errorResponse(res, 'Erreur d\'authentification', 401);
  }
}

/**
 * Middleware de vérification de session
 * Vérifie la session Express
 */
function requireSession(req, res, next) {
  if (!req.session || !req.session.userId) {
    return errorResponse(res, 'Session invalide', 401);
  }

  // Ajouter userId à la requête si pas déjà fait par JWT
  if (!req.user) {
    req.user = {
      id: req.session.userId
    };
  }

  next();
}

/**
 * Middleware combiné : JWT OU Session
 * L'utilisateur peut s'authentifier avec JWT ou Session
 */
function requireAuth(req, res, next) {
  // Vérifier d'abord le JWT
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return requireJWT(req, res, next);
  }

  // Sinon vérifier la session
  if (req.session && req.session.userId) {
    return requireSession(req, res, next);
  }

  // Aucune authentification valide
  return errorResponse(res, 'Authentification requise', 401);
}

module.exports = {
  requireJWT,
  requireSession,
  requireAuth
};
