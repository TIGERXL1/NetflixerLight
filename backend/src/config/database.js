// src/config/database.js
// Config SQLite pour la BDD utilisateur

const Database = require('better-sqlite3');
const path = require('path');

// Path vers la BDD
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/netflixlight.db');

/**
 * Crée et retourne une connexion à la BDD
 * @returns {Database} Instance de la BDD
 */
function getDatabase() {
  try {
    const db = new Database(DB_PATH);
    console.log('Connecté à la BDD');
    return db;
  } catch (err) {
    console.error('Erreur de connexion à la BDD:', err.message);
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

    // Table ratings
    db.exec(`
      CREATE TABLE IF NOT EXISTS ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        tmdb_id INTEGER NOT NULL,
        media_type TEXT NOT NULL CHECK(media_type IN ('movie', 'tv')),
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        rated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, tmdb_id, media_type)
      )
    `);

    // Index pour optimiser les requêtes ratings
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_id);
    `);

    // Table viewing_history (historique de visionnage)
    db.exec(`
      CREATE TABLE IF NOT EXISTS viewing_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        tmdb_id INTEGER NOT NULL,
        media_type TEXT NOT NULL CHECK(media_type IN ('movie', 'tv')),
        viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Index pour optimiser les requêtes viewing_history
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_viewing_history_user ON viewing_history(user_id, viewed_at DESC);
    `);

    console.log('[OK] Tables de BDD initialisées');
  } catch (err) {
    console.error('Erreur lors de l\'initialisation de la BDD : ', err.message);
    throw err;
  } finally {
    db.close();
  }
}

/**
 * Flush toutes les tables (pour les tests)
 */
function clearDatabase() {
  const db = getDatabase();

  try {
    db.exec('DELETE FROM viewing_history');
    db.exec('DELETE FROM ratings');
    db.exec('DELETE FROM favorites');
    db.exec('DELETE FROM sessions');
    db.exec('DELETE FROM users');
    console.log('[OK] Base de données nettoyée');
  } catch (err) {
    console.error('Erreur lors du nettoyage de la BDD : ', err.message);
    throw err;
  } finally {
    db.close();
  }
}

/**
 * Ferme la connexion à la base de données (pour les tests)
 */
function closeDatabase() {
  // SQLite ferme automatiquement les connexions, mais on garde cette fonction
  // pour la compatibilité avec d'autres bases de données futures
  console.log('[OK] Connexion à la base de données fermée');
  return Promise.resolve();
}

module.exports = {
  getDatabase,
  initializeDatabase,
  clearDatabase,
  closeDatabase,
  DB_PATH
};
