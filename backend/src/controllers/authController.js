// src/controllers/authController.js
// Contrôleur pour les routes d'authentification

const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Valide la conformité d'un mot de passe selon ANSSI 2026
 * @param {string} password - Mot de passe à valider
 * @returns {Object} { valid: boolean, message: string }
 */
function validatePassword(password) {
  if (password.length < 12) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins 12 caractères'
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/'`~;]/.test(password);

  if (!hasUpperCase) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins une majuscule'
    };
  }

  if (!hasLowerCase) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins une minuscule'
    };
  }

  if (!hasNumbers) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins un chiffre'
    };
  }

  if (!hasSpecialChar) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...)'
    };
  }

  return { valid: true };
}

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

    // Validation email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, 'Format email invalide', 400);
    }

    // Validation mot de passe renforcée ANSSI 2026
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return errorResponse(res, passwordValidation.message, 400);
    }

    const result = await authService.register({ email, username, password });

    // Régénérer le session ID (protection session fixation)
    req.session.regenerate((err) => {
      if (err) {
        console.error('Erreur régénération session:', err);
        return errorResponse(res, 'Erreur lors de l\'inscription', 500);
      }

      // Stocker dans la nouvelle session
      req.session.userId = result.user.id;
      req.session.token = result.token;

      // Sauvegarder explicitement la session
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Erreur sauvegarde session:', saveErr);
          return errorResponse(res, 'Erreur lors de l\'inscription', 500);
        }
        successResponse(res, 'Inscription réussie', result, 201);
      });
    });
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

    // Régénérer le session ID (protection session fixation)
    req.session.regenerate((err) => {
      if (err) {
        console.error('Erreur régénération session:', err);
        return errorResponse(res, 'Erreur lors de la connexion', 500);
      }

      // Stocker dans la nouvelle session
      req.session.userId = result.user.id;
      req.session.token = result.token;

      // Sauvegarder explicitement la session
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Erreur sauvegarde session:', saveErr);
          return errorResponse(res, 'Erreur lors de la connexion', 500);
        }
        successResponse(res, 'Connexion réussie', result);
      });
    });
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
