# Documentation API - NetflixLight

## Informations Générales

**Base URL** : `http://localhost:3000/api`  
**Format** : JSON  
**Authentification** : JWT Bearer Token + Session

## Authentification

### Inscription
**POST** `/auth/register`

Crée un nouveau compte utilisateur.

**Body** :
```json
{
  "email": "user@example.com",
  "password": "motdepasse123",
  "name": "Nom Utilisateur"
}
```

**Réponse (201)** :
```json
{
  "message": "Utilisateur créé",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Nom Utilisateur"
  }
}
```

### Connexion
**POST** `/auth/login`

Authentifie un utilisateur et crée une session.

**Body** :
```json
{
  "email": "user@example.com",
  "password": "motdepasse123"
}
```

**Réponse (200)** :
```json
{
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Nom Utilisateur"
  }
}
```

### Déconnexion
**POST** `/auth/logout`

Termine la session utilisateur.

**Headers** : `Authorization: Bearer <token>`

**Réponse (200)** :
```json
{
  "message": "Déconnexion réussie"
}
```

### Vérification Session
**GET** `/auth/check`

Vérifie la validité de la session.

**Headers** : `Authorization: Bearer <token>`

**Réponse (200)** :
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Nom Utilisateur"
  }
}
```

## Utilisateur

### Récupérer Profil
**GET** `/user/profile`

Récupère les informations du profil utilisateur.

**Headers** : `Authorization: Bearer <token>`

**Réponse (200)** :
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "Nom Utilisateur",
  "created_at": "2025-04-15T10:00:00.000Z"
}
```

### Modifier Mot de Passe
**PUT** `/user/password`

Modifie le mot de passe utilisateur.

**Headers** : `Authorization: Bearer <token>`

**Body** :
```json
{
  "currentPassword": "ancien123",
  "newPassword": "nouveau456"
}
```

**Réponse (200)** :
```json
{
  "message": "Mot de passe mis à jour"
}
```

## Favoris (Watchlist)

### Récupérer Favoris
**GET** `/watchlist`

Récupère la liste des favoris de l'utilisateur.

**Headers** : `Authorization: Bearer <token>`

**Réponse (200)** :
```json
[
  {
    "id": 1,
    "user_id": 1,
    "tmdb_id": 550,
    "media_type": "movie",
    "title": "Fight Club",
    "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    "added_at": "2025-04-15T10:00:00.000Z"
  }
]
```

### Ajouter aux Favoris
**POST** `/watchlist`

Ajoute un média aux favoris.

**Headers** : `Authorization: Bearer <token>`

**Body** :
```json
{
  "tmdb_id": 550,
  "media_type": "movie",
  "title": "Fight Club",
  "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  "genre_ids": [18, 53]
}
```

**Réponse (201)** :
```json
{
  "message": "Ajouté aux favoris",
  "item": {
    "id": 1,
    "tmdb_id": 550,
    "media_type": "movie"
  }
}
```

### Retirer des Favoris
**DELETE** `/watchlist/:tmdbId/:mediaType`

Retire un média des favoris.

**Headers** : `Authorization: Bearer <token>`

**Paramètres** :
- `tmdbId` : ID TMDB du média
- `mediaType` : Type (`movie` ou `tv`)

**Réponse (200)** :
```json
{
  "message": "Retiré des favoris"
}
```

## Notations

### Récupérer Toutes les Notes
**GET** `/ratings`

Récupère toutes les notes de l'utilisateur.

**Headers** : `Authorization: Bearer <token>`

**Réponse (200)** :
```json
[
  {
    "id": 1,
    "user_id": 1,
    "tmdb_id": 550,
    "media_type": "movie",
    "rating": 5,
    "created_at": "2025-04-15T10:00:00.000Z"
  }
]
```

### Récupérer Note Spécifique
**GET** `/ratings/:tmdbId/:mediaType`

Récupère la note d'un média spécifique.

**Headers** : `Authorization: Bearer <token>`

**Paramètres** :
- `tmdbId` : ID TMDB du média
- `mediaType` : Type (`movie` ou `tv`)

**Réponse (200)** :
```json
{
  "rating": 5
}
```

**Réponse (404)** si non noté :
```json
{
  "error": "Note non trouvée"
}
```

### Ajouter/Modifier Note
**POST** `/ratings`

Crée ou met à jour la note d'un média.

**Headers** : `Authorization: Bearer <token>`

**Body** :
```json
{
  "tmdb_id": 550,
  "media_type": "movie",
  "rating": 5
}
```

**Réponse (201 ou 200)** :
```json
{
  "message": "Note enregistrée",
  "rating": {
    "id": 1,
    "tmdb_id": 550,
    "media_type": "movie",
    "rating": 5
  }
}
```

