// __tests__/rate-limiting.test.js
// Tests pour le rate limiting

const request = require('supertest');
const app = require('../src/app');
const { initializeDatabase, closeDatabase, clearDatabase } = require('../src/config/database');

describe('Rate Limiting', () => {
  
  beforeAll(async () => {
    await initializeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Auth Rate Limiting - 5 tentatives / 10 minutes', () => {
    it('should allow 5 login attempts', async () => {
      const credentials = { 
        email: 'nonexistent@test.com', 
        password: 'WrongPassword123!' 
      };

      // 5 tentatives doivent passer (même si elles échouent au niveau auth)
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send(credentials);

        // La requête passe le rate limiter mais échoue sur l'auth
        expect(response.status).toBe(401);
      }
    });

    it('should block 6th login attempt', async () => {
      const credentials = { 
        email: 'nonexistent@test.com', 
        password: 'WrongPassword123!' 
      };

      // 5 tentatives
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(credentials);
      }

      // 6ème tentative doit être bloquée par rate limiter
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('10 minutes');
    });

    it('should apply rate limit to register endpoint', async () => {
      const userData = {
        email: 'test@test.com',
        username: 'testuser',
        password: 'short'
      };

      // 5 tentatives avec mot de passe invalide
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/register')
          .send(userData);
      }

      // 6ème tentative bloquée
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(429);
    });
  });

  describe('General API Rate Limiting - 500 req / 15 minutes', () => {
    it('should allow multiple API calls under the limit', async () => {
      // Faire 10 appels à différentes routes API
      const calls = [];
      for (let i = 0; i < 10; i++) {
        calls.push(
          request(app).get('/api/tmdb/trending')
        );
      }

      const responses = await Promise.all(calls);

      // Toutes les requêtes doivent passer
      responses.forEach(response => {
        expect(response.status).not.toBe(429);
      });
    });

    it('should include rate limit headers', async () => {
      const response = await request(app).get('/api/tmdb/trending');

      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });
  });

  describe('Rate Limit Independence', () => {
    it('should not affect /health endpoint', async () => {
      // /health ne doit pas être limité
      const calls = [];
      for (let i = 0; i < 10; i++) {
        calls.push(request(app).get('/health'));
      }

      const responses = await Promise.all(calls);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});
