// src/routes/auth.js
// Routes d'authentification

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Routes publiques avec rate limiting strict
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);

// Routes protégées
router.post('/logout', requireAuth, authController.logout);
router.get('/profile', requireAuth, authController.getProfile);

module.exports = router;
