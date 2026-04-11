// src/controllers/recommendationController.js
// Contrôleur pour les recommandations personnalisées

const RecommendationService = require('../services/recommendationService');
const { successResponse, errorResponse } = require('../utils/response');

class RecommendationController {
  /**
   * GET /api/recommendations
   * Génère des recommandations personnalisées pour l'utilisateur
   */
  static async getRecommendations(req, res) {
    try {
      const userId = req.user.id;
      const { mediaType = 'both', limit = 20 } = req.query;

      // Validation du mediaType
      const validMediaTypes = ['both', 'movie', 'tv'];
      if (!validMediaTypes.includes(mediaType)) {
        return errorResponse(res, 'mediaType doit être "movie", "tv" ou "both"', 400);
      }

      // Validation du limit
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
        return errorResponse(res, 'limit doit être entre 1 et 50', 400);
      }

      const result = await RecommendationService.generateRecommendations(userId, {
        mediaType,
        limit: limitNum
      });

      return successResponse(res, 'Recommandations générées', result);
    } catch (error) {
      console.error('Erreur getRecommendations:', error);
      return errorResponse(res, 'Erreur lors de la génération des recommandations', 500);
    }
  }
}

module.exports = RecommendationController;
