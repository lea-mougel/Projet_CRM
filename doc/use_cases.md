# Use Cases - CRM PRO

## Acteurs

1. **Admin** - Gestionnaire du système, accès complet
2. **Commercial** - Agent commercial, gestion de sa portefeuille de clients
3. **User** - Utilisateur basique avec accès limité

---

## Use Cases par Acteur

### 1️⃣ AUTHENTIFICATION & GESTION D'ACCÈS

#### UC-001 : Se connecter
- **Acteur** : Tous les utilisateurs
- **Précondition** : L'utilisateur a creé un compte
- **Flux** :
  1. Saisir email et mot de passe
  2. Système valide les identifiants via Supabase Auth
  3. Redirection vers page d'accueil selon le rôle
- **Postcondition** : Utilisateur connecté, session active

#### UC-002 : S'inscrire
- **Acteur** : Visiteur
- **Flux** :
  1. Compléter formulaire (email, mot de passe)
  2. Créer compte Supabase Auth
  3. Profil créé avec rôle par défaut "user"
- **Postcondition** : Nouveau compte actif

#### UC-003 : Se déconnecter
- **Acteur** : Tous les utilisateurs connectés
- **Flux** :
  1. Cliquer sur bouton "Déconnexion" (🚪)
  2. Session supprimée
  3. Redirection vers /login
- **Postcondition** : Utilisateur déconnecté

#### UC-004 : Gérer les rôles (Admin uniquement)
- **Acteur** : Admin
- **Flux** :
  1. Accéder à la gestion des profils
  2. Promouvoir/rétrograder un utilisateur (admin/commercial/user)
  3. Enregistrer les modifications
- **Postcondition** : Rôles mis à jour

---

### 2️⃣ GESTION DES CONTACTS

#### UC-005 : Consulter la liste des contacts
- **Acteur** : Admin, Commercial
- **Flux** :
  1. Accéder à page "Contacts" (👤)
  2. Admin voit TOUS les contacts
  3. Commercial voit : ses contacts assignés + contacts non assignés
  4. Résultats affichés dans un tableau trié par nom
- **Postcondition** : Liste affichée

#### UC-006 : Chercher un contact
- **Acteur** : Admin, Commercial
- **Précondition** : Sur la page des contacts
- **Flux** :
  1. Saisir recherche (nom, email, téléphone)
  2. Filtrage en temps réel
  3. Affichage des résultats correspondants
- **Postcondition** : Liste filtrée affichée

#### UC-007 : Créer un nouveau contact
- **Acteur** : Admin, Commercial
- **Flux** :
  1. Cliquer sur "Créer un contact"
  2. Remplir : prénom, nom, email, téléphone, entreprise
  3. Valider le formulaire
  4. Contact enregistré en base de données
- **Postcondition** : Nouveau contact visible en liste

#### UC-008 : Consulter les détails d'un contact
- **Acteur** : Admin, Commercial
- **Flux** :
  1. Cliquer sur un contact de la liste
  2. Modale affichant :
     - **Tab Infos** : Prénom, nom, email, téléphone, entreprise, commercial assigné
     - **Tab Historique** : Notes d'interaction
  3. Possibilité de modifier les informations
- **Postcondition** : Détails affichés

#### UC-009 : Modifier un contact
- **Acteur** : Admin, Commercial (sa propre assignation)
- **Flux** :
  1. Consulter détails du contact
  2. Modifier les champs (prénom, nom, email, etc.)
  3. Enregistrer
- **Postcondition** : Contact mis à jour

#### UC-010 : Supprimer un contact
- **Acteur** : Admin
- **Flux** :
  1. Consulter détails du contact
  2. Cliquer sur "Supprimer"
  3. Confirmation de suppression
  4.Contact supprimé → leads et notes liés restent
- **Postcondition** : Contact supprimé de la liste

#### UC-011 : Ajouter une note au contact
- **Acteur** : Admin, Commercial
- **Précondition** : Modale de contact ouverte, tab "Historique"
- **Flux** :
  1. Sélectionner type de note (📝 Note, 📞 Appel, 📧 Email, 🤝 Réunion)
  2. Saisir contenu
  3. Cliquer "Ajouter"
  4. Note enregistrée avec timestamp et auteur
- **Postcondition** : Note visible dans l'historique

#### UC-012 : Consulter l'historique des interactions
- **Acteur** : Admin, Commercial
- **Précondition** : Modale de contact ouverte, tab "Historique"
- **Flux** :
  1. Affichage chronologique inversé (dernière note en haut)
  2. Pour chaque note : type (emoji), contenu, date/heure, auteur
- **Postcondition** : Historique visible

---

### 3️⃣ GESTION DES SOCIÉTÉS

#### UC-013 : Consulter les sociétés
- **Acteur** : Admin, Commercial
- **Flux** :
  1. Accéder page "Sociétés" (🏢)
  2. Liste des sociétés avec : nom, secteur, site web, ville
- **Postcondition** : Liste affichée

#### UC-014 : Rechercher une société
- **Acteur** : Admin, Commercial
- **Flux** :
  1. Saisir recherche (nom, secteur, ville)
  2. Affichage des résultats filtrés
- **Postcondition** : Résultats affichés

#### UC-015 : Créer une nouvelle société
- **Acteur** : Admin, Commercial
- **Flux** :
  1. Cliquer "Nouvelle Société"
  2. Remplir : nom (obligatoire), secteur, site web, adresse, ville
  3. Enregistrer
- **Postcondition** : Nouvelle société visible

