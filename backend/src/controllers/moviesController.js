// src/controllers/moviesController.js
// Contrôleur pour les routes TMDB (films et séries)

const tmdbService = require('../services/tmdbService');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Récupère les contenus tendance
 */
async function getTrending(req, res) {
  try {
    const { mediaType = 'all', timeWindow = 'week' } = req.query;
    const data = await tmdbService.getTrending(mediaType, timeWindow);
    return successResponse(res, 'Contenus tendance récupérés', data);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Récupère les films populaires
 */
async function getPopularMovies(req, res) {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbService.getPopularMovies(Number(page));
    return successResponse(res, 'Films populaires récupérés', data);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Récupère les séries populaires
 */
async function getPopularTVShows(req, res) {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbService.getPopularTVShows(Number(page));
    return successResponse(res, 'Séries populaires récupérées', data);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Récupère les contenus top rated
 */
async function getTopRated(req, res) {
  try {
    const { mediaType = 'movie' } = req.query;
    const data = await tmdbService.getTopRated(mediaType);
    return successResponse(res, 'Contenus top rated récupérés', data);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Récupère les contenus par genre
 */
async function getByGenre(req, res) {
  try {
    const { mediaType, genreId, page = 1 } = req.query;

    if (!mediaType || !genreId) {
      return errorResponse(res, 'mediaType et genreId requis', 400);
    }

    const data = await tmdbService.getByGenre(mediaType, Number(genreId), Number(page));
    return successResponse(res, 'Contenus par genre récupérés', data);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Recherche de contenus
 */
async function search(req, res) {
  try {
    const { query, page = 1 } = req.query;

    if (!query) {
      return errorResponse(res, 'Requête de recherche requise', 400);
    }

    const data = await tmdbService.search(query, Number(page));
    return successResponse(res, 'Résultats de recherche', data);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Récupère les détails d'un film ou série
 */
async function getDetails(req, res) {
  try {
    const { mediaType, id } = req.params;

    if (!['movie', 'tv'].includes(mediaType)) {
      return errorResponse(res, 'mediaType invalide (movie ou tv)', 400);
    }

    const data = await tmdbService.getDetails(mediaType, Number(id));
    return successResponse(res, 'Détails récupérés', data);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Récupère la liste des genres
 */
async function getGenres(req, res) {
  try {
    const { mediaType = 'movie' } = req.query;
    const data = await tmdbService.getGenres(mediaType);
    return successResponse(res, 'Genres récupérés', data);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

module.exports = {
  getTrending,
  getPopularMovies,
  getPopularTVShows,
  getTopRated,
  getByGenre,
  search,
  getDetails,
  getGenres
};
