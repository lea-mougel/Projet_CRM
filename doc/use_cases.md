# Use Cases - CRM (Version actuelle)

## Acteurs

- Admin
- Commercial
- User

---

## Cas d'usage implémentés

### 1) Authentification

- UC-001 Se connecter (tous)
- UC-002 S'inscrire (visiteur)
- UC-003 Se déconnecter (tous)
- UC-004 Résoudre le rôle utilisateur depuis le profil (app)

### 2) Contacts

- UC-005 Consulter la liste de contacts
- UC-006 Rechercher/filtrer les contacts
- UC-007 Créer un contact
- UC-008 Modifier un contact
- UC-009 Supprimer un contact (admin)
- UC-010 Consulter l'historique d'interactions
- UC-011 Ajouter une note d'interaction

### 3) Entreprises

- UC-012 Consulter la liste des entreprises
- UC-013 Rechercher une entreprise
- UC-014 Créer une entreprise
- UC-015 Modifier une entreprise
- UC-016 Lier contacts et entreprises

### 4) Leads

- UC-017 Consulter la liste des leads
- UC-018 Créer un lead
- UC-019 Modifier un lead
- UC-020 Supprimer un lead (admin)
- UC-021 Changer le statut d'un lead

### 5) Pipeline & Insights

- UC-022 Consulter la page pipeline
- UC-023 Basculer pipeline colonnes/tableau
- UC-024 Consulter les insights pipeline
- UC-025 Filtrer l'affichage selon le rôle
  - admin: insights globaux + performance par commercial
  - commercial: insights sans performance inter-commerciaux
  - pipeline: admin = globale uniquement, commercial = personnelle uniquement

### 6) Module commerciaux (admin)

- UC-026 Accéder à la page Commerciaux via la sidebar
- UC-027 Rechercher un commercial par nom/mail
- UC-028 Trier la liste des commerciaux (asc/desc) par:
  - nom/mail
  - montant en attente
  - % conversion
  - montant gagné
- UC-029 Ouvrir le détail d'un commercial
- UC-030 Consulter les sous-onglets du commercial:
  - Contacts
  - Pipeline (même visuel que côté commercial)
  - Insights
  - Détails des leads

### 7) Tâches

- UC-031 Consulter la liste des tâches
- UC-032 Créer une tâche liée à un contact ou un lead
- UC-033 Modifier une tâche (titre, date, statut)
- UC-034 Supprimer une tâche
- UC-035 Marquer une tâche comme terminée/non terminée

### 8) Communications et emailing

- UC-036 Consulter l'historique des communications
- UC-037 Envoyer un email manuel
- UC-038 Filtrer les communications par statut
- UC-039 Configurer les règles d'automatisation (admin)
- UC-040 Activer/désactiver l'automatisation (admin)

---

## Permissions synthétiques

| Cas | Admin | Commercial | User |
|---|---|---|---|
| Authentification | Oui | Oui | Oui |
| Contacts | Oui | Oui | Limité |
| Entreprises | Oui | Oui | Limité |
| Leads | Oui | Oui | Non |
| Tâches | Oui | Oui | Non |
| Communications | Oui | Oui | Non |
| Paramètres automation | Oui | Non | Non |
| Pipeline | Oui (global uniquement) | Oui (personnel uniquement) | Non |
| Commerciaux (sidebar + détail) | Oui | Non | Non |

---

## Backlog non implémenté

- Dashboard analytique avancé complet (feature 8)
