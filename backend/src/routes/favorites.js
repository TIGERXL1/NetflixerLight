// src/routes/favorites.js
// Routes pour la gestion des favoris

const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favoritesController');
const { requireAuth } = require('../middleware/auth');

// Toutes les routes de favoris nécessitent l'authentification
router.use(requireAuth);

router.get('/', favoritesController.getUserFavorites);
router.post('/', favoritesController.addFavorite);
router.delete('/:tmdbId/:mediaType', favoritesController.removeFavorite);
router.get('/:tmdbId/:mediaType', favoritesController.checkFavorite);

module.exports = router;
