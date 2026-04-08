// src/controllers/authController.js
// Contrôleur pour les routes d'authentification

const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Inscription d'un nouvel utilisateur
 */
async function register(req, res) {
  try {
    const { email, username, password } = req.body;

    // Validation basique
    if (!email || !username || !password) {
      return errorResponse(res, 'Tous les champs sont requis', 400);
    }

    if (password.length < 6) {
      return errorResponse(res, 'Le mot de passe doit contenir au moins 6 caractères', 400);
    }

    const result = await authService.register({ email, username, password });

    // Stocker le token dans une session cookie (optionnel)
    req.session.userId = result.user.id;
    req.session.token = result.token;

    return successResponse(res, 'Inscription réussie', result, 201);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
}

/**
 * Connexion d'un utilisateur
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return errorResponse(res, 'Email et mot de passe requis', 400);
    }

    const result = await authService.login(email, password);

    // Stocker dans la session
    req.session.userId = result.user.id;
    req.session.token = result.token;

    return successResponse(res, 'Connexion réussie', result);
  } catch (error) {
    return errorResponse(res, error.message, 401);
  }
}

/**
 * Déconnexion
 */
async function logout(req, res) {
  try {
    // Détruire la session
    req.session.destroy((err) => {
      if (err) {
        return errorResponse(res, 'Erreur lors de la déconnexion', 500);
      }

      res.clearCookie('netflixlight_session');
      return successResponse(res, 'Déconnexion réussie');
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Récupère le profil de l'utilisateur connecté
 */
async function getProfile(req, res) {
  try {
    const user = await authService.getUserById(req.user.id);
    return successResponse(res, 'Profil récupéré', { user });
  } catch (error) {
    return errorResponse(res, error.message, 404);
  }
}

module.exports = {
  register,
  login,
  logout,
  getProfile
};
