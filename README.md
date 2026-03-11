# Totem — Plateforme de gestion alternance

Outil centralisé pour une école de commerce : suivi candidats ↔ entreprises, matching, e-mails automatisés.

## Structure du projet (monorepo)

- **apps/api** — API NestJS (auth, candidats, entreprises, offres, matchs, entretiens, e-mails, dashboard)
- **apps/web** — Frontend Next.js 14 (App Router) staff-only
- **packages/database** — Prisma + schéma PostgreSQL
- **packages/shared** — Types et constantes partagés

## Prérequis

- Node.js 20+
- npm 10+ (ou pnpm 9+)
- PostgreSQL

## Installation

**Toujours exécuter les commandes depuis la racine du projet**, pas depuis `packages/database` ou `apps/api`.

```bash
# 1. À la racine
npm install

# 2. Fichier d'environnement
cp .env.example .env
# Éditer .env : DATABASE_URL (PostgreSQL) et JWT_SECRET (min. 32 caractères)

# 3. Générer le client Prisma
npm run db:generate

# 4. Démarrer PostgreSQL, puis appliquer le schéma
npm run db:push

# 5. (Optionnel) Créer l'admin + templates e-mail
npm run db:seed
```

**Option A — Avec Docker (le plus simple)**  
À la racine du projet :
```bash
docker compose up -d
npm run db:push
npm run db:seed
```
Le `.env` est déjà configuré pour ce cas (utilisateur `totem`, mot de passe `totem`).

**Option B — PostgreSQL installé sur la machine**  
Créer la base `totem`, adapter `DATABASE_URL` dans `.env`, puis `npm run db:push` et `npm run db:seed`.

## Lancer l’application

```bash
# Terminal 1 : API (port 4000)
npm run dev:api

# Terminal 2 : Web (port 3000)
npm run dev:web
```

**À lancer depuis la racine** (sinon les scripts `dev:api` et `dev:web` ne sont pas trouvés). Ou en un seul terminal (Turbo) :

```bash
npm run dev
```

- **Frontend** : http://localhost:3003  
- **API** : http://localhost:4000/api  
- **Swagger** : http://localhost:4000/api/docs  

## Compte de test

Après le seed :

- **Email** : admin@totem.fr  
- **Mot de passe** : admin123  

## Variables d’environnement

- **Racine / API** : `.env` (voir `.env.example`)
  - `DATABASE_URL` — PostgreSQL
  - `JWT_SECRET` — Secret JWT (min. 32 caractères)
  - `API_PORT` — Port de l’API (défaut 4000)
  - `SMTP_*` — Envoi d’e-mails (optionnel)
- **Web** : `.env.local` pour override
  - `NEXT_PUBLIC_API_URL` — URL de l’API (défaut http://localhost:4000/api)

## Documentation produit

- **docs/SPECIFICATION_PRODUIT.md** — Vision, personas, fonctionnalités, matching, e-mails, roadmap
- **docs/UX_ANIMATIONS_DESIGN.md** — Principes UX, composants, animations
- **docs/PRODUCTION_RUNBOOK.md** — Procédure de déploiement/rollback
- **docs/GO_LIVE_CHECKLIST.md** — Checklist de mise en production

## Rôles

| Rôle        | Accès principal |
|------------|------------------|
| ADMIN      | Dashboard, candidats, entreprises, offres, utilisateurs |
| COMMERCIAL | Dashboard, entreprises, offres (filtrés à son portefeuille) |
| ADMISSION  | Dashboard, candidats (filtrés à son portefeuille) |

## Commandes utiles

```bash
npm run build       # Build tous les packages
npm run typecheck   # Vérification TypeScript
npm run ci          # Lint + typecheck + build
npm run test:smoke  # Smoke tests API/Web (serveurs démarrés)
npm run db:studio   # Ouvrir Prisma Studio (packages/database)
npm run db:migrate  # Créer une migration (packages/database)
```
