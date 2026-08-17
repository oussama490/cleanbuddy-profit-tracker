# Suivi des profits Cleanbuddy

Application web mobile-first (Next.js App Router, TypeScript, Tailwind CSS, Supabase) pour suivre la performance quotidienne et calculer la rentabilité des produits, avec conversion MXN / USD / CAD via [Frankfurter](https://api.frankfurter.app).

L’interface est en arabe (RTL). Les totaux et graphiques sont affichés par défaut en dollars canadiens.

## 1. Lancer le projet

```bash
npm install
cp .env.example .env.local
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## 2. Variables d’environnement

| Variable | Rôle |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon (secours) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role, utilisée côté serveur |
| `APP_PASSWORD` | Mot de passe unique de l’application |

Si `APP_PASSWORD` est vide, la page de connexion n’est pas exigée.

## 3. Base Supabase

1. Créer un projet sur [supabase.com](https://supabase.com).
2. SQL Editor → coller et exécuter `supabase/schema.sql`.
3. Copier l’URL et les clés dans `.env.local`.

Deux tables :

- `daily_entries` — saisie quotidienne + `exchange_rate_snapshot`
- `product_calculations` — produits évalués + `exchange_rate_snapshot`

Le snapshot JSON conserve les taux **vers le CAD** au moment de la saisie (`toCad.MXN`, `toCad.USD`, `toCad.CAD`), pour que l’historique reste exact si le marché bouge.

## 4. Conversion de devises

Les taux viennent de `https://api.frankfurter.app/latest?from=CAD&to=MXN,USD` (API gratuite, sans clé). Ils sont mis en cache environ 30–60 minutes via `/api/rates`.

Chaque champ montant a un sélecteur MXN / USD / CAD et affiche l’équivalent dans les deux autres devises.

## 5. Déploiement Vercel

1. Pousser le dépôt vers GitHub.
2. Importer le projet dans Vercel (framework Next.js).
3. Ajouter les mêmes variables d’environnement.
4. Déployer.

Le mot de passe est stocké dans un cookie HTTP-only signé (HMAC), sans système de comptes.
