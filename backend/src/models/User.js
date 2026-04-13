// src/models/User.js
// Modèle utilisateur pour la base de données SQLite

const { getDatabase } = require('../config/database');

class User {
  /**
   * Crée un nouvel utilisateur dans la base de données
   * @param {Object} userData - Données de l'utilisateur
   * @param {string} userData.email - Email de l'utilisateur
   * @param {string} userData.username - Nom d'utilisateur
   * @param {string} userData.password - Mot de passe hashé
   * @returns {Promise<Object>} Utilisateur créé
   */
  static create({ email, username, password }) {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        const sql = `INSERT INTO users (email, username, password) VALUES (?, ?, ?)`;

        const info = db.prepare(sql).run(email, username, password);
        db.close();

        resolve({
          id: info.lastInsertRowid,
          email,
          username
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Trouve un utilisateur par email
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<Object|null>} Utilisateur trouvé ou null
   */
  static findByEmail(email) {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        const sql = `SELECT * FROM users WHERE email = ?`;

        const row = db.prepare(sql).get(email);
        db.close();

        resolve(row || null);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Trouve un utilisateur par ID
   * @param {number} id - ID de l'utilisateur
   * @returns {Promise<Object|null>} Utilisateur trouvé ou null
   */
  static findById(id) {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        const sql = `SELECT id, email, username, created_at FROM users WHERE id = ?`;

        const row = db.prepare(sql).get(id);
        db.close();

        resolve(row || null);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Trouve un utilisateur par username
   * @param {string} username - Nom d'utilisateur
   * @returns {Promise<Object|null>} Utilisateur trouvé ou null
   */
  static findByUsername(username) {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        const sql = `SELECT * FROM users WHERE username = ?`;

        const row = db.prepare(sql).get(username);
        db.close();

        resolve(row || null);
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = User;
