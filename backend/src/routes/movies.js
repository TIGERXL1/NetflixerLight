// src/routes/movies.js
// Routes pour l'API TMDB

const express = require('express');
const router = express.Router();
const moviesController = require('../controllers/moviesController');

// Routes publiques (accès TMDB sans auth)
router.get('/trending', moviesController.getTrending);
router.get('/movies/popular', moviesController.getPopularMovies);
router.get('/tv/popular', moviesController.getPopularTVShows);
router.get('/top-rated', moviesController.getTopRated);
router.get('/genre', moviesController.getByGenre);
router.get('/search', moviesController.search);
router.get('/:mediaType/:id', moviesController.getDetails);
router.get('/genres', moviesController.getGenres);

module.exports = router;
