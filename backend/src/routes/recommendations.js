// src/routes/recommendations.js
// Routes pour les recommandations personnalisées

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const recommendationController = require('../controllers/recommendationController');

// Toutes les routes nécessitent une authentification
router.use(requireAuth);

// GET /api/recommendations - Obtenir des recommandations personnalisées
router.get('/', recommendationController.getRecommendations);

module.exports = router;
