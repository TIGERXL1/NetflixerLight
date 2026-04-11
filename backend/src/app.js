// src/app.js
// Configuration Express de l'application

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const config = require('./config');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import des routes
const authRoutes = require('./routes/auth');
const moviesRoutes = require('./routes/movies');
const favoritesRoutes = require('./routes/favorites');
const ratingsRoutes = require('./routes/ratings');

// Créer l'application Express
const app = express();

// ===== MIDDLEWARE =====

// CORS
app.use(cors(config.cors));

// Parser JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Express
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.env === 'production', // HTTPS en production
    httpOnly: true,
    maxAge: config.session.maxAge,
    sameSite: 'strict'
  },
  name: config.session.cookieName
}));

// Logger simple des requêtes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// ===== ROUTES =====

// Route de santé (health check)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'NetflixLight API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes de l'API
app.use('/api/auth', authRoutes);
app.use('/api/tmdb', moviesRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/ratings', ratingsRoutes);

// ===== GESTION DES ERREURS =====

// Route non trouvée
app.use(notFoundHandler);

// Middleware d'erreur global
app.use(errorHandler);

module.exports = app;
