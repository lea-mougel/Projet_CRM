# Projet CRM - Vue d'ensemble

Application CRM fullstack (frontend Next.js + backend NestJS) avec authentification Supabase, gestion des rôles et pipeline commercial.

## Stack technique

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: NestJS, TypeScript
- Auth & base de données: Supabase (PostgreSQL)

## Structure du repo

- `frontend/` : interface web CRM
- `backend/` : API NestJS
- `doc/` : documentation fonctionnelle et modélisation (`MCD`, `ER diagram`, cas d'usage)

## Lancement rapide

### 1) Backend

```bash
cd backend
npm install
npm run start:dev
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

## Fonctionnalités clés implémentées

- Authentification et gestion des rôles (`admin`, `commercial`, `user`)
- Gestion des contacts, entreprises et leads
- Pipeline de vente avec visualisation colonnes/tableau
- Insights pipeline avec affichage selon rôle
- Gestion des tâches
- Communications par email via Brevo (envoi + historique + automation)
- Module admin pour pilotage des commerciaux

## Comportement par rôle

### Commercial

- Accès à son pipeline avec switch `Ma Pipeline` / `Pipeline Globale`
- Insights sans section « Performance par commercial »

### Admin

- Barre latérale avec entrée `Commerciaux`
- Onglet `Leads` masqué dans la sidebar
- Page `/commercials` avec tableau triable/filtrable:
  - nom/mail
  - montant en attente
  - % conversion
  - montant gagné
- Détail d'un commercial `/commercial/[id]` avec sous-onglets:
  - `Contacts`
  - `Pipeline` (identique à la vue commercial)
  - `Insights`
  - `Détails des leads`

## Documentation détaillée

- Frontend: `frontend/README.md`
- Backend: `backend/README.md`
- Modélisation / use cases: `doc/`
