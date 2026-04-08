// jest.config.js
module.exports = {
  // Environnement de test (Node.js)
  testEnvironment: 'node',

  // Pattern pour trouver les fichiers de test
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.spec.js'
  ],

  // Dossiers à ignorer
  testPathIgnorePatterns: [
    '/node_modules/'
  ],

  // Coverage (couverture de code)
  collectCoverageFrom: [
    'services/**/*.js',
    'routes/**/*.js',
    'controllers/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**'
  ],

  // Seuils de coverage (optionnel)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Verbose pour voir les détails
  verbose: true
};
