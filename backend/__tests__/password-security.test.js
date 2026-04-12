// __tests__/password-security.test.js
// Tests de sécurité pour la politique de mots de passe ANSSI 2026

const request = require('supertest');
const app = require('../src/app');
const { initializeDatabase, closeDatabase, clearDatabase } = require('../src/config/database');

describe('Password Security Policy - ANSSI 2026', () => {
  
  beforeAll(async () => {
    await initializeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Longueur minimale', () => {
    it('should reject password with less than 12 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'testuser',
          password: 'Short1!'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('12 caractères');
    });

    it('should accept password with exactly 12 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'testuser',
          password: 'Password123!'
        });

      expect(response.status).toBe(201);
    });

    it('should accept password with more than 12 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test2@test.com',
          username: 'testuser2',
          password: 'MySecurePassword123!'
        });

      expect(response.status).toBe(201);
    });
  });

  describe('Complexité - Majuscule', () => {
    it('should reject password without uppercase letter', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'testuser',
          password: 'password123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('majuscule');
    });

    it('should accept password with uppercase letter', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'testuser',
          password: 'Password123!'
        });

      expect(response.status).toBe(201);
    });
  });

  describe('Complexité - Minuscule', () => {
    it('should reject password without lowercase letter', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'testuser',
          password: 'PASSWORD123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('minuscule');
    });

    it('should accept password with lowercase letter', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'testuser',
          password: 'Password123!'
        });

      expect(response.status).toBe(201);
    });
  });

  describe('Complexité - Chiffre', () => {
    it('should reject password without number', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'testuser',
          password: 'PasswordTest!'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('chiffre');
    });

    it('should accept password with number', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'testuser',
          password: 'Password123!'
        });

      expect(response.status).toBe(201);
    });
  });

  describe('Complexité - Caractère spécial', () => {
    it('should reject password without special character', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'testuser',
          password: 'Password1234'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('caractère spécial');
    });

    it('should accept password with special character', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'testuser',
          password: 'Password123!'
        });

      expect(response.status).toBe(201);
    });

    it('should accept various special characters', async () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '='];
      
      for (let i = 0; i < specialChars.length; i++) {
        const char = specialChars[i];
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: `test${i}@test.com`,
            username: `testuser${i}`,
            password: `Password123${char}`
          });

        expect(response.status).toBe(201);
      }
    });
  });

  describe('Validation email', () => {
    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalidemail',
          username: 'testuser',
          password: 'Password123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('email');
    });

    it('should accept valid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'valid@example.com',
          username: 'testuser',
          password: 'Password123!'
        });

      expect(response.status).toBe(201);
    });
  });

  describe('Hash bcrypt', () => {
    it('should store hashed password, not plain text', async () => {
      const User = require('../src/models/User');
      const password = 'Password123!';
      
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'testuser',
          password
        });

      const user = await User.findByEmail('test@test.com');

      expect(user.password).not.toBe(password);
      expect(user.password).toMatch(/^\$2[aby]\$\d{2}\$/);
    });

    it('should use bcrypt with at least 10 rounds', async () => {
      const User = require('../src/models/User');
      
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'testuser',
          password: 'Password123!'
        });

      const user = await User.findByEmail('test@test.com');

      const rounds = parseInt(user.password.split('$')[2]);
      expect(rounds).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Cas limites', () => {
    it('should handle very long passwords', async () => {
      const longPassword = 'A1!' + 'a'.repeat(100);
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'testuser',
          password: longPassword
        });

      expect(response.status).toBe(201);
    });

    it('should reject empty password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'testuser',
          password: ''
        });

      expect(response.status).toBe(400);
    });
  });
});
