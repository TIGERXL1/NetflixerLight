// src/models/ViewingHistory.js
// Modèle historique de visionnage pour la BDD

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

  /**
   * Met a jour la progression de visionnage
   * @param {number} userId - ID de l'utilisateur
   * @param {number} tmdbId - ID TMDB du contenu
   * @param {string} mediaType - Type de media
   * @param {number} progressSeconds - Progression en secondes
   * @param {number} durationSeconds - Duree totale en secondes
   * @returns {Promise<Object>} Entree mise a jour
   */
  static updateProgress(userId, tmdbId, mediaType, progressSeconds, durationSeconds) {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();

        // Check si une entree existe deja
        const existing = db.prepare(`
          SELECT id FROM viewing_history 
          WHERE user_id = ? AND tmdb_id = ? AND media_type = ?
          ORDER BY viewed_at DESC LIMIT 1
        `).get(userId, tmdbId, mediaType);

        if (existing) {
          // Mettre a jour l'entree existante
          const sql = `
            UPDATE viewing_history 
            SET progress_seconds = ?, duration_seconds = ?, viewed_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `;
          db.prepare(sql).run(progressSeconds, durationSeconds, existing.id);

          resolve({
            id: existing.id,
            user_id: userId,
            tmdb_id: tmdbId,
            media_type: mediaType,
            progress_seconds: progressSeconds,
            duration_seconds: durationSeconds
          });
        } else {
          // Creer une nouvelle entree
          const sql = `
            INSERT INTO viewing_history 
            (user_id, tmdb_id, media_type, progress_seconds, duration_seconds) 
            VALUES (?, ?, ?, ?, ?)
          `;
          const result = db.prepare(sql).run(userId, tmdbId, mediaType, progressSeconds, durationSeconds);

          resolve({
            id: result.lastInsertRowid,
            user_id: userId,
            tmdb_id: tmdbId,
            media_type: mediaType,
            progress_seconds: progressSeconds,
            duration_seconds: durationSeconds
          });
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Recupère la progression de visionnage pour un contenu
   * @param {number} userId - ID de l'utilisateur
   * @param {number} tmdbId - ID TMDB du contenu
   * @param {string} mediaType - Type de media
   * @returns {Promise<Object|null>} Progression ou null si non trouvée
   */
  static getProgress(userId, tmdbId, mediaType) {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        const sql = `
          SELECT id, user_id, tmdb_id, media_type, progress_seconds, duration_seconds, viewed_at
          FROM viewing_history 
          WHERE user_id = ? AND tmdb_id = ? AND media_type = ?
          ORDER BY viewed_at DESC LIMIT 1
        `;

        const progress = db.prepare(sql).get(userId, tmdbId, mediaType);

        resolve(progress || null);
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = ViewingHistory;
