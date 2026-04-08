// src/models/Favorite.js
// Modèle favoris pour la base de données SQLite

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
      const db = getDatabase();
      const sql = `INSERT INTO favorites (user_id, tmdb_id, media_type) VALUES (?, ?, ?)`;

      db.run(sql, [userId, tmdbId, mediaType], function(err) {
        db.close();
        
        if (err) {
          return reject(err);
        }

        resolve({
          id: this.lastID,
          user_id: userId,
          tmdb_id: tmdbId,
          media_type: mediaType
        });
      });
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
      const db = getDatabase();
      const sql = `DELETE FROM favorites WHERE user_id = ? AND tmdb_id = ? AND media_type = ?`;

      db.run(sql, [userId, tmdbId, mediaType], function(err) {
        db.close();
        
        if (err) {
          return reject(err);
        }

        resolve(this.changes > 0);
      });
    });
  }

  /**
   * Récupère tous les favoris d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des favoris
   */
  static getUserFavorites(userId) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const sql = `SELECT * FROM favorites WHERE user_id = ? ORDER BY added_at DESC`;

      db.all(sql, [userId], (err, rows) => {
        db.close();
        
        if (err) {
          return reject(err);
        }

        resolve(rows || []);
      });
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
      const db = getDatabase();
      const sql = `SELECT COUNT(*) as count FROM favorites WHERE user_id = ? AND tmdb_id = ? AND media_type = ?`;

      db.get(sql, [userId, tmdbId, mediaType], (err, row) => {
        db.close();
        
        if (err) {
          return reject(err);
        }

        resolve(row.count > 0);
      });
    });
  }
}

module.exports = Favorite;
