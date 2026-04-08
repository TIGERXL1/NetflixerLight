// src/routes/auth.js
// Routes d'authentification

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);

// Routes protégées
router.post('/logout', requireAuth, authController.logout);
router.get('/profile', requireAuth, authController.getProfile);

module.exports = router;
