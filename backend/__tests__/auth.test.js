// __tests__/auth.test.js
// Tests d'intégration pour les endpoints d'authentification

const request = require('supertest');
const app = require('../src/app');
const { initializeDatabase, closeDatabase, clearDatabase } = require('../src/config/database');

// Variables pour stocker les données de test
let testUser = {
  email: 'test@netflixlight.com',
  username: 'testuser',
  password: 'password123'
};

// Setup : Initialiser la base de données avant tous les tests
beforeAll(async () => {
  await initializeDatabase();
});

// Cleanup : Nettoyer la base de données avant chaque test
beforeEach(async () => {
  await clearDatabase();
});

// Cleanup : Fermer la connexion après tous les tests
afterAll(async () => {
  await closeDatabase();
});

// ===== TESTS D'INSCRIPTION =====

describe('POST /api/auth/register', () => {
  
  test('Devrait créer un nouvel utilisateur avec des données valides', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect('Content-Type', /json/)
      .expect(201);

    // Vérifier la structure de la réponse
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Inscription réussie');
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data).toHaveProperty('token');

    // Vérifier les données utilisateur
    expect(response.body.data.user.email).toBe(testUser.email);
    expect(response.body.data.user.username).toBe(testUser.username);
    expect(response.body.data.user).not.toHaveProperty('password'); // Le password ne doit pas être retourné
  });

  test('Devrait échouer si l\'email existe déjà', async () => {
    // Créer un premier utilisateur
    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    // Tenter de créer un second utilisateur avec le même email
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Email');
  });

  test('Devrait échouer si le username existe déjà', async () => {
    // Créer un premier utilisateur
    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    // Tenter de créer un utilisateur avec un email différent mais même username
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'autre@netflixlight.com',
        username: testUser.username,
        password: 'password456'
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('utilisateur');
  });

  test('Devrait échouer si le mot de passe est trop court', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: testUser.email,
        username: testUser.username,
        password: '12345' // Moins de 6 caractères
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('6 caractères');
  });

  test('Devrait échouer si des champs sont manquants', async () => {
    // Test sans email
    let response = await request(app)
      .post('/api/auth/register')
      .send({
        username: testUser.username,
        password: testUser.password
      })
      .expect(400);
    expect(response.body.success).toBe(false);

    // Test sans username
    response = await request(app)
      .post('/api/auth/register')
      .send({
        email: testUser.email,
        password: testUser.password
      })
      .expect(400);
    expect(response.body.success).toBe(false);

    // Test sans password
    response = await request(app)
      .post('/api/auth/register')
      .send({
        email: testUser.email,
        username: testUser.username
      })
      .expect(400);
    expect(response.body.success).toBe(false);
  });

  test('Devrait hasher le mot de passe en base de données', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    // Le token devrait être retourné (preuve que le hash fonctionne)
    expect(response.body.data.token).toBeDefined();
    expect(typeof response.body.data.token).toBe('string');
  });
});

// ===== TESTS DE CONNEXION =====

describe('POST /api/auth/login', () => {
  
  // Créer un utilisateur avant chaque test de login
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send(testUser);
  });

  test('Devrait connecter un utilisateur avec des credentials valides', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Connexion réussie');
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data).toHaveProperty('token');
    expect(response.body.data.user.email).toBe(testUser.email);
  });

  test('Devrait échouer si l\'email est incorrect', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrong@email.com',
        password: testUser.password
      })
      .expect('Content-Type', /json/)
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test('Devrait échouer si le mot de passe est incorrect', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      })
      .expect('Content-Type', /json/)
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test('Devrait échouer si des champs sont manquants', async () => {
    // Sans email
    let response = await request(app)
      .post('/api/auth/login')
      .send({ password: testUser.password })
      .expect(400);
    expect(response.body.success).toBe(false);

    // Sans password
    response = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email })
      .expect(400);
    expect(response.body.success).toBe(false);
  });

  test('Devrait créer une session après connexion réussie', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      })
      .expect(200);

    // Vérifier que le cookie de session est présent
    expect(response.headers['set-cookie']).toBeDefined();
  });
});

// ===== TESTS DE DÉCONNEXION =====

describe('POST /api/auth/logout', () => {
  
  let authCookie;

  beforeEach(async () => {
    // Créer un utilisateur et se connecter
    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    // Récupérer le cookie de session
    authCookie = loginResponse.headers['set-cookie'];
  });

  test('Devrait déconnecter un utilisateur authentifié', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', authCookie)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Déconnexion réussie');
  });

  test('Devrait échouer si l\'utilisateur n\'est pas authentifié', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .expect('Content-Type', /json/)
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test('Devrait détruire la session et le cookie', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', authCookie)
      .expect(200);

    // Vérifier que le cookie est bien supprimé
    expect(response.headers['set-cookie']).toBeDefined();
  });
});

// ===== TESTS DU PROFIL =====

describe('GET /api/auth/profile', () => {
  
  let authCookie;

  beforeEach(async () => {
    // Créer un utilisateur et se connecter
    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    authCookie = loginResponse.headers['set-cookie'];
  });

  test('Devrait retourner le profil d\'un utilisateur authentifié', async () => {
    const response = await request(app)
      .get('/api/auth/profile')
      .set('Cookie', authCookie)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Profil récupéré');
    expect(response.body.data.user.email).toBe(testUser.email);
    expect(response.body.data.user.username).toBe(testUser.username);
    expect(response.body.data.user).not.toHaveProperty('password');
  });

  test('Devrait échouer si l\'utilisateur n\'est pas authentifié', async () => {
    const response = await request(app)
      .get('/api/auth/profile')
      .expect('Content-Type', /json/)
      .expect(401);

    expect(response.body.success).toBe(false);
  });
});

// ===== TESTS DE SÉCURITÉ =====

describe('Sécurité - Authentification', () => {
  
  test('Ne devrait jamais retourner le mot de passe hashé dans les réponses', async () => {
    // Test register
    let response = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);
    expect(response.body.data.user).not.toHaveProperty('password');

    // Test login
    response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      })
      .expect(200);
    expect(response.body.data.user).not.toHaveProperty('password');
  });

  test('Devrait retourner un JWT valide après inscription/connexion', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(response.body.data.token).toBeDefined();
    expect(typeof response.body.data.token).toBe('string');
    expect(response.body.data.token.length).toBeGreaterThan(20);
  });
});
