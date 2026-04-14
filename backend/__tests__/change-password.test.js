// __tests__/change-password.test.js
// Tests pour la fonctionnalité de changement de mot de passe

const request = require('supertest');
const app = require('../src/app');
const { clearDatabase } = require('../src/config/database');

describe('Change Password', () => {
  let authToken;
  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'OldPassword123!'
  };

  beforeEach(async () => {
    await clearDatabase();
    
    // Créer un utilisateur de test
    await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    // Se connecter pour obtenir un token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    authToken = loginResponse.headers['set-cookie'];
  });

  test('should successfully change password with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', authToken)
      .send({
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('succès');

    // Vérifier qu'on peut se connecter avec le nouveau mot de passe
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'NewPassword456!'
      });

    expect(loginResponse.status).toBe(200);
  });

  test('should fail with incorrect current password', async () => {
    const response = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', authToken)
      .send({
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword456!'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('incorrect');
  });

  test('should fail with weak new password', async () => {
    const response = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', authToken)
      .send({
        currentPassword: 'OldPassword123!',
        newPassword: 'weak'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('12 caractères');
  });

  test('should fail when using same password', async () => {
    const response = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', authToken)
      .send({
        currentPassword: 'OldPassword123!',
        newPassword: 'OldPassword123!'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('différent');
  });

  test('should fail without authentication', async () => {
    const response = await request(app)
      .post('/api/auth/change-password')
      .send({
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!'
      });

    expect(response.status).toBe(401);
  });

  test('should fail with missing fields', async () => {
    const response = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', authToken)
      .send({
        currentPassword: 'OldPassword123!'
        // newPassword manquant
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('requis');
  });
});
