// __tests__/viewingHistory.test.js
// Tests d'intégration pour les endpoints d'historique de visionnage

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

// ===== TESTS POST /api/history - AJOUTER À L'HISTORIQUE =====

describe('POST /api/history', () => {
  
  test('Devrait ajouter un film à l\'historique avec authentification', async () => {
    const response = await request(app)
      .post('/api/history')
      .set('Cookie', authCookie)
      .send({
        tmdbId: 550,
        mediaType: 'movie'
      })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Consultation ajoutée à l\'historique');
    expect(response.body.data.entry).toHaveProperty('id');
    expect(response.body.data.entry.tmdb_id).toBe(550);
    expect(response.body.data.entry.media_type).toBe('movie');
  });

  test('Devrait ajouter une série à l\'historique', async () => {
    const response = await request(app)
      .post('/api/history')
      .set('Cookie', authCookie)
      .send({
        tmdbId: 1396,
        mediaType: 'tv'
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.entry.tmdb_id).toBe(1396);
    expect(response.body.data.entry.media_type).toBe('tv');
  });

  test('Devrait échouer sans authentification', async () => {
    const response = await request(app)
      .post('/api/history')
      .send({
        tmdbId: 550,
        mediaType: 'movie'
      })
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test('Devrait échouer si tmdbId est manquant', async () => {
    const response = await request(app)
      .post('/api/history')
      .set('Cookie', authCookie)
      .send({
        mediaType: 'movie'
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('tmdbId et mediaType sont requis');
  });

  test('Devrait échouer si mediaType est manquant', async () => {
    const response = await request(app)
      .post('/api/history')
      .set('Cookie', authCookie)
      .send({
        tmdbId: 550
      })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  test('Devrait échouer si mediaType est invalide', async () => {
    const response = await request(app)
      .post('/api/history')
      .set('Cookie', authCookie)
      .send({
        tmdbId: 550,
        mediaType: 'invalid'
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('mediaType doit être "movie" ou "tv"');
  });

  test('Devrait permettre d\'ajouter plusieurs fois le même contenu', async () => {
    // Premier ajout
    await request(app)
      .post('/api/history')
      .set('Cookie', authCookie)
      .send({ tmdbId: 550, mediaType: 'movie' })
      .expect(201);

    // Deuxième ajout (devrait réussir)
    const response = await request(app)
      .post('/api/history')
      .set('Cookie', authCookie)
      .send({ tmdbId: 550, mediaType: 'movie' })
      .expect(201);

    expect(response.body.success).toBe(true);
  });
});

// ===== TESTS GET /api/history - RÉCUPÉRER L'HISTORIQUE =====

describe('GET /api/history', () => {
  
  test('Devrait récupérer l\'historique vide initialement', async () => {
    const response = await request(app)
      .get('/api/history')
      .set('Cookie', authCookie)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.history).toEqual([]);
    expect(response.body.data.count).toBe(0);
  });

  test('Devrait récupérer l\'historique avec une entrée', async () => {
    // Ajouter une entrée
    await request(app)
      .post('/api/history')
      .set('Cookie', authCookie)
      .send({ tmdbId: 550, mediaType: 'movie' });

    // Récupérer l'historique
    const response = await request(app)
      .get('/api/history')
      .set('Cookie', authCookie)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.history).toHaveLength(1);
    expect(response.body.data.history[0].tmdb_id).toBe(550);
    expect(response.body.data.history[0].media_type).toBe('movie');
  });

  test('Devrait récupérer l\'historique avec plusieurs entrées', async () => {
    // Ajouter plusieurs entrées
    await request(app).post('/api/history').set('Cookie', authCookie).send({ tmdbId: 550, mediaType: 'movie' });
    await request(app).post('/api/history').set('Cookie', authCookie).send({ tmdbId: 1396, mediaType: 'tv' });
    await request(app).post('/api/history').set('Cookie', authCookie).send({ tmdbId: 680, mediaType: 'movie' });

    // Récupérer l'historique
    const response = await request(app)
      .get('/api/history')
      .set('Cookie', authCookie)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.history).toHaveLength(3);
    expect(response.body.data.count).toBe(3);
  });

  test('Devrait respecter le paramètre limit', async () => {
    // Ajouter 5 entrées
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/history').set('Cookie', authCookie).send({ tmdbId: 100 + i, mediaType: 'movie' });
    }

    // Récupérer avec limit=3
    const response = await request(app)
      .get('/api/history?limit=3')
      .set('Cookie', authCookie)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.history).toHaveLength(3);
  });

  test('Devrait échouer si limit est invalide (trop grand)', async () => {
    const response = await request(app)
      .get('/api/history?limit=200')
      .set('Cookie', authCookie)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('limit doit être entre 1 et 100');
  });

  test('Devrait échouer si limit est invalide (trop petit)', async () => {
    const response = await request(app)
      .get('/api/history?limit=0')
      .set('Cookie', authCookie)
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  test('Devrait échouer sans authentification', async () => {
    const response = await request(app)
      .get('/api/history')
      .expect(401);

    expect(response.body.success).toBe(false);
  });
});

// ===== TESTS DELETE /api/history - EFFACER TOUT L'HISTORIQUE =====

describe('DELETE /api/history', () => {
  
  test('Devrait effacer tout l\'historique', async () => {
    // Ajouter plusieurs entrées
    await request(app).post('/api/history').set('Cookie', authCookie).send({ tmdbId: 550, mediaType: 'movie' });
    await request(app).post('/api/history').set('Cookie', authCookie).send({ tmdbId: 1396, mediaType: 'tv' });

    // Effacer
    const deleteResponse = await request(app)
      .delete('/api/history')
      .set('Cookie', authCookie)
      .expect(200);

    expect(deleteResponse.body.success).toBe(true);
    expect(deleteResponse.body.message).toBe('Historique effacé avec succès');
    expect(deleteResponse.body.data.deletedCount).toBe(2);

    // Vérifier que l'historique est vide
    const getResponse = await request(app)
      .get('/api/history')
      .set('Cookie', authCookie)
      .expect(200);

    expect(getResponse.body.data.history).toHaveLength(0);
  });

  test('Devrait retourner 0 si l\'historique est déjà vide', async () => {
    const response = await request(app)
      .delete('/api/history')
      .set('Cookie', authCookie)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.deletedCount).toBe(0);
  });

  test('Devrait échouer sans authentification', async () => {
    const response = await request(app)
      .delete('/api/history')
      .expect(401);

    expect(response.body.success).toBe(false);
  });
});

// ===== TESTS DELETE /api/history/:tmdbId/:mediaType - SUPPRIMER UNE ENTRÉE =====

describe('DELETE /api/history/:tmdbId/:mediaType', () => {
  
  test('Devrait supprimer une entrée spécifique', async () => {
    // Ajouter une entrée
    await request(app).post('/api/history').set('Cookie', authCookie).send({ tmdbId: 550, mediaType: 'movie' });

    // Supprimer
    const response = await request(app)
      .delete('/api/history/550/movie')
      .set('Cookie', authCookie)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Entrée supprimée de l\'historique');
    expect(response.body.data.deletedCount).toBeGreaterThan(0);

    // Vérifier que l'entrée est supprimée
    const getResponse = await request(app)
      .get('/api/history')
      .set('Cookie', authCookie)
      .expect(200);

    expect(getResponse.body.data.history).toHaveLength(0);
  });

  test('Devrait retourner 404 si l\'entrée n\'existe pas', async () => {
    const response = await request(app)
      .delete('/api/history/999/movie')
      .set('Cookie', authCookie)
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Entrée non trouvée dans l\'historique');
  });

  test('Devrait échouer si mediaType est invalide', async () => {
    const response = await request(app)
      .delete('/api/history/550/invalid')
      .set('Cookie', authCookie)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('mediaType doit être "movie" ou "tv"');
  });

  test('Devrait échouer sans authentification', async () => {
    const response = await request(app)
      .delete('/api/history/550/movie')
      .expect(401);

    expect(response.body.success).toBe(false);
  });
});
