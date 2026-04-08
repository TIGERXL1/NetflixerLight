// src/config/index.js
// Configuration centralisée de l'application

require('dotenv').config();

const config = {
  // Environnement
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,

  // Base de données
  database: require('./database'),

  // JWT
  jwt: require('./jwt'),

  // TMDB API
  tmdb: {
    apiKey: process.env.TMDB_API_KEY || '',
    bearerToken: process.env.TMDB_BEARER_TOKEN || '',
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p'
  },

  // Session
  session: {
    secret: process.env.SESSION_SECRET || 'netflixlight-session-secret-CHANGE-IN-PRODUCTION',
    maxAge: 24 * 60 * 60 * 1000, // 24 heures en millisecondes
    cookieName: 'netflixlight_session'
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5500',
    credentials: true
  },

  // Sécurité
  security: {
    bcryptRounds: 10,
    rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100 // 100 requêtes par fenêtre
  }
};

module.exports = config;
