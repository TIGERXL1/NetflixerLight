// __tests__/tmdb.test.js
// Tests d'intégration pour les endpoints TMDB

const request = require('supertest');
const app = require('../src/app');

// Ces tests nécessitent une clé API TMDB valide dans .env
// Si la clé n'est pas configurée, les tests échoueront avec une erreur 500

// ===== TESTS TRENDING =====

describe('GET /api/tmdb/trending', () => {
  
  test('Devrait retourner les contenus tendance par défaut (all, week)', async () => {
    const response = await request(app)
      .get('/api/tmdb/trending')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Contenus tendance récupérés');
    expect(response.body.data).toHaveProperty('results');
    expect(Array.isArray(response.body.data.results)).toBe(true);
  });

  test('Devrait retourner les films tendance uniquement', async () => {
    const response = await request(app)
      .get('/api/tmdb/trending?mediaType=movie')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('results');
  });

  test('Devrait retourner les séries tendance uniquement', async () => {
    const response = await request(app)
      .get('/api/tmdb/trending?mediaType=tv')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('results');
  });

  test('Devrait accepter le paramètre timeWindow=day', async () => {
    const response = await request(app)
      .get('/api/tmdb/trending?timeWindow=day')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('results');
  });
});

// ===== TESTS POPULAR MOVIES =====

describe('GET /api/tmdb/movies/popular', () => {
  
  test('Devrait retourner les films populaires (page 1 par défaut)', async () => {
    const response = await request(app)
      .get('/api/tmdb/movies/popular')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Films populaires récupérés');
    expect(response.body.data).toHaveProperty('results');
    expect(Array.isArray(response.body.data.results)).toBe(true);
    expect(response.body.data.results.length).toBeGreaterThan(0);
  });

  test('Devrait accepter le paramètre page', async () => {
    const response = await request(app)
      .get('/api/tmdb/movies/popular?page=2')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('page');
    expect(response.body.data.page).toBe(2);
  });

  test('Devrait retourner des films avec les propriétés attendues', async () => {
    const response = await request(app)
      .get('/api/tmdb/movies/popular')
      .expect(200);

    const firstMovie = response.body.data.results[0];
    expect(firstMovie).toHaveProperty('id');
    expect(firstMovie).toHaveProperty('title');
    expect(firstMovie).toHaveProperty('overview');
  });
});

// ===== TESTS POPULAR TV SHOWS =====

describe('GET /api/tmdb/tv/popular', () => {
  
  test('Devrait retourner les séries populaires (page 1 par défaut)', async () => {
    const response = await request(app)
      .get('/api/tmdb/tv/popular')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Séries populaires récupérées');
    expect(response.body.data).toHaveProperty('results');
    expect(Array.isArray(response.body.data.results)).toBe(true);
    expect(response.body.data.results.length).toBeGreaterThan(0);
  });

  test('Devrait accepter le paramètre page', async () => {
    const response = await request(app)
      .get('/api/tmdb/tv/popular?page=2')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('page');
    expect(response.body.data.page).toBe(2);
  });

  test('Devrait retourner des séries avec les propriétés attendues', async () => {
    const response = await request(app)
      .get('/api/tmdb/tv/popular')
      .expect(200);

    const firstShow = response.body.data.results[0];
    expect(firstShow).toHaveProperty('id');
    expect(firstShow).toHaveProperty('name');
    expect(firstShow).toHaveProperty('overview');
  });
});

// ===== TESTS TOP RATED =====

describe('GET /api/tmdb/top-rated', () => {
  
  test('Devrait retourner les films top rated par défaut', async () => {
    const response = await request(app)
      .get('/api/tmdb/top-rated')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Contenus top rated récupérés');
    expect(response.body.data).toHaveProperty('results');
  });

  test('Devrait accepter mediaType=tv', async () => {
    const response = await request(app)
      .get('/api/tmdb/top-rated?mediaType=tv')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('results');
  });
});

// ===== TESTS SEARCH =====

describe('GET /api/tmdb/search', () => {
  
  test('Devrait rechercher des contenus avec une query', async () => {
    const response = await request(app)
      .get('/api/tmdb/search?query=inception')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Résultats de recherche');
    expect(response.body.data).toHaveProperty('results');
    expect(Array.isArray(response.body.data.results)).toBe(true);
  });

  test('Devrait échouer si la query est manquante', async () => {
    const response = await request(app)
      .get('/api/tmdb/search')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Requête de recherche requise');
  });

  test('Devrait accepter le paramètre page', async () => {
    const response = await request(app)
      .get('/api/tmdb/search?query=avengers&page=2')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('page');
  });

  test('Devrait gérer les requêtes avec caractères spéciaux', async () => {
    const response = await request(app)
      .get('/api/tmdb/search?query=james%20bond')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('results');
  });
});

