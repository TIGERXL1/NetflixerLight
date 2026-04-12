// src/middleware/rateLimiter.js
// Configuration du rate limiting pour protéger l'API

const rateLimit = require('express-rate-limit');

// Rate limiter général pour toutes les routes API
// 500 requêtes par tranche de 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requêtes maximum
  message: {
    success: false,
    message: 'Trop de requêtes depuis cette adresse IP, veuillez réessayer dans 15 minutes'
  },
  standardHeaders: true, // Retourne les infos dans les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
});

// Rate limiter strict pour les routes d'authentification
// 5 tentatives par tranche de 10 minutes
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 tentatives maximum
  message: {
    success: false,
    message: 'Trop de tentatives de connexion, veuillez réessayer dans 10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Ne compte que les tentatives échouées
});

module.exports = {
  generalLimiter,
  authLimiter
};
