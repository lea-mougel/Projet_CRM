# CRM Backend

Backend API du CRM construit avec NestJS + TypeScript, connecté à Supabase/PostgreSQL.

## Prérequis

- Node.js 18+
- npm
- Variables d'environnement (Supabase + config API) selon votre `.env`

### Variables d'environnement (Brevo)

Ajouter dans `.env`:

```env
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=...
BREVO_SENDER_NAME=CRM
```

## Installation

```bash
npm install
```

## Lancer le backend

```bash
npm run start:dev
```

Par défaut, l'API tourne sur `http://localhost:3001` (ou port configuré).

## Scripts utiles

```bash
npm run start
npm run start:dev
npm run start:prod
npm run build
npm run test
npm run test:e2e
```

## Modules principaux

- `auth/` : rôles et garde d'accès
- `contacts/` : endpoints contacts
- `companies/` : endpoints entreprises
- `leads/` : endpoints leads
- `tasks/` : endpoints tâches
- `communications/` : envoi et historique des communications (Brevo)
- `supabase/` : service d'accès Supabase

## Sécurité et rôles

- Rôles gérés: `admin`, `commercial`, `user`
- Contrôles d'accès par rôle côté API
- Intégration avec Supabase Auth pour les sessions utilisateur

## Endpoints métiers (résumé)

- Contacts: CRUD + recherche
- Companies: `GET /companies/:id`, `POST /companies`, `PATCH /companies/:id`, `DELETE /companies/:id`
- Leads: CRUD + mise à jour des statuts de pipeline
- Tasks: `GET /tasks`, `POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id`
- Profils utilisateurs: récupération du rôle pour pilotage frontend
- Communications:
	- `GET /communications`
	- `POST /communications` (log manuel)
	- `POST /communications/send` (envoi réel Brevo + log auto)
	- `PATCH /communications/:id/status`

## Arborescence utile

- `src/main.ts` : bootstrap Nest
- `src/app.module.ts` : module racine
- `src/contacts/` : logique contacts
- `src/companies/` : logique entreprises
- `src/leads/` : logique leads
- `src/tasks/` : logique tâches
- `src/communications/` : logique communications/Brevo
- `src/auth/roles.guard.ts` : guard de rôles