// ===== TESTS BY GENRE =====

describe('GET /api/tmdb/genre', () => {
  
  test('Devrait retourner des contenus par genre', async () => {
    const response = await request(app)
      .get('/api/tmdb/genre?mediaType=movie&genreId=28')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Contenus par genre récupérés');
    expect(response.body.data).toHaveProperty('results');
  });

  test('Devrait échouer si mediaType est manquant', async () => {
    const response = await request(app)
      .get('/api/tmdb/genre?genreId=28')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('mediaType et genreId requis');
  });

  test('Devrait échouer si genreId est manquant', async () => {
    const response = await request(app)
      .get('/api/tmdb/genre?mediaType=movie')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('mediaType et genreId requis');
  });

  test('Devrait accepter le paramètre page', async () => {
    const response = await request(app)
      .get('/api/tmdb/genre?mediaType=movie&genreId=28&page=2')
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});

// ===== TESTS GET DETAILS =====

describe('GET /api/tmdb/:mediaType/:id', () => {
  
  test('Devrait retourner les détails d\'un film', async () => {
    const response = await request(app)
      .get('/api/tmdb/movie/550') // Fight Club
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Détails récupérés');
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('title');
  });

  test('Devrait retourner les détails d\'une série', async () => {
    const response = await request(app)
      .get('/api/tmdb/tv/1396') // Breaking Bad
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('name');
  });

  test('Devrait échouer avec un mediaType invalide', async () => {
    const response = await request(app)
      .get('/api/tmdb/invalid/550')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('mediaType invalide');
  });

  test('Devrait gérer un ID inexistant', async () => {
    const response = await request(app)
      .get('/api/tmdb/movie/999999999')
      .expect(500);

    expect(response.body.success).toBe(false);
  });
});

// ===== TESTS GET GENRES =====

describe('GET /api/tmdb/genres', () => {
  
  test('Devrait retourner la liste des genres de films par défaut', async () => {
    const response = await request(app)
      .get('/api/tmdb/genres')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Genres récupérés');
    expect(response.body.data).toHaveProperty('genres');
    expect(Array.isArray(response.body.data.genres)).toBe(true);
    expect(response.body.data.genres.length).toBeGreaterThan(0);
  });

  test('Devrait retourner les genres de séries avec mediaType=tv', async () => {
    const response = await request(app)
      .get('/api/tmdb/genres?mediaType=tv')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('genres');
    expect(Array.isArray(response.body.data.genres)).toBe(true);
  });

  test('Devrait retourner des genres avec id et name', async () => {
    const response = await request(app)
      .get('/api/tmdb/genres')
      .expect(200);

    const firstGenre = response.body.data.genres[0];
    expect(firstGenre).toHaveProperty('id');
    expect(firstGenre).toHaveProperty('name');
    expect(typeof firstGenre.id).toBe('number');
    expect(typeof firstGenre.name).toBe('string');
  });
});

// ===== TESTS DE PERFORMANCE =====

describe('Performance - Routes TMDB', () => {
  
  test('Les routes TMDB devraient répondre en moins de 5 secondes', async () => {
    const startTime = Date.now();
    
    await request(app)
      .get('/api/tmdb/trending')
      .expect(200);

    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(5000);
  });
});

// ===== TESTS DE SÉCURITÉ =====

describe('Sécurité - Routes TMDB', () => {
  
  test('Ne devrait pas exposer la clé API dans les réponses', async () => {
    const response = await request(app)
      .get('/api/tmdb/trending')
      .expect(200);

    const responseString = JSON.stringify(response.body);
    expect(responseString).not.toContain('api_key');
    expect(responseString).not.toContain('TMDB_API_KEY');
  });

  test('Devrait gérer les injections SQL dans les paramètres', async () => {
    const response = await request(app)
      .get('/api/tmdb/search?query=\'; DROP TABLE users; --')
      .expect(200);

    // Devrait simplement retourner des résultats de recherche normaux
    expect(response.body.success).toBe(true);
  });
});
