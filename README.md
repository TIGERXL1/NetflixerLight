 # NetflixLight
 
## Description

NetflixLight est une application web reproduisant les fonctionnalités essentielles d'une application de streaming comme Netflix : navigation de contenus, gestion de favoris, système de notation et lecteur vidéo intégré.

## Fonctionnalités

### Authentification
- Inscription et connexion utilisateur
- Sessions sécurisées (JWT + Express-session)
- Gestion de profil utilisateur

### Navigation
- Page d'accueil avec hero banner dynamique
- Carrousels thématiques (tendances, films, séries, genres)
- Page découverte avec filtres avancés (genre, date, note TMDB)
- Système de recherche avec debounce

### Gestion des Favoris
- Ajout/suppression de médias dans la watchlist
- Recommandations personnalisées basées sur les genres favoris
- Recommandations par défaut si aucun favori

### Système de Notation
- Notation des médias (1-5 étoiles)
- Affichage des notes dans les cartes
- Historique des notes dans le profil utilisateur
- Suppression de notes

### Lecteur Vidéo
- Lecteur vidéo personnalisé avec contrôles
- Support YouTube et fichiers locaux
- Progression, volume, plein écran
- Contrôles clavier (Espace, flèches)

### Interface
- Design inspiré de Netflix
- Mode clair/sombre
- Interface responsive (mobile, tablette, desktop)

## Stack Technique

### Backend
- **Runtime** : Node.js 18+
- **Framework** : Express.js
- **Base de données** : SQLite (better-sqlite3)
- **Authentification** : JWT + bcryptjs
- **Tests** : Jest

### Frontend
- **Langage** : JavaScript vanilla
- **Styling** : HTML5 + Tailwind CSS (via CDN)
- **Architecture** : Modules ES6

### API Externe
- **TMDB API** : Données des films et séries

## Installation

### Prérequis
- Node.js >= 18.x
- npm >= 9.x

### Configuration

1. **Cloner le repository**
```bash
git clone <repository-url>
cd Projet-NetflixLight
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
```

Éditer `.env` avec vos clés :
```env
TMDB_API_KEY=votre_clé_tmdb
JWT_SECRET=votre_secret_jwt_minimum_32_caracteres
SESSION_SECRET=votre_secret_session_minimum_32_caracteres
PORT=3000
```

4. **Initialiser la base de données**
```bash
npm run init-db
```

## Utilisation

### Développement
```bash
npm run dev
```

### Production
```bash
npm start
```

### Tests
```bash
npm test
```

L'application sera accessible sur `http://localhost:3000`

## Structure du Projet

```
Projet-NetflixLight/
├── backend/
│   ├── controllers/      # Logique métier
│   ├── middleware/       # Authentification, CORS
│   ├── models/           # Accès données SQLite
│   ├── routes/           # Routes API Express
│   └── server.js         # Point d'entrée serveur
├── frontend/
│   ├── css/              # Styles globaux
│   ├── js/               # Modules JavaScript
│   ├── index.html        # Page d'accueil
│   ├── discover.html     # Page découverte
│   ├── profile.html      # Page profil
│   ├── login.html        # Page connexion
│   └── register.html     # Page inscription
├── database/
│   └── schema.sql        # Schéma base de données
├── tests/                # Tests unitaires Jest
└── package.json          # Dépendances et scripts
```

## API Endpoints

Consulter [API.md](./API.md) pour la documentation complète de l'API.