### Supprimer Note
**DELETE** `/ratings/:tmdbId/:mediaType`

Supprime la note d'un média.

**Headers** : `Authorization: Bearer <token>`

**Paramètres** :
- `tmdbId` : ID TMDB du média
- `mediaType` : Type (`movie` ou `tv`)

**Réponse (200)** :
```json
{
  "message": "Note supprimée"
}
```

## TMDB Proxy

### Feed Principal
**GET** `/tmdb/home-feed`

Récupère le feed principal de la page d'accueil.

**Réponse (200)** :
```json
{
  "movieGenresResult": { "status": "fulfilled", "value": {...} },
  "tvGenresResult": { "status": "fulfilled", "value": {...} },
  "trendingResult": { "status": "fulfilled", "value": {...} },
  "popularMoviesResult": { "status": "fulfilled", "value": {...} },
  "topMoviesResult": { "status": "fulfilled", "value": {...} },
  "seriesResult": { "status": "fulfilled", "value": {...} },
  "actionResult": { "status": "fulfilled", "value": {...} },
  "comedyResult": { "status": "fulfilled", "value": {...} },
  "horrorResult": { "status": "fulfilled", "value": {...} }
}
```

### Détails Média
**GET** `/tmdb/details/:type/:id`

Récupère les détails d'un média.

**Paramètres** :
- `type` : Type (`movie` ou `tv`)
- `id` : ID TMDB

**Réponse (200)** :
```json
{
  "id": 550,
  "title": "Fight Club",
  "overview": "A ticking-time-bomb insomniac...",
  "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  "backdrop_path": "/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg",
  "vote_average": 8.4,
  "release_date": "1999-10-15",
  "genres": [{"id": 18, "name": "Drama"}],
  "videos": {...}
}
```

### Recherche
**GET** `/tmdb/search?query=<terme>`

Recherche des médias.

**Query Params** :
- `query` : Terme de recherche (min. 2 caractères)

**Réponse (200)** :
```json
{
  "page": 1,
  "results": [
    {
      "id": 550,
      "title": "Fight Club",
      "media_type": "movie",
      "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"
    }
  ],
  "total_results": 42
}
```

### Découverte
**GET** `/tmdb/discover/:type`

Découvre des médias avec filtres.

**Paramètres** :
- `type` : Type (`movie` ou `tv`)

**Query Params** :
- `query` : Recherche textuelle (optionnel)
- `with_genres` : IDs genres séparés par virgules
- `sort_by` : Tri (popularity.desc, vote_average.desc, etc.)
- `release_date.gte` : Date minimum (YYYY-MM-DD)
- `release_date.lte` : Date maximum (YYYY-MM-DD)
- `vote_average.gte` : Note TMDB minimum
- `page` : Numéro de page

**Réponse (200)** :
```json
{
  "page": 1,
  "results": [...],
  "total_pages": 500,
  "total_results": 10000
}
```

### Recommandations par Genres
**GET** `/tmdb/recommendations-by-genres`

Récupère des recommandations basées sur des genres.

**Query Params** :
- `genre_ids` : IDs genres séparés par virgules
- `limit` : Nombre max de résultats (défaut: 12)

**Réponse (200)** :
```json
[
  {
    "id": 550,
    "title": "Fight Club",
    "media_type": "movie",
    "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"
  }
]
```

## Codes d'Erreur

| Code | Description |
|------|-------------|
| 400 | Requête invalide (données manquantes/incorrectes) |
| 401 | Non authentifié (token manquant/invalide) |
| 403 | Non autorisé |
| 404 | Ressource non trouvée |
| 409 | Conflit (email déjà utilisé, etc.) |
| 500 | Erreur serveur interne |

**Format d'erreur** :
```json
{
  "error": "Message d'erreur descriptif"
}
```

## Sécurité

- **Authentification** : JWT avec expiration 24h + sessions Express
- **Mots de passe** : Hashage bcrypt (10 rounds)
- **CORS** : Configuré pour autoriser uniquement l'origine frontend
- **Rate limiting** : Recommandé en production
- **Variables sensibles** : Stockées dans `.env` (jamais versionnées)

## Notes d'Implémentation

- Toutes les routes (sauf `/auth/register` et `/auth/login`) nécessitent une authentification
- Les IDs TMDB sont des entiers
- Les types de média acceptés : `movie` ou `tv`
- Les notes sont des entiers entre 1 et 5
- Le token JWT doit être envoyé dans le header `Authorization: Bearer <token>`
- Les sessions expirent après 24h d'inactivité

---
