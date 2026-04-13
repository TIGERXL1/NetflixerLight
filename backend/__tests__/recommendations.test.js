// __tests__/recommendations.test.js
// Tests pour le système de recommandations personnalisées

const request = require('supertest');
const app = require('../src/app');
const { clearDatabase } = require('../src/config/database');

describe('GET /api/recommendations', () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    await clearDatabase();
    
    // Créer un utilisateur et se connecter
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@test.com',
        password: 'TestPassword123!@#'
      });

    userId = registerRes.body.data.user.id;
    
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'TestPassword123!@#'
      });

    authToken = loginRes.body.data.token;
  });

  describe('Sans données utilisateur (fallback)', () => {
    it('Devrait retourner des recommandations populaires par défaut', async () => {
      const res = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('recommendations');
      expect(res.body.data).toHaveProperty('basedOn');
      expect(Array.isArray(res.body.data.recommendations)).toBe(true);
      expect(res.body.data.recommendations.length).toBeGreaterThan(0);
      expect(res.body.data.basedOn.favoritesCount).toBe(0);
      expect(res.body.data.basedOn.ratingsCount).toBe(0);
    });
  });

  describe('Avec données utilisateur', () => {
    beforeEach(async () => {
      // Ajouter des favoris
      await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tmdbId: 550, mediaType: 'movie' }); // Fight Club

      await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tmdbId: 680, mediaType: 'movie' }); // Pulp Fiction

      // Ajouter des notes élevées
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tmdbId: 13, mediaType: 'movie', rating: 5 }); // Forrest Gump

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tmdbId: 278, mediaType: 'movie', rating: 5 }); // Shawshank Redemption
    });

    it('Devrait retourner des recommandations basées sur les favoris et notes', async () => {
      const res = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('recommendations');
      expect(res.body.data).toHaveProperty('basedOn');
      expect(res.body.data.basedOn.topGenres).toBeDefined();
      expect(Array.isArray(res.body.data.basedOn.topGenres)).toBe(true);
      expect(res.body.data.basedOn.favoritesCount).toBe(2);
      expect(res.body.data.basedOn.ratingsCount).toBe(2);
    });

    it('Devrait filtrer les contenus déjà favoris', async () => {
      const res = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      
      const recommendations = res.body.data.recommendations;
      const favoritedIds = [550, 680, 13, 278];
      
      // Vérifier qu'aucune recommandation ne contient les IDs déjà favoris/notés
      recommendations.forEach(rec => {
        expect(favoritedIds).not.toContain(rec.id);
      });
    });

    it('Devrait respecter le paramètre mediaType=movie', async () => {
      const res = await request(app)
        .get('/api/recommendations?mediaType=movie')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      
      const recommendations = res.body.data.recommendations;
      recommendations.forEach(rec => {
        expect(rec.media_type).toBe('movie');
      });
    });

    it('Devrait respecter le paramètre mediaType=tv', async () => {
      const res = await request(app)
        .get('/api/recommendations?mediaType=tv')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      
      const recommendations = res.body.data.recommendations;
      recommendations.forEach(rec => {
        expect(rec.media_type).toBe('tv');
      });
    });

    it('Devrait respecter le paramètre limit', async () => {
      const limit = 5;
      const res = await request(app)
        .get(`/api/recommendations?limit=${limit}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.recommendations.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('Validation des paramètres', () => {
    it('Devrait échouer avec un mediaType invalide', async () => {
      const res = await request(app)
        .get('/api/recommendations?mediaType=invalid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Devrait échouer avec un limit trop grand', async () => {
      const res = await request(app)
        .get('/api/recommendations?limit=100')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Devrait échouer avec un limit trop petit', async () => {
      const res = await request(app)
        .get('/api/recommendations?limit=0')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Devrait échouer sans authentification', async () => {
      const res = await request(app)
        .get('/api/recommendations');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Isolation utilisateur', () => {
    it('Ne devrait retourner que les recommandations de l\'utilisateur connecté', async () => {
      // Créer un second utilisateur
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user2',
          email: 'user2@test.com',
          password: 'TestPassword123!@#'
        });

      const login2Res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user2@test.com',
          password: 'TestPassword123!@#'
        });

      const authToken2 = login2Res.body.data.token;

      // Ajouter des favoris pour user2
      await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ tmdbId: 100, mediaType: 'movie' });

      // Obtenir les recommandations pour user1
      const res1 = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${authToken}`);

      // Obtenir les recommandations pour user2
      const res2 = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${authToken2}`);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);

      // Les recommandations peuvent être différentes basées sur des favoris différents
      // Nous vérifions juste qu'elles sont bien isolées
      expect(res1.body.data.basedOn.favoritesCount).toBe(0);
      expect(res2.body.data.basedOn.favoritesCount).toBe(1);
    });
  });
});
