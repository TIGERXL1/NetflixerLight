// src/services/favoriteService.js
// Service de gestion des favoris

const Favorite = require('../models/Favorite');

/**
 * Ajoute un contenu aux favoris
 * @param {number} userId - ID de l'utilisateur
 * @param {number} tmdbId - ID TMDB du contenu
 * @param {string} mediaType - Type de média ('movie' ou 'tv')
 * @returns {Promise<Object>} Favori ajouté
 */
async function addFavorite(userId, tmdbId, mediaType) {
  // Vérifier si déjà en favoris
  const isFav = await Favorite.isFavorite(userId, tmdbId, mediaType);
  if (isFav) {
    throw new Error('Déjà dans les favoris');
  }

  return Favorite.add(userId, tmdbId, mediaType);
}

/**
 * Retire un contenu des favoris
 * @param {number} userId - ID de l'utilisateur
 * @param {number} tmdbId - ID TMDB du contenu
 * @param {string} mediaType - Type de média
 * @returns {Promise<boolean>} True si supprimé
 */
async function removeFavorite(userId, tmdbId, mediaType) {
  const removed = await Favorite.remove(userId, tmdbId, mediaType);
  if (!removed) {
    throw new Error('Favori non trouvé');
  }

  return true;
}

/**
 * Récupère tous les favoris d'un utilisateur
 * @param {number} userId - ID de l'utilisateur
 * @returns {Promise<Array>} Liste des favoris
 */
async function getUserFavorites(userId) {
  return Favorite.getUserFavorites(userId);
}

/**
 * Vérifie si un contenu est dans les favoris
 * @param {number} userId - ID de l'utilisateur
 * @param {number} tmdbId - ID TMDB du contenu
 * @param {string} mediaType - Type de média
 * @returns {Promise<boolean>} True si favori
 */
async function checkFavorite(userId, tmdbId, mediaType) {
  return Favorite.isFavorite(userId, tmdbId, mediaType);
}

module.exports = {
  addFavorite,
  removeFavorite,
  getUserFavorites,
  checkFavorite
};
