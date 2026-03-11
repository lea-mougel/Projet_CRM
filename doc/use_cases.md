# Use Cases - CRM (etat reel du projet)

## Acteurs

- Admin
- Commercial
- User

---

## Cas d'usage implementes

### 1) Authentification et session

- UC-001 Se connecter (Supabase Auth)
- UC-002 S'inscrire (visiteur)
- UC-003 Se deconnecter
- UC-004 Resoudre le role utilisateur depuis `profiles` (frontend + backend)

### 2) Accueil / Dashboard

- UC-005 Acceder au tableau de bord apres authentification
- UC-006 Afficher un ecran d'acces restreint pour le role `user`
- UC-007 Voir des KPI/analytics (leads, pipeline, communications, taches)
- UC-008 Filtrer certaines analyses par periode (7j/30j/mois)
- UC-009 (Admin) Ouvrir la console admin depuis l'accueil
- UC-010 (Admin) Modifier le role d'un membre (rotation user/commercial/admin)

### 3) Contacts

- UC-011 Consulter les contacts
- UC-012 Basculer entre "Mes contacts" et "Tous les contacts" (selon role/contexte)
- UC-013 Rechercher et filtrer les contacts (texte, commercial, entreprise)
- UC-014 Creer un contact
- UC-015 Modifier un contact
- UC-016 Supprimer un contact
- UC-017 Consulter l'historique (notes/interactions) d'un contact
- UC-018 Ajouter une note d'interaction (note, appel, email, reunion)

### 4) Entreprises

- UC-019 Consulter la liste des entreprises
- UC-020 Rechercher une entreprise
- UC-021 Creer une entreprise
- UC-022 Modifier une entreprise
- UC-023 Supprimer une entreprise
- UC-024 Ouvrir la fiche entreprise (infos + contacts + leads)
- UC-025 Associer un contact existant a une entreprise
- UC-026 Creer un nouveau contact depuis la fiche entreprise

### 5) Leads

- UC-027 Consulter la liste des leads
- UC-028 Ouvrir le detail d'un lead
- UC-029 Creer un lead
- UC-030 Modifier un lead
- UC-031 Supprimer un lead
- UC-032 Changer le statut d'un lead sur les etapes pipeline

### 6) Pipeline et insights

- UC-033 Consulter la page pipeline
- UC-034 Basculer l'affichage pipeline (Colonnes/Tableau)
- UC-035 Consulter les insights pipeline
- UC-036 Filtrer l'affichage selon le role:
  - admin: pipeline global + insights globaux
  - commercial: pipeline personnel (leads assignes) + insights personnels

### 7) Module Commerciaux (admin)

- UC-037 Acceder a la page Commerciaux via la sidebar (admin)
- UC-038 Rechercher un commercial (email)
- UC-039 Trier la liste des commerciaux (asc/desc) par:
  - email
  - montant en attente
  - % conversion
  - montant gagne
- UC-040 Ouvrir le detail d'un commercial
- UC-041 Consulter les sous-onglets du commercial:
  - Contacts
  - Pipeline
  - Insights
  - Details des leads

### 8) Taches

- UC-042 Consulter la liste des taches
- UC-043 Filtrer les taches (toutes / a faire / terminees)
- UC-044 Creer une tache liee a un contact ou un lead
- UC-045 Modifier une tache (titre, date, lien, statut)
- UC-046 Supprimer une tache
- UC-047 Marquer une tache comme terminee/non terminee

### 9) Communications et emailing

- UC-048 Consulter l'historique des communications
- UC-049 Filtrer les communications par statut
- UC-050 Envoyer un email manuel (contact/lead/commercial/email libre)
- UC-051 Historiser le resultat d'envoi (pending/sent/failed)
- UC-052 (Admin) Consulter les parametres d'automatisation
- UC-053 (Admin) Activer/desactiver l'automatisation
- UC-054 (Admin) Configurer les regles d'auto-envoi (sujet, corps, cooldown, limite/jour, cible)

---

## Permissions synthetiques (etat actuel)

| Cas | Admin | Commercial | User |
|---|---|---|---|
| Authentification | Oui | Oui | Oui |
| Accueil / Dashboard | Oui | Oui | Oui (ecran restreint) |
| Gestion roles utilisateurs | Oui | Non | Non |
| Contacts | Oui | Oui | Non |
| Entreprises | Oui | Oui | Non |
| Leads | Oui | Oui | Non |
| Taches | Oui | Oui | Non |
| Communications | Oui | Oui | Non |
| Parametres automation | Oui | Non | Non |
| Pipeline | Oui (global) | Oui (personnel) | Non |
| Commerciaux (liste + detail) | Oui | Non | Non |

---

## Notes d'alignement technique

- Les restrictions de role sont appliquees principalement au niveau frontend (redirections et ecrans d'acces).
- Cote backend, certaines restrictions sont appliquees par filtrage (ex: donnees commerciales personnelles) et/ou verifications ponctuelles (ex: automation admin).
