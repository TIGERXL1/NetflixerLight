// src/routes/viewingHistory.js
// Routes pour l'historique de visionnage

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const viewingHistoryController = require('../controllers/viewingHistoryController');

// Toutes les routes nécessitent une authentification
router.use(requireAuth);

// POST /api/history - Ajouter une consultation à l'historique
router.post('/', viewingHistoryController.addToHistory);

// GET /api/history - Récupérer l'historique de l'utilisateur
router.get('/', viewingHistoryController.getUserHistory);

// DELETE /api/history - Effacer tout l'historique
router.delete('/', viewingHistoryController.clearHistory);

// DELETE /api/history/:tmdbId/:mediaType - Supprimer une entrée spécifique
router.delete('/:tmdbId/:mediaType', viewingHistoryController.removeHistoryEntry);

// PUT /api/history/:tmdbId/:mediaType/progress - Mettre a jour la progression
router.put('/:tmdbId/:mediaType/progress', viewingHistoryController.updateProgress);

// GET /api/history/:tmdbId/:mediaType/progress - Recuperer la progression
router.get('/:tmdbId/:mediaType/progress', viewingHistoryController.getProgress);

module.exports = router;
