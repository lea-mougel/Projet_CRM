# CRM Frontend

Frontend de l'application CRM construit avec Next.js (App Router), TypeScript et Tailwind CSS.

## Prérequis

- Node.js 18+
- npm
- Variables d'environnement Supabase configurées dans `.env.local`:
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Lancer le projet

```bash
npm install
npm run dev
```

Application disponible sur `http://localhost:3000`.

## Scripts utiles

```bash
npm run dev      # mode développement
npm run build    # build production + vérification TypeScript
npm run start    # lancement du build
```

## Fonctionnalités implémentées

- Authentification (signup/login/logout) via Supabase Auth
- Gestion des contacts (CRUD, recherche/filtrage)
- Gestion des entreprises
- Gestion des leads (statuts: `nouveau`, `en cours`, `converti`, `perdu`)
- Pipeline de vente avec visualisation par colonnes / tableau
- Insights pipeline avec vues adaptées au rôle
- Module admin de gestion des commerciaux

## Gestion des rôles (frontend)

### Commercial

- Accès au pipeline avec switch `Ma Pipeline` / `Pipeline Globale`
- Onglet insights sans section « performance par commercial »

### Admin

- Onglet latéral `Commerciaux`
- Liste des commerciaux en tableau avec:
	- nom/mail
	- montant en attente
	- taux de conversion
	- montant gagné
- Recherche + tri ascendant/descendant par colonnes
- Clic sur un commercial pour ouvrir `/commercial/[id]` avec sous-onglets:
	- `Contacts`
	- `Pipeline` (même visuel que côté commercial)
	- `Insights`
	- `Détails des leads`

## Pages principales

- `/login`, `/signup`
- `/contacts`, `/companies`, `/leads`
- `/pipeline`
- `/commercials` (admin)
- `/commercial/[id]` (admin)

## Structure utile

- `app/` : pages Next.js
- `components/` : composants UI métiers
- `api/contacts.api.ts` : client API frontend
