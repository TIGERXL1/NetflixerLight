// __tests__/favorites.test.js
// Tests d'intégration pour les endpoints de favoris

const request = require('supertest');
const app = require('../src/app');
const { initializeDatabase, closeDatabase, clearDatabase } = require('../src/config/database');

// Variables pour stocker les données de test
let testUser = {
  email: 'test@netflixlight.com',
  username: 'testuser',
  password: 'TestPassword123!@#' // Conforme ANSSI 2026
};

let authCookie;

// Setup : Initialiser la base de données avant tous les tests
beforeAll(async () => {
  await initializeDatabase();
});

// Cleanup : Nettoyer la base de données et créer un utilisateur authentifié avant chaque test
beforeEach(async () => {
  await clearDatabase();

  // Créer un utilisateur de test
  await request(app)
    .post('/api/auth/register')
    .send(testUser);

  // Se connecter et récupérer le cookie de session
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: testUser.email,
      password: testUser.password
    });

  authCookie = loginResponse.headers['set-cookie'];
});

// Cleanup : Fermer la connexion après tous les tests
afterAll(async () => {
  await closeDatabase();
});

// ===== TESTS POST /api/favorites - AJOUTER UN FAVORI =====

describe('POST /api/favorites', () => {
  
  test('Devrait ajouter un film aux favoris avec authentification', async () => {
    const response = await request(app)
      .post('/api/favorites')
      .set('Cookie', authCookie)
      .send({
        tmdbId: 550,
        mediaType: 'movie'
      })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Ajouté aux favoris');
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.tmdb_id).toBe(550);
    expect(response.body.data.media_type).toBe('movie');
  });

  test('Devrait ajouter une série aux favoris', async () => {
    const response = await request(app)
      .post('/api/favorites')
      .set('Cookie', authCookie)
      .send({
        tmdbId: 1396,
        mediaType: 'tv'
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.tmdb_id).toBe(1396);
    expect(response.body.data.media_type).toBe('tv');
  });

  test('Devrait échouer sans authentification', async () => {
    const response = await request(app)
      .post('/api/favorites')
      .send({
        tmdbId: 550,
        mediaType: 'movie'
      })
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test('Devrait échouer si tmdbId est manquant', async () => {
    const response = await request(app)
      .post('/api/favorites')
      .set('Cookie', authCookie)
      .send({
        mediaType: 'movie'
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('tmdbId et mediaType requis');
  });

  test('Devrait échouer si mediaType est manquant', async () => {
    const response = await request(app)
      .post('/api/favorites')
      .set('Cookie', authCookie)
      .send({
        tmdbId: 550
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('tmdbId et mediaType requis');
  });

  test('Devrait échouer si mediaType est invalide', async () => {
    const response = await request(app)
      .post('/api/favorites')
      .set('Cookie', authCookie)
      .send({
        tmdbId: 550,
        mediaType: 'invalid'
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('mediaType invalide');
  });

  test('Devrait échouer si le favori existe déjà (doublon)', async () => {
    // Ajouter un favori
    await request(app)
      .post('/api/favorites')
      .set('Cookie', authCookie)
      .send({
        tmdbId: 550,
        mediaType: 'movie'
      })
      .expect(201);

    // Tenter d'ajouter le même favori
    const response = await request(app)
      .post('/api/favorites')
      .set('Cookie', authCookie)
      .send({
        tmdbId: 550,
        mediaType: 'movie'
      })
      .expect(400);

    expect(response.body.success).toBe(false);
  });
});

// ===== TESTS GET /api/favorites - RÉCUPÉRER LES FAVORIS =====

describe('GET /api/favorites', () => {
  
  test('Devrait retourner une liste vide si aucun favori', async () => {
    const response = await request(app)
      .get('/api/favorites')
      .set('Cookie', authCookie)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Favoris récupérés');
    expect(response.body.data.favorites).toEqual([]);
  });

  test('Devrait retourner les favoris de l\'utilisateur', async () => {
    // Ajouter quelques favoris
    await request(app)
      .post('/api/favorites')
      .set('Cookie', authCookie)
      .send({ tmdbId: 550, mediaType: 'movie' });

    await request(app)
      .post('/api/favorites')
      .set('Cookie', authCookie)
      .send({ tmdbId: 1396, mediaType: 'tv' });

    // Récupérer les favoris
    const response = await request(app)
      .get('/api/favorites')
      .set('Cookie', authCookie)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.favorites).toHaveLength(2);
    expect(response.body.data.favorites[0]).toHaveProperty('tmdb_id');
    expect(response.body.data.favorites[0]).toHaveProperty('media_type');
  });

  test('Devrait échouer sans authentification', async () => {
    const response = await request(app)
      .get('/api/favorites')
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test('Ne devrait retourner que les favoris de l\'utilisateur connecté', async () => {
    // Ajouter un favori pour l'utilisateur de test
    await request(app)
      .post('/api/favorites')
      .set('Cookie', authCookie)
      .send({ tmdbId: 550, mediaType: 'movie' });

    // Créer un deuxième utilisateur
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user2@test.com',
        username: 'user2',
        password: 'TestPassword123!@#'
      });

    const user2Login = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user2@test.com',
        password: 'TestPassword123!@#'
      });

    const user2Cookie = user2Login.headers['set-cookie'];

    // Ajouter un favori pour le deuxième utilisateur
    await request(app)
      .post('/api/favorites')
      .set('Cookie', user2Cookie)
      .send({ tmdbId: 1396, mediaType: 'tv' });

    // Vérifier que le premier utilisateur ne voit que son favori
    const response = await request(app)
      .get('/api/favorites')
      .set('Cookie', authCookie)
      .expect(200);

    expect(response.body.data.favorites).toHaveLength(1);
    expect(response.body.data.favorites[0].tmdb_id).toBe(550);
  });
});

// ===== TESTS DELETE /api/favorites/:tmdbId/:mediaType - SUPPRIMER UN FAVORI =====

describe('DELETE /api/favorites/:tmdbId/:mediaType', () => {
  
  test('Devrait supprimer un favori existant', async () => {
    // Ajouter un favori
    await request(app)
      .post('/api/favorites')
      .set('Cookie', authCookie)
      .send({ tmdbId: 550, mediaType: 'movie' });

    // Supprimer le favori
    const response = await request(app)
      .delete('/api/favorites/550/movie')
      .set('Cookie', authCookie)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Retiré des favoris');

    // Vérifier que le favori n'existe plus
    const getFavorites = await request(app)
      .get('/api/favorites')
      .set('Cookie', authCookie);

    expect(getFavorites.body.data.favorites).toHaveLength(0);
  });

  test('Devrait échouer sans authentification', async () => {
    const response = await request(app)
      .delete('/api/favorites/550/movie')
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test('Devrait échouer si le favori n\'existe pas', async () => {
    const response = await request(app)
      .delete('/api/favorites/999999/movie')
      .set('Cookie', authCookie)
      .expect(404);

    expect(response.body.success).toBe(false);
  });

  test('Ne devrait pas supprimer les favoris d\'autres utilisateurs', async () => {
    // Créer un deuxième utilisateur
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user2@test.com',
        username: 'user2',
        password: 'TestPassword123!@#'
      });

    const user2Login = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user2@test.com',
        password: 'TestPassword123!@#'
      });

    const user2Cookie = user2Login.headers['set-cookie'];

    // Ajouter un favori pour user2
    await request(app)
      .post('/api/favorites')
      .set('Cookie', user2Cookie)
      .send({ tmdbId: 550, mediaType: 'movie' });

    // Tenter de supprimer avec user1
    await request(app)
      .delete('/api/favorites/550/movie')
      .set('Cookie', authCookie)
      .expect(404);

    // Vérifier que le favori de user2 existe toujours
    const user2Favorites = await request(app)
      .get('/api/favorites')
      .set('Cookie', user2Cookie);

    expect(user2Favorites.body.data.favorites).toHaveLength(1);
  });
});

// ===== TESTS GET /api/favorites/:tmdbId/:mediaType - VÉRIFIER UN FAVORI =====

describe('GET /api/favorites/:tmdbId/:mediaType', () => {
  
  test('Devrait retourner true si le contenu est favori', async () => {
    // Ajouter un favori
    await request(app)
      .post('/api/favorites')
      .set('Cookie', authCookie)
      .send({ tmdbId: 550, mediaType: 'movie' });

    // Vérifier
    const response = await request(app)
      .get('/api/favorites/550/movie')
      .set('Cookie', authCookie)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Status favori');
    expect(response.body.data.isFavorite).toBe(true);
  });

  test('Devrait retourner false si le contenu n\'est pas favori', async () => {
    const response = await request(app)
      .get('/api/favorites/999999/movie')
      .set('Cookie', authCookie)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.isFavorite).toBe(false);
  });

  test('Devrait échouer sans authentification', async () => {
    const response = await request(app)
      .get('/api/favorites/550/movie')
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test('Devrait être false pour les favoris d\'autres utilisateurs', async () => {
    // Créer un deuxième utilisateur
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user2@test.com',
        username: 'user2',
        password: 'TestPassword123!@#'
      });

    const user2Login = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user2@test.com',
        password: 'TestPassword123!@#'
      });

    const user2Cookie = user2Login.headers['set-cookie'];

    // Ajouter un favori pour user2
    await request(app)
      .post('/api/favorites')
      .set('Cookie', user2Cookie)
      .send({ tmdbId: 550, mediaType: 'movie' });

    // Vérifier avec user1
    const response = await request(app)
      .get('/api/favorites/550/movie')
      .set('Cookie', authCookie)
      .expect(200);

    expect(response.body.data.isFavorite).toBe(false);
  });
});

