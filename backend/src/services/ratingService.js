// src/services/ratingService.js
// Service de gestion des notes

const Rating = require('../models/Rating');

/**
 * Ajoute ou met à jour une note
 * @param {number} userId - ID de l'utilisateur
 * @param {number} tmdbId - ID TMDB du contenu
 * @param {string} mediaType - Type de média ('movie' ou 'tv')
 * @param {number} rating - Note de 1 à 5
 * @returns {Promise<Object>} Note créée/mise à jour
 */
async function upsertRating(userId, tmdbId, mediaType, rating) {
  // Validation
  if (rating < 1 || rating > 5) {
    throw new Error('La note doit être entre 1 et 5');
  }

  if (!['movie', 'tv'].includes(mediaType)) {
    throw new Error('mediaType invalide (movie ou tv uniquement)');
  }

  return Rating.upsert(userId, tmdbId, mediaType, rating);
}

/**
 * Supprime une note
 * @param {number} userId - ID de l'utilisateur
 * @param {number} tmdbId - ID TMDB du contenu
 * @param {string} mediaType - Type de média
 * @returns {Promise<boolean>} True si supprimé
 */
async function removeRating(userId, tmdbId, mediaType) {
  const removed = await Rating.remove(userId, tmdbId, mediaType);
  if (!removed) {
    throw new Error('Note non trouvée');
  }

  return true;
}

/**
 * Récupère une note spécifique
 * @param {number} userId - ID de l'utilisateur
 * @param {number} tmdbId - ID TMDB du contenu
 * @param {string} mediaType - Type de média
 * @returns {Promise<Object|null>} Note trouvée ou null
 */
async function getRating(userId, tmdbId, mediaType) {
  return Rating.getOne(userId, tmdbId, mediaType);
}

/**
 * Récupère toutes les notes d'un utilisateur
 * @param {number} userId - ID de l'utilisateur
 * @param {number} limit - Limite de résultats
 * @returns {Promise<Array>} Liste des notes
 */
async function getUserRatings(userId, limit = 100) {
  return Rating.getUserRatings(userId, limit);
}

module.exports = {
  upsertRating,
  removeRating,
  getRating,
  getUserRatings
};
