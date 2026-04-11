// src/models/ViewingHistory.js
// Modèle historique de visionnage pour la base de données SQLite

const { getDatabase } = require('../config/database');

class ViewingHistory {
  /**
   * Ajoute une consultation à l'historique
   * @param {number} userId - ID de l'utilisateur
   * @param {number} tmdbId - ID TMDB du contenu
   * @param {string} mediaType - Type de média ('movie' ou 'tv')
   * @returns {Promise<Object>} Entrée d'historique créée
   */
  static add(userId, tmdbId, mediaType) {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        const sql = `INSERT INTO viewing_history (user_id, tmdb_id, media_type) VALUES (?, ?, ?)`;
        
        const result = db.prepare(sql).run(userId, tmdbId, mediaType);
        
        resolve({
          id: result.lastInsertRowid,
          user_id: userId,
          tmdb_id: tmdbId,
          media_type: mediaType
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Récupère l'historique de visionnage d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {number} limit - Nombre maximum d'entrées (défaut: 50)
   * @returns {Promise<Array>} Liste des consultations
   */
  static getByUserId(userId, limit = 50) {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        const sql = `
          SELECT id, user_id, tmdb_id, media_type, viewed_at 
          FROM viewing_history 
          WHERE user_id = ? 
          ORDER BY viewed_at DESC 
          LIMIT ?
        `;
        
        const history = db.prepare(sql).all(userId, limit);
        
        resolve(history);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Supprime tout l'historique d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<number>} Nombre d'entrées supprimées
   */
  static clearByUserId(userId) {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        const sql = `DELETE FROM viewing_history WHERE user_id = ?`;
        
        const result = db.prepare(sql).run(userId);
        
        resolve(result.changes);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Supprime une entrée spécifique de l'historique
   * @param {number} userId - ID de l'utilisateur
   * @param {number} tmdbId - ID TMDB du contenu
   * @param {string} mediaType - Type de média
   * @returns {Promise<number>} Nombre d'entrées supprimées
   */
  static removeEntry(userId, tmdbId, mediaType) {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        const sql = `DELETE FROM viewing_history WHERE user_id = ? AND tmdb_id = ? AND media_type = ?`;
        
        const result = db.prepare(sql).run(userId, tmdbId, mediaType);
        
        resolve(result.changes);
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = ViewingHistory;
