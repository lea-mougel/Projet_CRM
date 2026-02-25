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

- tasks
- emailing automatisé
- dashboard analytique complet
