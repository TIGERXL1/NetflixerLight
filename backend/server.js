// server.js
// Point d'entrée du serveur NetflixLight

const app = require('./src/app');
const config = require('./src/config');
const { initializeDatabase } = require('./src/config/database');
const path = require('path');
const fs = require('fs');

const PORT = config.port;

// Créer le dossier data s'il n'existe pas
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Dossier data/ créé');
}

// Initialiser la base de données
initializeDatabase();

// Démarrer le serveur
app.listen(PORT, () => {
  console.log('NetflixLight Backend');
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Environnement: ${config.env}`);
  console.log(`Base de données: ${config.database.DB_PATH}`);
  console.log(`TMDB API: ${config.tmdb.apiKey ? 'Configurée' : 'Non configurée'}`);
  console.log('\n📋 Routes API disponibles:');
  console.log('\n🔐 Authentification (/api/auth):');
  console.log(`   POST /api/auth/register - Inscription`);
  console.log(`   POST /api/auth/login - Connexion`);
  console.log(`   POST /api/auth/logout - Déconnexion`);
  console.log(`   GET  /api/auth/profile - Profil utilisateur (🔒 auth requise)`);
  
  console.log('\n🎬 TMDB - Films & Séries (/api/tmdb):');
  console.log(`   GET  /api/tmdb/trending - Contenus tendance`);
  console.log(`   GET  /api/tmdb/movies/popular - Films populaires`);
  console.log(`   GET  /api/tmdb/tv/popular - Séries populaires`);
  console.log(`   GET  /api/tmdb/search?query=... - Recherche globale`);
  console.log(`   GET  /api/tmdb/movie/:id - Détails d'un film`);
  console.log(`   GET  /api/tmdb/tv/:id - Détails d'une série`);
  
  console.log('\n⭐ Favoris (/api/favorites):');
  console.log(`   GET  /api/favorites - Liste des favoris (🔒 auth requise)`);
  console.log(`   POST /api/favorites - Ajouter un favori (🔒 auth requise)`);
  console.log(`   DELETE /api/favorites/:id - Supprimer un favori (🔒 auth requise)`);
  
  console.log('\n🌟 Notations (/api/ratings):');
  console.log(`   GET  /api/ratings - Toutes les notations utilisateur (🔒 auth requise)`);
  console.log(`   POST /api/ratings - Ajouter/modifier une note (🔒 auth requise)`);
  console.log(`   GET  /api/ratings/:mediaType/:tmdbId - Note d'un contenu (🔒 auth requise)`);
  console.log(`   PUT  /api/ratings/:id - Modifier une note (🔒 auth requise)`);
  console.log(`   DELETE /api/ratings/:id - Supprimer une note (🔒 auth requise)`);
  
  console.log('\n📜 Historique (/api/history):');
  console.log(`   GET  /api/history - Historique de visionnage (🔒 auth requise)`);
  console.log(`   POST /api/history - Ajouter à l'historique (🔒 auth requise)`);
  console.log(`   GET  /api/history/:mediaType/:tmdbId - Historique d'un contenu (🔒 auth requise)`);
  
  console.log('\n🎯 Recommandations (/api/recommendations):');
  console.log(`   GET  /api/recommendations - Recommandations personnalisées (🔒 auth requise)`);
  console.log(`       Params: ?mediaType=movie|tv&limit=10`);
  
  console.log('\n✅ Health Check:');
  console.log(`   GET  /health - Statut du serveur`);
});
