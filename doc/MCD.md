# MCD - Modèle Conceptuel de Données (Version actuelle)

## 1) Entités principales

- auth.users
  - id (UUID, PK)
  - email
  - created_at

- profiles
  - id (UUID, PK, FK -> auth.users.id)
  - email
  - role (admin | commercial | user)

- companies
  - id (UUID, PK)
  - name
  - industry
  - website
  - address
  - town
  - created_at
  - updated_at

- contacts
  - id (UUID, PK)
  - first_name
  - last_name
  - email
  - phone
  - company_id (FK -> companies.id)
  - assigned_to (FK -> profiles.id)
  - user_id (FK -> auth.users.id)
  - created_at
  - updated_at

- leads
  - id (UUID, PK)
  - title
  - contact_id (FK -> contacts.id)
  - company_id (FK -> companies.id)
  - status (nouveau | en cours | converti | perdu)
  - source
  - description
  - estimated_value
  - assigned_to (FK -> profiles.id)
  - created_at
  - updated_at

- contact_notes
  - id (UUID, PK)
  - contact_id (FK -> contacts.id)
  - author_id (FK -> profiles.id)
  - content
  - type (note | appel | email | réunion)
  - created_at
  - updated_at

## 2) Relations

- auth.users 1-1 profiles
- profiles 1-N contacts (assigned_to)
- profiles 1-N leads (assigned_to)
- companies 1-N contacts
- companies 1-N leads
- contacts 1-N leads
- contacts 1-N contact_notes
- profiles 1-N contact_notes (author)
- auth.users 1-N contacts (créateur)

## 3) Règles métier observées

- Les leads suivent un cycle à 4 statuts: nouveau, en cours, converti, perdu.
- L'affectation commerciale est portée par assigned_to sur contacts et leads.
- Les insights pipeline sont filtrés selon le rôle:
  - admin: vision globale
  - commercial: vision métier sans performance inter-commerciaux

## 4) RLS et visibilité (logique fonctionnelle)

- Admin
  - accès global aux données commerciales
  - accès au module commerciaux

- Commercial
  - accès à sa pipeline et aux vues personnelles
  - accès partiel aux vues globales selon écran

- User
  - accès restreint (hors modules commerciaux avancés)

## 5) Hors périmètre actuel (prévu)

- Dashboard analytique avancé complet (consolidation finale)

## 6) Modules implémentés en plus du coeur CRM

- tasks
  - gestion CRUD des taches liees aux contacts/leads
  - filtrage par role (admin global, commercial sur ses elements)

- communications
  - envoi manuel d'emails via backend
  - historique des communications
  - statut d'envoi (pending, sent, failed)

- automation settings
  - parametrage de l'automatisation (enabled, sujet, body, cooldown, limites)
  - modification reservee admin

## 7) Configuration technique (local et Vercel)

- Backend (.env)
  - SUPABASE_URL=https://<project-ref>.supabase.co
  - SUPABASE_SERVICE_ROLE_KEY=<server key>
  - Ne pas utiliser une cle publishable/anon dans SUPABASE_SERVICE_ROLE_KEY.

- Frontend (.env.local)
  - NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
  - NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
  - NEXT_PUBLIC_API_URL=http://localhost:3000 (local)

- Production Vercel
  - Frontend: NEXT_PUBLIC_API_URL=https://<backend>.vercel.app
  - Backend: FRONTEND_URL=https://<frontend>.vercel.app
  - Backend: SUPABASE_SERVICE_ROLE_KEY doit etre une cle serveur valide.
