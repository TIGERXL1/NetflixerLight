// __tests__/helmet-security.test.js
// Tests pour les headers de sécurité HTTP (helmet.js)

const request = require('supertest');
const app = require('../src/app');

describe('Helmet Security Headers', () => {
  
  describe('Content Security Policy (CSP)', () => {
    it('should have Content-Security-Policy header', async () => {
      const response = await request(app).get('/health');

      expect(response.headers).toHaveProperty('content-security-policy');
    });

    it('should allow TMDB images in CSP', async () => {
      const response = await request(app).get('/health');
      
      const csp = response.headers['content-security-policy'];
      expect(csp).toContain('https://image.tmdb.org');
    });
  });

  describe('X-Content-Type-Options', () => {
    it('should set X-Content-Type-Options to nosniff', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('X-Frame-Options', () => {
    it('should have X-Frame-Options header', async () => {
      const response = await request(app).get('/health');

      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });

  describe('Strict-Transport-Security (HSTS)', () => {
    it('should have Strict-Transport-Security header', async () => {
      const response = await request(app).get('/health');

      expect(response.headers).toHaveProperty('strict-transport-security');
    });

    it('should set HSTS for 1 year with includeSubDomains', async () => {
      const response = await request(app).get('/health');
      
      const hsts = response.headers['strict-transport-security'];
      expect(hsts).toContain('max-age=31536000');
      expect(hsts).toContain('includeSubDomains');
    });
  });

  describe('X-DNS-Prefetch-Control', () => {
    it('should have X-DNS-Prefetch-Control header', async () => {
      const response = await request(app).get('/health');

      expect(response.headers).toHaveProperty('x-dns-prefetch-control');
    });
  });

  describe('X-Download-Options', () => {
    it('should have X-Download-Options header', async () => {
      const response = await request(app).get('/health');

      expect(response.headers).toHaveProperty('x-download-options');
    });
  });

  describe('X-Permitted-Cross-Domain-Policies', () => {
    it('should have X-Permitted-Cross-Domain-Policies header', async () => {
      const response = await request(app).get('/health');

      expect(response.headers).toHaveProperty('x-permitted-cross-domain-policies');
    });
  });

  describe('Security headers on different routes', () => {
    it('should apply security headers to API routes', async () => {
      const response = await request(app).get('/api/tmdb/trending');

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('strict-transport-security');
    });

    it('should apply security headers to health endpoint', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers).toHaveProperty('content-security-policy');
    });
  });

  describe('Combined security protection', () => {
    it('should have all critical security headers', async () => {
      const response = await request(app).get('/health');

      const criticalHeaders = [
        'x-content-type-options',
        'strict-transport-security',
        'x-frame-options',
        'content-security-policy'
      ];

      criticalHeaders.forEach(header => {
        expect(response.headers).toHaveProperty(header);
      });
    });
  });
});
