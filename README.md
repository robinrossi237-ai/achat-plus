# ACHAT+ — Lancer l'application en local

Monorepo pnpm : API + boutique en ligne + espace admin.

| Élément   | Techno      | Port local |
| --------- | ----------- | ---------- |
| Boutique  | React + Vite | 3002       |
| Admin     | React + Vite | 3001       |
| API       | Express (pg) | 4000       |
| Base      | PostgreSQL  | Neon (cloud) |

## 1. Prérequis

- **Node.js ≥ 20** (`node -v`)
- **pnpm ≥ 10** (`npm i -g pnpm`)
- Un accès à la base **Neon** (variable `DATABASE_URL`)
- Un secret admin (`ADMIN_SECRET`)

## 2. Installer les dépendances

Depuis la racine `D:\PROJECTS\ACHAT +` :

```powershell
pnpm install
```

## 3. Configurer le serveur

Créer le fichier `server\.env` (il existe déjà si vous avez un accès prod) :

```
DATABASE_URL=postgresql://utilisateur:motdepasse@host/debutdebase?sslmode=verify-full
ADMIN_SECRET=une-tres-longue-chaine-secrete
PORT=4000
```

> `DATABASE_URL` pointe vers la base Neon. La base locale est **la même** que celle de production.

## 4. Lancer l'API

Dans un premier terminal, depuis la racine :

```powershell
cd server
npm run dev
```

Ne pas fermer ce terminal : la boutique et l'admin en dépendent.

- Réponse attendue : `ACHAT+ API running on http://localhost:4000` puis `Database ready`.
- L'API réessaie la connexion si la base est injoignable, elle reste à l'écoute.

Vérification rapide : http://localhost:4000/api/settings

## 5. Lancer les sites

Dans **deux autres terminaux** :

**Boutique (port 3002) :**

```powershell
cd Achat_Plus_Site_public\achat-plus
npm run dev
```

**Admin (port 3001) :**

```powershell
cd achat-plus-admin
npm run dev
```

> Les deux projets redirigent `/api` vers `http://localhost:4000` (proxy Vite). Aucune configuration supplémentaire n'est nécessaire.

## 6. Accéder aux sites

- Boutique : http://localhost:3002
- Admin : http://localhost:3001
- API : http://localhost:4000 (ex. http://localhost:4000/api/products)

## Liens utiles

- Production : https://achat-plus.onrender.com
- Dépôt : `origin` = https://github.com/robinrossi237-ai/achat-plus (branche `main`)

## Notes

- `sslmode=verify-full` évite l'avertissement SSL.
- Logs serveur (`server/src/logger.js`) : en dev tout s'affiche ; avec `NODE_ENV=production` (cas Render) seules les erreurs restent. Surcharge possible via `LOG_LEVEL=debug|info|warn|error|silent`.
- Les images des produits sont des URLs distantes (Pexels), aucune image locale n'est stockée.
- Le formulaire admin gère les articles ; les scripts `server/scripts/import-*.mjs` permettent des imports en masse idempotents.