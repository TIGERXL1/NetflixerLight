// src/app.js
// Configuration Express de l'application

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const helmet = require('helmet');
const path = require('path');
const config = require('./config');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// Import des routes
const authRoutes = require('./routes/auth');
const moviesRoutes = require('./routes/movies');
const favoritesRoutes = require('./routes/favorites');
const ratingsRoutes = require('./routes/ratings');
const viewingHistoryRoutes = require('./routes/viewingHistory');
const recommendationsRoutes = require('./routes/recommendations');

// Créer l'application Express
const app = express();

// ===== MIDDLEWARE =====

// Helmet - Headers de sécurité HTTP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "https://image.tmdb.org", "data:"],
      connectSrc: ["'self'", "https://api.themoviedb.org"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

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

// Rate limiting sur toutes les routes API
app.use('/api/', generalLimiter);

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
app.use('/api/history', viewingHistoryRoutes);
app.use('/api/recommendations', recommendationsRoutes);

// ===== GESTION DES ERREURS =====

// Route non trouvée
app.use(notFoundHandler);

// Middleware d'erreur global
app.use(errorHandler);

module.exports = app;
