// src/controllers/ratingController.js
// Contrôleur pour la gestion des notes

const ratingService = require('../services/ratingService');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Ajoute ou met à jour une note (UPSERT)
 */
async function upsertRating(req, res) {
  try {
    const { tmdbId, mediaType, rating } = req.body;
    const userId = req.user.id;

    // Validation
    if (!tmdbId || !mediaType || rating == null) {
      return errorResponse(res, 'tmdbId, mediaType et rating requis', 400);
    }

    if (!['movie', 'tv'].includes(mediaType)) {
      return errorResponse(res, 'mediaType invalide (movie ou tv)', 400);
    }

    const ratingValue = Number(rating);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return errorResponse(res, 'rating doit être un nombre entre 1 et 5', 400);
    }

    const result = await ratingService.upsertRating(
      userId, 
      Number(tmdbId), 
      mediaType, 
      ratingValue
    );
    
    return successResponse(res, 'Note enregistrée', result, 201);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
}

/**
 * Supprime une note
 */
async function removeRating(req, res) {
  try {
    const { tmdbId, mediaType } = req.params;
    const userId = req.user.id;

    await ratingService.removeRating(userId, Number(tmdbId), mediaType);
    return successResponse(res, 'Note supprimée');
  } catch (error) {
    return errorResponse(res, error.message, 404);
  }
}

/**
 * Récupère une note spécifique
 */
async function getRating(req, res) {
  try {
    const { tmdbId, mediaType } = req.params;
    const userId = req.user.id;

    const rating = await ratingService.getRating(userId, Number(tmdbId), mediaType);
    
    if (!rating) {
      return successResponse(res, 'Aucune note', { rating: null });
    }

    return successResponse(res, 'Note récupérée', rating);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Récupère toutes les notes de l'utilisateur
 */
async function getUserRatings(req, res) {
  try {
    const userId = req.user.id;
    const limit = Number(req.query.limit) || 100;

    const ratings = await ratingService.getUserRatings(userId, limit);
    return successResponse(res, 'Notes récupérées', { ratings });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

module.exports = {
  upsertRating,
  removeRating,
  getRating,
  getUserRatings
};
