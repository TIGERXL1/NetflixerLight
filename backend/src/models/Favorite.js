// src/models/Favorite.js
// Modèle favoris pour la BDD

const { getDatabase } = require('../config/database');

class Favorite {
  /**
   * Ajoute un film/série aux favoris
   * @param {number} userId - ID de l'utilisateur
   * @param {number} tmdbId - ID TMDB du contenu
   * @param {string} mediaType - Type de média ('movie' ou 'tv')
   * @returns {Promise<Object>} Favori créé
   */
  static add(userId, tmdbId, mediaType) {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        const sql = `INSERT INTO favorites (user_id, tmdb_id, media_type) VALUES (?, ?, ?)`;
        
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
   * Retire un film/série des favoris
   * @param {number} userId - ID de l'utilisateur
   * @param {number} tmdbId - ID TMDB du contenu
   * @param {string} mediaType - Type de média
   * @returns {Promise<boolean>} True si supprimé
   */
  static remove(userId, tmdbId, mediaType) {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        const sql = `DELETE FROM favorites WHERE user_id = ? AND tmdb_id = ? AND media_type = ?`;
        
        const result = db.prepare(sql).run(userId, tmdbId, mediaType);
        
        resolve(result.changes > 0);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Récupère tous les favoris d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des favoris
   */
  static getUserFavorites(userId) {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        const sql = `SELECT * FROM favorites WHERE user_id = ? ORDER BY added_at DESC`;
        
        const rows = db.prepare(sql).all(userId);
        
        resolve(rows || []);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Vérifie si un contenu est dans les favoris
   * @param {number} userId - ID de l'utilisateur
   * @param {number} tmdbId - ID TMDB du contenu
   * @param {string} mediaType - Type de média
   * @returns {Promise<boolean>} True si favori
   */
  static isFavorite(userId, tmdbId, mediaType) {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        const sql = `SELECT COUNT(*) as count FROM favorites WHERE user_id = ? AND tmdb_id = ? AND media_type = ?`;
        
        const row = db.prepare(sql).get(userId, tmdbId, mediaType);
        
        resolve(row.count > 0);
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = Favorite;
