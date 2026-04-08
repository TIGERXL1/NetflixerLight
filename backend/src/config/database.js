// src/config/database.js
// Configuration SQLite pour la base de données utilisateur

const Database = require('better-sqlite3');
const path = require('path');

// Chemin vers la base de données
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/netflixlight.db');

/**
 * Crée et retourne une connexion à la base de données SQLite
 * @returns {Database} Instance de la base de données
 */
function getDatabase() {
  try {
    const db = new Database(DB_PATH);
    console.log('✅ Connecté à la base de données SQLite');
    return db;
  } catch (err) {
    console.error('Erreur de connexion à la base de données:', err.message);
    throw err;
  }
}

/**
 * Initialise les tables de la base de données
 */
function initializeDatabase() {
  const db = getDatabase();

  try {
    // Table users
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table sessions
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Table favorites
    db.exec(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        tmdb_id INTEGER NOT NULL,
        media_type TEXT NOT NULL CHECK(media_type IN ('movie', 'tv')),
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, tmdb_id, media_type)
      )
    `);

    console.log('✅ Tables de base de données initialisées');
  } catch (err) {
    console.error('Erreur lors de l\'initialisation de la DB:', err.message);
    throw err;
  } finally {
    db.close();
  }
}

module.exports = {
  getDatabase,
  initializeDatabase,
  DB_PATH
};
