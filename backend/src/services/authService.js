// src/services/authService.js
// Service d'authentification (gestion users, sessions, JWT)

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../config/jwt');
const config = require('../config');

/**
 * Enregistre un nouvel utilisateur
 * @param {Object} userData - Données utilisateur
 * @returns {Promise<Object>} Utilisateur créé + token
 */
async function register({ email, username, password }) {
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new Error('Email déjà utilisé');
  }

  const existingUsername = await User.findByUsername(username);
  if (existingUsername) {
    throw new Error('Nom d\'utilisateur déjà pris');
  }

  const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);

  const user = await User.create({
    email,
    username,
    password: hashedPassword
  });

  const token = generateToken({
    id: user.id,
    email: user.email,
    username: user.username
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username
    },
    token
  };
}

/**
 * Authentifie un utilisateur
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe
 * @returns {Promise<Object>} Utilisateur + token
 */
async function login(email, password) {
  const user = await User.findByEmail(email);
  if (!user) {
    throw new Error('Email ou mot de passe incorrect');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error('Email ou mot de passe incorrect');
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    username: user.username
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username
    },
    token
  };
}

/**
 * Récupère les informations d'un utilisateur par ID
 * @param {number} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Informations utilisateur
 */
async function getUserById(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    created_at: user.created_at
  };
}

module.exports = {
  register,
  login,
  getUserById
};
