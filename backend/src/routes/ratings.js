// src/routes/ratings.js
// Routes pour la gestion des notes

const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// Routes CRUD pour les ratings
router.post('/', ratingController.upsertRating);                    // Ajouter/Modifier une note
router.get('/', ratingController.getUserRatings);
router.get('/:tmdbId/:mediaType', ratingController.getRating);      // Récupérer une note spécifique
router.delete('/:tmdbId/:mediaType', ratingController.removeRating); // Supprimer une note spécifique

module.exports = router;
