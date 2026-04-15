// src/config/jwt.js
// Configuration JWT pour l'authentification token-based

const jwt = require('jsonwebtoken');

const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'netflixlight-secret-key-CHANGE-IN-PRODUCTION',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  algorithm: 'HS256'
};

/**
 * Génère un token JWT pour un utilisateur
 * @param {Object} payload - Données utilisateur à encoder (id, email, username)
 * @returns {string} Token JWT
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.expiresIn,
    algorithm: JWT_CONFIG.algorithm
  });
}

/**
 * Vérifie et décode un token JWT
 * @param {string} token - Token JWT à vérifier
 * @returns {Object|null} Payload decoded ou null si invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_CONFIG.secret, {
      algorithms: [JWT_CONFIG.algorithm]
    });
  } catch (error) {
    console.error('Erreur de vérification JWT :', error.message);
    return null;
  }
}

/**
 * Décode un token JWT sans vérification (debug)
 * @param {string} token - Token JWT
 * @returns {Object|null} Payload decoded
 */
function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = {
  JWT_CONFIG,
  generateToken,
  verifyToken,
  decodeToken
};
