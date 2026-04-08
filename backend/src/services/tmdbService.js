// src/services/tmdbService.js
// Service pour interagir avec l'API TMDB

const config = require('../config');

const TMDB_BASE_URL = config.tmdb.baseUrl;
const TMDB_API_KEY = config.tmdb.apiKey;
const TMDB_BEARER_TOKEN = config.tmdb.bearerToken;

/**
 * Effectue une requête vers l'API TMDB
 * @param {string} endpoint - Endpoint de l'API
 * @param {Object} params - Paramètres de requête optionnels
 * @returns {Promise<Object>} Données de l'API
 */
async function tmdbRequest(endpoint, params = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.append('api_key', TMDB_API_KEY);
  url.searchParams.append('language', 'fr-FR');

  // Ajouter d'autres paramètres
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${TMDB_BEARER_TOKEN}`,
      'accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`TMDB API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Récupère les contenus tendance
 * @param {string} mediaType - 'movie', 'tv' ou 'all'
 * @param {string} timeWindow - 'day' ou 'week'
 * @returns {Promise<Object>} Contenus tendance
 */
async function getTrending(mediaType = 'all', timeWindow = 'week') {
  return tmdbRequest(`/trending/${mediaType}/${timeWindow}`);
}

/**
 * Récupère les films populaires
 * @param {number} page - Numéro de page
 * @returns {Promise<Object>} Films populaires
 */
async function getPopularMovies(page = 1) {
  return tmdbRequest('/movie/popular', { page });
}

/**
 * Récupère les séries populaires
 * @param {number} page - Numéro de page
 * @returns {Promise<Object>} Séries populaires
 */
async function getPopularTVShows(page = 1) {
  return tmdbRequest('/tv/popular', { page });
}

/**
 * Récupère les contenus les mieux notés
 * @param {string} mediaType - 'movie' ou 'tv'
 * @returns {Promise<Object>} Contenus top rated
 */
async function getTopRated(mediaType = 'movie') {
  return tmdbRequest(`/${mediaType}/top_rated`);
}

/**
 * Récupère les contenus par genre
 * @param {string} mediaType - 'movie' ou 'tv'
 * @param {number} genreId - ID du genre
 * @param {number} page - Numéro de page
 * @returns {Promise<Object>} Contenus du genre
 */
async function getByGenre(mediaType, genreId, page = 1) {
  return tmdbRequest(`/discover/${mediaType}`, {
    with_genres: genreId,
    page
  });
}

/**
 * Recherche de contenus
 * @param {string} query - Requête de recherche
 * @param {number} page - Numéro de page
 * @returns {Promise<Object>} Résultats de recherche
 */
async function search(query, page = 1) {
  return tmdbRequest('/search/multi', {
    query,
    page
  });
}

/**
 * Récupère les détails d'un film ou série
 * @param {string} mediaType - 'movie' ou 'tv'
 * @param {number} id - ID TMDB
 * @returns {Promise<Object>} Détails du contenu
 */
async function getDetails(mediaType, id) {
  return tmdbRequest(`/${mediaType}/${id}`, {
    append_to_response: 'credits,similar,videos'
  });
}

/**
 * Récupère la liste des genres
 * @param {string} mediaType - 'movie' ou 'tv'
 * @returns {Promise<Object>} Liste des genres
 */
async function getGenres(mediaType = 'movie') {
  return tmdbRequest(`/genre/${mediaType}/list`);
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