#### UC-016 : Consulter les détails d'une société
- **Acteur** : Admin, Commercial
- **Flux** :
  1. Cliquer sur une société
  2. Modale affichant :
     - Infos société
     - Liste des contacts associés
- **Postcondition** : Détails affichés

#### UC-017 : Associer un contact à une société
- **Acteur** : Admin, Commercial
- **Flux** :
  1. En créant/modifiant un contact
  2. Sélectionner la société dans la liste
  3. Enregistrer
- **Postcondition** : Contact lié à la société

---

### 4️⃣ GESTION DES LEADS

#### UC-018 : Consulter la pipeline
- **Acteur** : Admin, Commercial
- **Flux** :
  1. Accéder page "Leads" (📊)
  2. Affichage Kanban avec 4 colonnes :
     - 🔵 Nouveau (valeur : 0)
     - 🟡 En Cours (valeur : ?? €)
     - 🟢 Gagné (valeur : ?? €)
     - 🔴 Perdu (valeur : 0)
  3. Value totale de la pipeline affichée
- **Postcondition** : Pipeline visible

#### UC-019 : Filtrer les leads par statut
- **Acteur** : Admin, Commercial
- **Précondition** : Sur la page Leads
- **Flux** :
  1. Cliquer sur un bouton de filtre (Nouveau / En Cours / Gagné / Perdu)
  2. Afficher uniquement les leads du statut sélectionné
- **Postcondition** : Liste filtrée

#### UC-020 : Consulter les détails d'un lead
- **Acteur** : Admin, Commercial
- **Flux** :
  1. Cliquer sur une carte lead
  2. Modale affichant : titre, valeur estimée, statut, source, contact, description, entreprise
  3. Possibilité de modifier
- **Postcondition** : Détails affichés

#### UC-021 : Créer un nouveau lead
- **Acteur** : Admin, Commercial
- **Flux** :
  1. Sur page Leads, cliquer "+ Nouveau Lead"
  2. Formulaire avec :
     - Titre (obligatoire)
     - Entreprise (optionnel)
     - Contact (optionnel)
     - Valeur estimée
     - Source (web, appel, email, etc.)
     - Statut (défaut : Nouveau)
     - Description
  3. Enregistrer
- **Postcondition** : Nouveau lead créé, visible en colonne "Nouveau"

#### UC-022 : Modifier un lead
- **Acteur** : Admin, Commercial
- **Flux** :
  1. Ouvrir détails du lead
  2. Modifier titre, valeur, statut, source, description
  3. Enregistrer
- **Postcondition** : Lead mis à jour

#### UC-023 : Changer le statut d'un lead
- **Acteur** : Admin, Commercial
- **Flux** :
  1. Ouvrir détails du lead
  2. Sélectionner nouveau statut (Nouveau → En Cours → Converti/Perdu)
  3. Enregistrer
- **Alternative** : Drag & drop d'une colonne à l'autre (future évolution)
- **Postcondition** : Lead déplacé au nouveau statut

#### UC-024 : Supprimer un lead
- **Acteur** : Admin
- **Flux** :
  1. Ouvrir détails du lead
  2. Cliquer "Supprimer"
  3. Confirmation
  4. Lead supprimé
- **Postcondition** : Lead supprimé de la pipeline

---

### 5️⃣ GESTION DES TÂCHES

#### UC-025 : Créer une tâche
- **Acteur** : Admin, Commercial
- **Flux** :
  1. À partir d'un contact/lead, créer une tâche
  2. Remplir : titre, date d'échéance, lié au contact/lead
  3. Enregistrer
- **Postcondition** : Tâche créée

#### UC-026 : Consulter les tâches
- **Acteur** : Admin, Commercial
- **Flux** :
  1. Sur le tableau de bord ou section tâches
  2. Affichage des tâches à venir, triées par date d'échéance
- **Postcondition** : Tâches affichées

#### UC-027 : Marquer une tâche comme complétée
- **Acteur** : Admin, Commercial
- **Flux** :
  1. Cliquer case à cocher sur une tâche
  2. Tâche marquée complétée
- **Postcondition** : État mis à jour

---

### 6️⃣ TABLEAU DE BORD

#### UC-028 : Consulter le tableau de bord
- **Acteur** : Admin, Commercial, User
- **Flux** :
  1. Accéder à "/" (🏠)
  2. Affichage selon le rôle :
     - **Admin** : Statistiques globales (all contacts, all leads, performance)
     - **Commercial** : Ses KPIs (ses contacts, sa pipeline, ses leads)
     - **User** : Vue limitée
  3. Modale pour afficher les commerciaux et les contacts ou leads
- **Postcondition** : Dashboard affiché

#### UC-029 : Assigner un contact à un commercial
- **Acteur** : Admin (depuis le Dashboard)
- **Flux** :
  1. Cliquer sur un contact en liste
  2. Sélectionner le commercial assigné
  3. Enregistrer
- **Postcondition** : Contact assigné

---

## Résumé des Permissions par Rôle

| Use Case | Admin | Commercial | User |
|----------|-------|-----------|------|
| UC-001 à UC-003 | ✅ | ✅ | ✅ |
| UC-004 | ✅ | ❌ | ❌ |
| UC-005, UC-006 | ✅ (tous) | ✅ (siens) | ❌ |
| UC-007 à UC-012 | ✅ | ✅ | ❌ |
| UC-013 à UC-017 | ✅ | ✅ | ❌ |
| UC-018 à UC-024 | ✅ | ✅ | ❌ |
| UC-025 à UC-027 | ✅ | ✅ | ❌ |
| UC-028 | ✅ (global) | ✅ (perso) | ✅ (limité) |
| UC-029 | ✅ | ❌ | ❌ |

