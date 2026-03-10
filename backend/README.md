# CRM Backend

Backend API du CRM construit avec NestJS + TypeScript, connecté à Supabase/PostgreSQL.

## Prérequis

- Node.js 18+
- npm
- Variables d'environnement (Supabase + config API) selon votre `.env`

### Variables d'environnement (Feature 7 - Brevo)

Ajouter dans `.env`:

```env
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=...
BREVO_SENDER_NAME=CRM
```

### SQL à exécuter (Feature 7)

- Historique des communications: `backend/sql/feature7_step1_communications.sql`
- Toggle admin des auto-envois: `backend/sql/feature7_step3_automation_settings.sql`

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
- `leads/` : endpoints leads
- `supabase/` : service d'accès Supabase

## Sécurité et rôles

- Rôles gérés: `admin`, `commercial`, `user`
- Contrôles d'accès par rôle côté API
- Intégration avec Supabase Auth pour les sessions utilisateur

## Endpoints métiers (résumé)

- Contacts: CRUD + recherche
- Leads: CRUD + mise à jour des statuts de pipeline
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
- `src/leads/` : logique leads
- `src/auth/roles.guard.ts` : guard de rôles
