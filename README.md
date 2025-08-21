# Mini Stack Overflow - Guide Explicatif

## Vue d'ensemble
Mini Stack Overflow est une plateforme où les développeurs peuvent poser des questions et obtenir des réponses, similaire au vrai Stack Overflow. Le projet est divisé en deux parties principales : le frontend (ce que l'utilisateur voit) et le backend (ce qui gère les données en arrière-plan).

## Structure du Projet
```
MiniStackOverFlow/
├── client/     (Frontend - React)
└── server/     (Backend - Node.js)
```

## Frontend (client) - L'interface utilisateur
Le frontend est construit avec React, qui est comme un jeu de Lego pour construire des sites web. Chaque "pièce" est appelée un composant.

### Technologies utilisées dans le Frontend
- **React** : Une bibliothèque pour construire des interfaces utilisateur
- **TypeScript** : C'est comme du JavaScript mais avec des règles plus strictes pour éviter les erreurs
- **Tailwind CSS** : Un outil qui nous permet de styliser notre site facilement, comme choisir les couleurs, les tailles, etc.
- **React Router** : Permet de naviguer entre différentes pages sans recharger le site

### Structure du Frontend
```
client/
├── src/
│   ├── components/    (Pièces réutilisables de l'interface)
│   │   ├── Navbar.tsx       (Barre de navigation en haut)
│   │   ├── Sidebar.tsx      (Menu latéral)
│   │   └── QuestionCard.tsx (Affichage d'une question)
│   │
│   ├── pages/         (Les différentes pages du site)
│   │   ├── Login.tsx        (Page de connexion)
│   │   └── Register.tsx     (Page d'inscription)
│   │
│   └── App.tsx        (Point d'entrée principal de l'application)
```

### Fonctionnalités Frontend
1. **Navigation** :
   - Barre de navigation en haut avec recherche et boutons de connexion
   - Menu latéral pour accéder aux différentes sections

2. **Authentification** :
   - Connexion avec email/mot de passe
   - Connexion avec GitHub ou Google
   - Inscription de nouveaux utilisateurs

3. **Questions** :
   - Liste des questions avec système de vote
   - Tags pour catégoriser les questions
   - Fonction de recherche
   - Filtrage par popularité, date, etc.

## Backend (server) - Le cerveau de l'application
Le backend est comme le serveur dans un restaurant : il prend les commandes (requêtes) et renvoie ce qui est demandé (réponses).

### Technologies utilisées dans le Backend
- **Node.js** : Permet d'exécuter JavaScript côté serveur
- **Express** : Simplifie la création d'une API
- **PostgreSQL** : La base de données qui stocke toutes les informations
- **Prisma** : Un outil qui simplifie la communication avec la base de données
- **JWT** : Pour gérer la sécurité et l'authentification

### Structure du Backend
```
server/
├── src/
│   ├── controllers/   (Gère la logique des fonctionnalités)
│   │   └── auth.ts          (Gère connexion/inscription)
│   │
│   ├── middleware/    (Vérifie les requêtes)
│   │   └── auth.ts          (Vérifie si l'utilisateur est connecté)
│   │
│   └── routes/        (Définit les chemins de l'API)
│       └── auth.ts          (Chemins pour connexion/inscription)
│
└── prisma/
    └── schema.prisma  (Structure de la base de données)
```

### Base de Données
La base de données stocke :
- Les utilisateurs et leurs informations
- Les questions
- Les réponses
- Les votes
- Les tags
- Les commentaires

### Fonctionnement Simple
1. Un utilisateur clique sur "Se connecter"
2. Le frontend envoie les informations au backend
3. Le backend vérifie les informations dans la base de données
4. Si tout est correct, le backend renvoie un "ticket d'accès" (token JWT)
5. Le frontend stocke ce ticket et l'utilise pour les futures requêtes

## Déploiement
- Le frontend sera hébergé sur Vercel
- Le backend sera aussi sur Vercel
- La base de données PostgreSQL sera hébergée sur Vercel

## Comment lancer le projet en local
1. Frontend :
   ```bash
   cd client
   npm install
   npm run dev
   ```

2. Backend :
   ```bash
   cd server
   npm install
   npm run dev
   ```

## Points forts du projet
- Interface moderne et responsive
- Architecture propre et maintenable
- Sécurité intégrée
- Performance optimisée
- Facilement déployable
- Code TypeScript pour éviter les erreurs
