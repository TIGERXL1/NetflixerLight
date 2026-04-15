// src/services/recommendationService.js
// Service pour générer des recommandations personnalisées

const Favorite = require('../models/Favorite');
const Rating = require('../models/Rating');
const ViewingHistory = require('../models/ViewingHistory');
const tmdbService = require('./tmdbService');

class RecommendationService {
  /**
   * Génère des recommandations personnalisées pour un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} options - Options de recommandation
   * @returns {Promise<Object>} Recommandations et métadonnées
   */
  static async generateRecommendations(userId, options = {}) {
    try {
      const { mediaType = 'both', limit = 20 } = options;

      //Récupéère les préférences utilisateur
      const favorites = await Favorite.getUserFavorites(userId);
      const allRatings = await Rating.getUserRatings(userId);
      const highRatings = allRatings.filter(r => r.rating >= 4);

      // Combine favoris et notes élevées
      const likedContent = [...favorites, ...highRatings];

      // Si aucune donnée, retourne des contenus populaires
      if (likedContent.length === 0) {
        return this._getDefaultRecommendations(mediaType, limit);
      }

      //Extrait les genres préférés
      const genreCounts = {};
      
      for (const item of likedContent) {
        try {
          const details = await tmdbService.getDetails(item.media_type, item.tmdb_id);
          
          if (details.genres && Array.isArray(details.genres)) {
            details.genres.forEach(genre => {
              genreCounts[genre.id] = (genreCounts[genre.id] || 0) + 1;
            });
          }
        } catch (error) {
          // Ignore les erreurs pour un contenu spécifique
          console.error(`Erreur lors de la récupération des détails pour ${item.tmdb_id}:`, error.message);
        }
      }

      // Sélectionne les top 3 genres
      const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([genreId]) => genreId);

      if (topGenres.length === 0) {
        return this._getDefaultRecommendations(mediaType, limit);
      }

      // Récupère les contenus déjà vus
      const seenIds = new Set([
        ...favorites.map(f => `${f.tmdb_id}-${f.media_type}`),
        ...allRatings.map(r => `${r.tmdb_id}-${r.media_type}`)
      ]);

      // Découvre les contenus basés sur les genres préférés
      const recommendations = await this._discoverByGenres(
        topGenres,
        mediaType,
        seenIds,
        limit
      );

      // Obtiens les noms des genres pour les métadonnées
      const genreNames = await this._getGenreNames(topGenres, mediaType);

      return {
        recommendations,
        basedOn: {
          topGenres: genreNames,
          favoritesCount: favorites.length,
          ratingsCount: highRatings.length
        }
      };
    } catch (error) {
      console.error('Erreur generateRecommendations:', error);
      throw error;
    }
  }

  /**
   * Découvre des contenus basés sur des genres
   * @private
   */
  static async _discoverByGenres(genreIds, mediaType, seenIds, limit) {
    const results = [];
    const mediaTypes = mediaType === 'both' ? ['movie', 'tv'] : [mediaType];

    for (const type of mediaTypes) {
      try {
        const response = await tmdbService.discover(type, {
          with_genres: genreIds.join(','),
          sort_by: 'vote_average.desc',
          'vote_count.gte': 100,
          page: 1
        });

        if (response.results) {
          // Filtre les contenus déjà vus
          const filtered = response.results.filter(item => {
            const key = `${item.id}-${type}`;
            return !seenIds.has(key);
          });

          // Ajoute le type de média à chaque résultat
          filtered.forEach(item => {
            item.media_type = type;
          });

          results.push(...filtered);
        }
      } catch (error) {
        console.error(`Erreur discover pour ${type}:`, error.message);
      }
    }

    // Mélange les résultats et les limite
    return this._shuffleAndLimit(results, limit);
  }

  /**
   * Récupère les recommandations par défaut (contenus populaires)
   * @private
   */
  static async _getDefaultRecommendations(mediaType, limit) {
    try {
      const results = [];

      if (mediaType === 'both' || mediaType === 'movie') {
        const movies = await tmdbService.getPopularMovies(1);
        if (movies.results) {
          movies.results.forEach(m => m.media_type = 'movie');
          results.push(...movies.results);
        }
      }

      if (mediaType === 'both' || mediaType === 'tv') {
        const tvShows = await tmdbService.getPopularTVShows(1);
        if (tvShows.results) {
          tvShows.results.forEach(t => t.media_type = 'tv');
          results.push(...tvShows.results);
        }
      }

      return {
        recommendations: this._shuffleAndLimit(results, limit),
        basedOn: {
          topGenres: [],
          favoritesCount: 0,
          ratingsCount: 0,
          message: 'Recommandations basées sur les contenus populaires'
        }
      };
    } catch (error) {
      console.error('Erreur _getDefaultRecommendations:', error);
      throw error;
    }
  }

  /**
   * Récupère les noms des genres à partir de leurs IDs
   * @private
   */
  static async _getGenreNames(genreIds, mediaType) {
    try {
      const names = [];
      const types = mediaType === 'both' ? ['movie', 'tv'] : [mediaType];
      const genreMap = new Map();

      // Récupère les genres pour chaque type de média
      for (const type of types) {
        const response = await tmdbService.getGenres(type);
        if (response.genres) {
          response.genres.forEach(genre => {
            genreMap.set(genre.id, genre.name);
          });
        }
      }

      // Mappe les IDs aux noms
      genreIds.forEach(id => {
        const name = genreMap.get(parseInt(id));
        if (name && !names.includes(name)) {
          names.push(name);
        }
      });

      return names;
    } catch (error) {
      console.error('Erreur _getGenreNames:', error);
      return genreIds.map(id => `Genre ${id}`);
    }
  }

  /**
   * Mélange un tableau et limite le nombre d'éléments
   * @private
   */
  static _shuffleAndLimit(array, limit) {
    // Algorithme de Fisher-Yates
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, limit);
  }
}

module.exports = RecommendationService;
