// src/services/viewingHistoryService.js
// Service pour la gestion de l'historique de visionnage

const ViewingHistory = require('../models/ViewingHistory');

class ViewingHistoryService {
  /**
   * Enregistre une consultation dans l'historique
   * @param {number} userId - ID de l'utilisateur
   * @param {number} tmdbId - ID TMDB du contenu
   * @param {string} mediaType - Type de média ('movie' ou 'tv')
   * @returns {Promise<Object>} Entrée d'historique créée
   */
  static async addToHistory(userId, tmdbId, mediaType) {
    try {
      // Validation des paramètres
      if (!userId || !tmdbId || !mediaType) {
        throw new Error('Paramètres manquants');
      }

      if (!['movie', 'tv'].includes(mediaType)) {
        throw new Error('Type de média invalide');
      }

      const entry = await ViewingHistory.add(userId, tmdbId, mediaType);
      return entry;
    } catch (error) {
      console.error('Erreur dans addToHistory:', error);
      throw error;
    }
  }

  /**
   * Récupère l'historique de visionnage d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {number} limit - Nombre maximum d'entrées
   * @returns {Promise<Array>} Liste des consultations
   */
  static async getUserHistory(userId, limit = 50) {
    try {
      if (!userId) {
        throw new Error('ID utilisateur manquant');
      }

      const history = await ViewingHistory.getByUserId(userId, limit);
      return history;
    } catch (error) {
      console.error('Erreur dans getUserHistory:', error);
      throw error;
    }
  }

  /**
   * Efface tout l'historique d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<number>} Nombre d'entrées supprimées
   */
  static async clearHistory(userId) {
    try {
      if (!userId) {
        throw new Error('ID utilisateur manquant');
      }

      const deletedCount = await ViewingHistory.clearByUserId(userId);
      return deletedCount;
    } catch (error) {
      console.error('Erreur dans clearHistory:', error);
      throw error;
    }
  }

  /**
   * Supprime une entrée spécifique de l'historique
   * @param {number} userId - ID de l'utilisateur
   * @param {number} tmdbId - ID TMDB du contenu
   * @param {string} mediaType - Type de média
   * @returns {Promise<number>} Nombre d'entrées supprimées
   */
  static async removeHistoryEntry(userId, tmdbId, mediaType) {
    try {
      if (!userId || !tmdbId || !mediaType) {
        throw new Error('Paramètres manquants');
      }

      if (!['movie', 'tv'].includes(mediaType)) {
        throw new Error('Type de média invalide');
      }

      const deletedCount = await ViewingHistory.removeEntry(userId, tmdbId, mediaType);
      return deletedCount;
    } catch (error) {
      console.error('Erreur dans removeHistoryEntry:', error);
      throw error;
    }
  }

  /**
   * Met a jour la progression de visionnage
   * @param {number} userId - ID de l'utilisateur
   * @param {number} tmdbId - ID TMDB du contenu
   * @param {string} mediaType - Type de media
   * @param {number} progressSeconds - Progression en secondes
   * @param {number} durationSeconds - Duree totale en secondes
   * @returns {Promise<Object>} Entree mise a jour
   */
  static async updateProgress(userId, tmdbId, mediaType, progressSeconds, durationSeconds) {
    try {
      if (!userId || !tmdbId || !mediaType || progressSeconds === undefined || durationSeconds === undefined) {
        throw new Error('Parametres manquants');
      }

      if (!['movie', 'tv'].includes(mediaType)) {
        throw new Error('Type de media invalide');
      }

      const entry = await ViewingHistory.updateProgress(
        userId,
        tmdbId,
        mediaType,
        progressSeconds,
        durationSeconds
      );
      return entry;
    } catch (error) {
      console.error('Erreur dans updateProgress:', error);
      throw error;
    }
  }

  /**
   * Recupere la progression de visionnage
   * @param {number} userId - ID de l'utilisateur
   * @param {number} tmdbId - ID TMDB du contenu
   * @param {string} mediaType - Type de media
   * @returns {Promise<Object|null>} Progression ou null
   */
  static async getProgress(userId, tmdbId, mediaType) {
    try {
      if (!userId || !tmdbId || !mediaType) {
        throw new Error('Parametres manquants');
      }

      if (!['movie', 'tv'].includes(mediaType)) {
        throw new Error('Type de media invalide');
      }

      const progress = await ViewingHistory.getProgress(userId, tmdbId, mediaType);
      return progress;
    } catch (error) {
      console.error('Erreur dans getProgress:', error);
      throw error;
    }
  }
}

module.exports = ViewingHistoryService;
