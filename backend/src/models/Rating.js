// src/models/Rating.js
// Modèle ratings pour la base de données SQLite

const { getDatabase } = require('../config/database');

class Rating {
  /**
   * Ajoute ou met à jour une note (UPSERT)
   * @param {number} userId - ID de l'utilisateur
   * @param {number} tmdbId - ID TMDB du contenu
   * @param {string} mediaType - Type de média ('movie' ou 'tv')
   * @param {number} rating - Note de 1 à 5
   * @returns {Promise<Object>} Note créée/mise à jour
   */
  static upsert(userId, tmdbId, mediaType, rating) {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        
        // SQLite UPSERT (INSERT OR REPLACE)
        const sql = `
          INSERT INTO ratings (user_id, tmdb_id, media_type, rating) 
          VALUES (?, ?, ?, ?)
          ON CONFLICT(user_id, tmdb_id, media_type) 
          DO UPDATE SET rating = ?, rated_at = CURRENT_TIMESTAMP
        `;
        
        const result = db.prepare(sql).run(userId, tmdbId, mediaType, rating, rating);
        
        resolve({
          id: result.lastInsertRowid,
          user_id: userId,
          tmdb_id: tmdbId,
          media_type: mediaType,
          rating: rating
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Supprime une note
   * @param {number} userId - ID de l'utilisateur
   * @param {number} tmdbId - ID TMDB du contenu
   * @param {string} mediaType - Type de média
   * @returns {Promise<boolean>} True si supprimé
   */
  static remove(userId, tmdbId, mediaType) {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        const sql = `DELETE FROM ratings WHERE user_id = ? AND tmdb_id = ? AND media_type = ?`;
        
        const result = db.prepare(sql).run(userId, tmdbId, mediaType);
        
        resolve(result.changes > 0);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Récupère une note spécifique
   * @param {number} userId - ID de l'utilisateur
   * @param {number} tmdbId - ID TMDB du contenu
   * @param {string} mediaType - Type de média
   * @returns {Promise<Object|null>} Note trouvée ou null
   */
  static getOne(userId, tmdbId, mediaType) {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        const sql = `SELECT * FROM ratings WHERE user_id = ? AND tmdb_id = ? AND media_type = ?`;
        
        const row = db.prepare(sql).get(userId, tmdbId, mediaType);
        
        resolve(row || null);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Récupère toutes les notes d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {number} limit - Limite de résultats (optionnel)
   * @returns {Promise<Array>} Liste des notes
   */
  static getUserRatings(userId, limit = 100) {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        const sql = `
          SELECT * FROM ratings 
          WHERE user_id = ? 
          ORDER BY rated_at DESC 
          LIMIT ?
        `;
        
        const rows = db.prepare(sql).all(userId, limit);
        
        resolve(rows || []);
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = Rating;
