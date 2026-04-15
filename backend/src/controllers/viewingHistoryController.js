// src/controllers/viewingHistoryController.js
// Contrôleur pour les routes d'historique de visionnage

const ViewingHistoryService = require('../services/viewingHistoryService');
const { successResponse, errorResponse } = require('../utils/response');

class ViewingHistoryController {
  /**
   * POST /api/history
   * Ajoute une consultation à l'historique
   */
  static async addToHistory(req, res) {
    try {
      const { tmdbId, mediaType } = req.body;
      const userId = req.user.id;

      // Validation
      if (!tmdbId || !mediaType) {
        return errorResponse(res, 'tmdbId et mediaType sont requis', 400);
      }

      if (!['movie', 'tv'].includes(mediaType)) {
        return errorResponse(res, 'mediaType doit être "movie" ou "tv"', 400);
      }

      const entry = await ViewingHistoryService.addToHistory(userId, tmdbId, mediaType);

      return successResponse(res, 'Consultation ajoutée à l\'historique', { entry }, 201);
    } catch (error) {
      console.error('Erreur addToHistory:', error);
      return errorResponse(res, 'Erreur lors de l\'ajout à l\'historique', 500);
    }
  }

  /**
   * GET /api/history
   * Récupère l'historique de visionnage de l'utilisateur
   */
  static async getUserHistory(req, res) {
    try {
      const userId = req.user.id;
      const limit = req.query.limit !== undefined ? parseInt(req.query.limit) : 50;

      // Validation du limit
      if (limit < 1 || limit > 100) {
        return errorResponse(res, 'limit doit être entre 1 et 100', 400);
      }

      const history = await ViewingHistoryService.getUserHistory(userId, limit);

      return successResponse(res, 'Historique récupéré', {
        history,
        count: history.length
      });
    } catch (error) {
      console.error('Erreur getUserHistory:', error);
      return errorResponse(res, 'Erreur lors de la récupération de l\'historique', 500);
    }
  }

  /**
   * DELETE /api/history
   * Efface tout l'historique de l'utilisateur
   */
  static async clearHistory(req, res) {
    try {
      const userId = req.user.id;

      const deletedCount = await ViewingHistoryService.clearHistory(userId);

      return successResponse(res, 'Historique effacé', { deletedCount });
    } catch (error) {
      console.error('Erreur clearHistory:', error);
      return errorResponse(res, 'Erreur lors de l\'effacement de l\'historique', 500);
    }
  }

  /**
   * DELETE /api/history/:tmdbId/:mediaType
   * Supprime une entrée spécifique de l'historique
   */
  static async removeHistoryEntry(req, res) {
    try {
      const userId = req.user.id;
      const { tmdbId, mediaType } = req.params;

      // Validation
      if (!tmdbId || !mediaType) {
        return errorResponse(res, 'tmdbId et mediaType sont requis', 400);
      }

      if (!['movie', 'tv'].includes(mediaType)) {
        return errorResponse(res, 'mediaType doit être "movie" ou "tv"', 400);
      }

      const deletedCount = await ViewingHistoryService.removeHistoryEntry(
        userId,
        parseInt(tmdbId),
        mediaType
      );

      if (deletedCount === 0) {
        return errorResponse(res, 'Entrée non trouvée dans l\'historique', 404);
      }

      return successResponse(res, 'Entrée supprimée de l\'historique', { deletedCount });
    } catch (error) {
      console.error('Erreur removeHistoryEntry:', error);
      return errorResponse(res, 'Erreur lors de la suppression de l\'entrée', 500);
    }
  }

  /**
   * PUT /api/history/:tmdbId/:mediaType/progress
   * Met a jour la progression de visionnage
   */
  static async updateProgress(req, res) {
    try {
      const userId = req.user.id;
      const { tmdbId, mediaType } = req.params;
      const { progressSeconds, durationSeconds } = req.body;

      // Validation
      if (!tmdbId || !mediaType) {
        return errorResponse(res, 'tmdbId et mediaType sont requis', 400);
      }

      if (!['movie', 'tv'].includes(mediaType)) {
        return errorResponse(res, 'mediaType doit etre "movie" ou "tv"', 400);
      }

      if (progressSeconds === undefined || durationSeconds === undefined) {
        return errorResponse(res, 'progressSeconds et durationSeconds sont requis', 400);
      }

      if (progressSeconds < 0 || durationSeconds <= 0) {
        return errorResponse(res, 'Valeurs invalides pour la progression', 400);
      }

      const entry = await ViewingHistoryService.updateProgress(
        userId,
        parseInt(tmdbId),
        mediaType,
        parseInt(progressSeconds),
        parseInt(durationSeconds)
      );

      return successResponse(res, 'Progression mise a jour', { entry });
    } catch (error) {
      console.error('Erreur updateProgress:', error);
      return errorResponse(res, 'Erreur lors de la mise a jour de la progression', 500);
    }
  }

  /**
   * GET /api/history/:tmdbId/:mediaType/progress
   * Recupere la progression de visionnage
   */
  static async getProgress(req, res) {
    try {
      const userId = req.user.id;
      const { tmdbId, mediaType } = req.params;

      // Validation
      if (!tmdbId || !mediaType) {
        return errorResponse(res, 'tmdbId et mediaType sont réquis', 400);
      }

      if (!['movie', 'tv'].includes(mediaType)) {
        return errorResponse(res, 'mediaType doit être "movie" ou "tv"', 400);
      }

      const progress = await ViewingHistoryService.getProgress(
        userId,
        parseInt(tmdbId),
        mediaType
      );

      if (!progress) {
        return successResponse(res, 'Aucune progression trouvée', { progress: null });
      }

      return successResponse(res, 'Progression récuperée', { progress });
    } catch (error) {
      console.error('Erreur getProgress:', error);
      return errorResponse(res, 'Erreur lors de la récupération de la progression', 500);
    }
  }
}

module.exports = ViewingHistoryController;
