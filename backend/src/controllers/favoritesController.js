// src/controllers/favoritesController.js
// Contrôleur pour la gestion des favoris

const favoriteService = require('../services/favoriteService');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Ajoute un contenu aux favoris
 */
async function addFavorite(req, res) {
  try {
    const { tmdbId, mediaType } = req.body;
    const userId = req.user.id;

    // Validation
    if (!tmdbId || !mediaType) {
      return errorResponse(res, 'tmdbId et mediaType requis', 400);
    }

    if (!['movie', 'tv'].includes(mediaType)) {
      return errorResponse(res, 'mediaType invalide (movie ou tv)', 400);
    }

    const favorite = await favoriteService.addFavorite(userId, Number(tmdbId), mediaType);
    return successResponse(res, 'Ajouté aux favoris', favorite, 201);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
}

/**
 * Retire un contenu des favoris
 */
async function removeFavorite(req, res) {
  try {
    const { tmdbId, mediaType } = req.params;
    const userId = req.user.id;

    await favoriteService.removeFavorite(userId, Number(tmdbId), mediaType);
    return successResponse(res, 'Retiré des favoris');
  } catch (error) {
    return errorResponse(res, error.message, 404);
  }
}

/**
 * Récupère tous les favoris de l'utilisateur
 */
async function getUserFavorites(req, res) {
  try {
    const userId = req.user.id;
    const favorites = await favoriteService.getUserFavorites(userId);
    return successResponse(res, 'Favoris récupérés', { favorites });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Vérifie si un contenu est dans les favoris
 */
async function checkFavorite(req, res) {
  try {
    const { tmdbId, mediaType } = req.params;
    const userId = req.user.id;

    const isFavorite = await favoriteService.checkFavorite(userId, Number(tmdbId), mediaType);
    return successResponse(res, 'Status favori', { isFavorite });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

module.exports = {
  addFavorite,
  removeFavorite,
  getUserFavorites,
  checkFavorite
};
