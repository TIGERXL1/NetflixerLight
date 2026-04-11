// __tests__/ratings.test.js
// Tests d'intégration pour les endpoints de notation

const request = require('supertest');
const app = require('../src/app');
const { initializeDatabase, closeDatabase, clearDatabase } = require('../src/config/database');

// Variables pour stocker les données de test
let testUser = {
  email: 'test@netflixlight.com',
  username: 'testuser',
  password: 'password123'
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

// ===== TESTS POST /api/ratings - AJOUTER/MODIFIER UNE NOTE =====

describe('POST /api/ratings', () => {
  
  test('Devrait ajouter une note à un film', async () => {
    const response = await request(app)
      .post('/api/ratings')
      .set('Cookie', authCookie)
      .send({
        tmdbId: 550,
        mediaType: 'movie',
        rating: 5
      })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Note enregistrée');
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.tmdb_id).toBe(550);
    expect(response.body.data.media_type).toBe('movie');
    expect(response.body.data.rating).toBe(5);
  });

  test('Devrait ajouter une note à une série', async () => {
    const response = await request(app)
      .post('/api/ratings')
      .set('Cookie', authCookie)
      .send({
        tmdbId: 1396,
        mediaType: 'tv',
        rating: 4
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.tmdb_id).toBe(1396);
    expect(response.body.data.media_type).toBe('tv');
    expect(response.body.data.rating).toBe(4);
  });

  test('Devrait mettre à jour une note existante (UPSERT)', async () => {
    // Ajouter une première note
    await request(app)
      .post('/api/ratings')
      .set('Cookie', authCookie)
      .send({
        tmdbId: 550,
        mediaType: 'movie',
        rating: 3
      })
      .expect(201);

    // Modifier la note
    const response = await request(app)
      .post('/api/ratings')
      .set('Cookie', authCookie)
      .send({
        tmdbId: 550,
        mediaType: 'movie',
        rating: 5
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.rating).toBe(5);

    // Vérifier qu'il n'y a qu'une seule note
    const ratings = await request(app)
      .get('/api/ratings')
      .set('Cookie', authCookie);

    expect(ratings.body.data.ratings).toHaveLength(1);
    expect(ratings.body.data.ratings[0].rating).toBe(5);
  });

  test('Devrait échouer sans authentification', async () => {
    const response = await request(app)
      .post('/api/ratings')
      .send({
        tmdbId: 550,
        mediaType: 'movie',
        rating: 5
      })
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test('Devrait échouer si tmdbId est manquant', async () => {
    const response = await request(app)
      .post('/api/ratings')
      .set('Cookie', authCookie)
      .send({
        mediaType: 'movie',
        rating: 5
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('tmdbId, mediaType et rating requis');
  });

  test('Devrait échouer si mediaType est manquant', async () => {
    const response = await request(app)
      .post('/api/ratings')
      .set('Cookie', authCookie)
      .send({
        tmdbId: 550,
        rating: 5
      })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  test('Devrait échouer si rating est manquant', async () => {
    const response = await request(app)
      .post('/api/ratings')
      .set('Cookie', authCookie)
      .send({
        tmdbId: 550,
        mediaType: 'movie'
      })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  test('Devrait échouer si mediaType est invalide', async () => {
    const response = await request(app)
      .post('/api/ratings')
      .set('Cookie', authCookie)
      .send({
        tmdbId: 550,
        mediaType: 'invalid',
        rating: 5
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('mediaType invalide');
  });

  test('Devrait échouer si rating < 1', async () => {
    const response = await request(app)
      .post('/api/ratings')
      .set('Cookie', authCookie)
      .send({
        tmdbId: 550,
        mediaType: 'movie',
        rating: 0
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('rating doit être un nombre entre 1 et 5');
  });

  test('Devrait échouer si rating > 5', async () => {
    const response = await request(app)
      .post('/api/ratings')
      .set('Cookie', authCookie)
      .send({
        tmdbId: 550,
        mediaType: 'movie',
        rating: 6
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('rating doit être un nombre entre 1 et 5');
  });
});

// ===== TESTS GET /api/ratings - RÉCUPÉRER LES NOTES =====

describe('GET /api/ratings', () => {
  
  test('Devrait retourner une liste vide si aucune note', async () => {
    const response = await request(app)
      .get('/api/ratings')
      .set('Cookie', authCookie)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Notes récupérées');
    expect(response.body.data.ratings).toEqual([]);
  });

  test('Devrait retourner les notes de l\'utilisateur', async () => {
    // Ajouter quelques notes
    await request(app)
      .post('/api/ratings')
      .set('Cookie', authCookie)
      .send({ tmdbId: 550, mediaType: 'movie', rating: 5 });

    await request(app)
      .post('/api/ratings')
      .set('Cookie', authCookie)
      .send({ tmdbId: 1396, mediaType: 'tv', rating: 4 });

    // Récupérer les notes
    const response = await request(app)
      .get('/api/ratings')
      .set('Cookie', authCookie)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.ratings).toHaveLength(2);
    expect(response.body.data.ratings[0]).toHaveProperty('tmdb_id');
    expect(response.body.data.ratings[0]).toHaveProperty('rating');
  });

  test('Devrait échouer sans authentification', async () => {
    const response = await request(app)
      .get('/api/ratings')
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test('Ne devrait retourner que les notes de l\'utilisateur connecté', async () => {
    // Ajouter une note pour l'utilisateur de test
    await request(app)
      .post('/api/ratings')
      .set('Cookie', authCookie)
      .send({ tmdbId: 550, mediaType: 'movie', rating: 5 });

    // Créer un deuxième utilisateur
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user2@test.com',
        username: 'user2',
        password: 'password123'
      });

    const user2Login = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user2@test.com',
        password: 'password123'
      });

    const user2Cookie = user2Login.headers['set-cookie'];

    // Ajouter une note pour le deuxième utilisateur
    await request(app)
      .post('/api/ratings')
      .set('Cookie', user2Cookie)
      .send({ tmdbId: 1396, mediaType: 'tv', rating: 3 });

    // Vérifier que le premier utilisateur ne voit que sa note
    const response = await request(app)
      .get('/api/ratings')
      .set('Cookie', authCookie)
      .expect(200);

    expect(response.body.data.ratings).toHaveLength(1);
    expect(response.body.data.ratings[0].tmdb_id).toBe(550);
  });
});

// ===== TESTS GET /api/ratings/:tmdbId/:mediaType - RÉCUPÉRER UNE NOTE =====

describe('GET /api/ratings/:tmdbId/:mediaType', () => {
  
  test('Devrait retourner une note existante', async () => {
    // Ajouter une note
    await request(app)
      .post('/api/ratings')
      .set('Cookie', authCookie)
      .send({ tmdbId: 550, mediaType: 'movie', rating: 5 });

    // Vérifier
    const response = await request(app)
      .get('/api/ratings/550/movie')
      .set('Cookie', authCookie)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Note récupérée');
    expect(response.body.data.rating).toBe(5);
  });

  test('Devrait retourner null si la note n\'existe pas', async () => {
    const response = await request(app)
      .get('/api/ratings/999999/movie')
      .set('Cookie', authCookie)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.rating).toBeNull();
  });

  test('Devrait échouer sans authentification', async () => {
    const response = await request(app)
      .get('/api/ratings/550/movie')
      .expect(401);

    expect(response.body.success).toBe(false);
  });
});

// ===== TESTS DELETE /api/ratings/:tmdbId/:mediaType - SUPPRIMER UNE NOTE =====

describe('DELETE /api/ratings/:tmdbId/:mediaType', () => {
  
  test('Devrait supprimer une note existante', async () => {
    // Ajouter une note
    await request(app)
      .post('/api/ratings')
      .set('Cookie', authCookie)
      .send({ tmdbId: 550, mediaType: 'movie', rating: 5 });

    // Supprimer la note
    const response = await request(app)
      .delete('/api/ratings/550/movie')
      .set('Cookie', authCookie)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Note supprimée');

    // Vérifier que la note n'existe plus
    const getRatings = await request(app)
      .get('/api/ratings')
      .set('Cookie', authCookie);

    expect(getRatings.body.data.ratings).toHaveLength(0);
  });

  test('Devrait échouer sans authentification', async () => {
    const response = await request(app)
      .delete('/api/ratings/550/movie')
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test('Devrait échouer si la note n\'existe pas', async () => {
    const response = await request(app)
      .delete('/api/ratings/999999/movie')
      .set('Cookie', authCookie)
      .expect(404);

    expect(response.body.success).toBe(false);
  });
});
