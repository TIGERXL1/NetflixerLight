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
  console.log('\nRoutes disponibles:');
  console.log(`   GET  /health - Health check`);
  console.log(`   POST /api/auth/register - Inscription`);
  console.log(`   POST /api/auth/login - Connexion`);
  console.log(`   POST /api/auth/logout - Déconnexion`);
  console.log(`   GET  /api/auth/profile - Profil utilisateur`);
  console.log(`   GET  /api/tmdb/trending - Contenus tendance`);
  console.log(`   GET  /api/tmdb/movies/popular - Films populaires`);
  console.log(`   GET  /api/tmdb/tv/popular - Séries populaires`);
  console.log(`   GET  /api/tmdb/search - Recherche`);
  console.log(`   GET  /api/favorites - Liste favoris`);
  console.log(`   POST /api/favorites - Ajouter favori`);
});