// ===== TESTS DE PERSISTANCE =====

describe('Persistance des favoris', () => {
  
  test('Les favoris devraient persister après déconnexion/reconnexion', async () => {
    // Ajouter un favori
    await request(app)
      .post('/api/favorites')
      .set('Cookie', authCookie)
      .send({ tmdbId: 550, mediaType: 'movie' });

    // Se déconnecter
    await request(app)
      .post('/api/auth/logout')
      .set('Cookie', authCookie);

    // Se reconnecter
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    const newAuthCookie = loginResponse.headers['set-cookie'];

    // Vérifier que le favori existe toujours
    const response = await request(app)
      .get('/api/favorites')
      .set('Cookie', newAuthCookie)
      .expect(200);

    expect(response.body.data.favorites).toHaveLength(1);
    expect(response.body.data.favorites[0].tmdb_id).toBe(550);
  });

  test('Plusieurs favoris du même type devraient être distincts', async () => {
    // Ajouter plusieurs films
    await request(app)
      .post('/api/favorites')
      .set('Cookie', authCookie)
      .send({ tmdbId: 550, mediaType: 'movie' });

    await request(app)
      .post('/api/favorites')
      .set('Cookie', authCookie)
      .send({ tmdbId: 680, mediaType: 'movie' });

    await request(app)
      .post('/api/favorites')
      .set('Cookie', authCookie)
      .send({ tmdbId: 155, mediaType: 'movie' });

    // Récupérer les favoris
    const response = await request(app)
      .get('/api/favorites')
      .set('Cookie', authCookie)
      .expect(200);

    expect(response.body.data.favorites).toHaveLength(3);
  });

  test('Un même contenu peut être favori en movie et tv (si applicable)', async () => {
    // Note: Dans la vraie vie, un tmdbId ne peut pas être à la fois movie et tv
    // Mais on teste que le système permet de les distinguer
    await request(app)
      .post('/api/favorites')
      .set('Cookie', authCookie)
      .send({ tmdbId: 100, mediaType: 'movie' });

    await request(app)
      .post('/api/favorites')
      .set('Cookie', authCookie)
      .send({ tmdbId: 100, mediaType: 'tv' });

    const response = await request(app)
      .get('/api/favorites')
      .set('Cookie', authCookie)
      .expect(200);

    expect(response.body.data.favorites).toHaveLength(2);
  });
});
