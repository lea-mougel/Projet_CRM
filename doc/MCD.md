# MCD - Modèle Conceptuel de Données

## Diagramme Entité-Association

```
                    ┌─────────────────┐
                    │  auth.users     │
                    ├─────────────────┤
                    │ id (UUID) PK    │
                    │ email           │
                    │ password_hash   │
                    │ created_at      │
                    └────────┬────────┘
                             │ 1
                             │
                       ┌─────▼──────┐
                       │  profiles   │ (rôles)
                       ├────────────┤
                       │ id (UUID)  │ FK
                       │ role       │ enum
                       │ email      │
                       └─────┬──────┘
                             │
            ┌────────────────┼────────────────┐
            │1               │1               │1
            │                │                │
    ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼─────────┐
    │  contacts   │  │    leads    │  │  tasks         │
    ├────────────┤  ├────────────┤  ├────────────────┤
    │ id (PK)    │  │ id (PK)    │  │ id (PK)        │
    │ first_name │  │ title      │  │ title          │
    │ last_name  │  │ source     │  │ due_date       │
    │ email      │  │ status     │  │ is_completed   │
    │ phone      │  │ value      │  │ contact_id FK  │
    │ created_at │  │ created_at │  │ user_id FK     │
    │ updated_at │  │ updated_at │  └────────────────┘
    │            │  │            │
    │ company_id ├──┤ company_id │
    │  FK        │  │  FK        │
    │ assigned_to├──┤ assigned_to│ (FK → profiles)
    │  FK        │  │  FK        │
    │ user_id    │  │ contact_id │ (FK → contacts)
    │  FK        │  │  FK        │
    └──────┬─────┘  └────────────┘
         (1)│Many
            │
    ┌───────▼────────────────────┐
    │   contact_notes            │
    ├────────────────────────────┤
    │ id (UUID) PK               │
    │ contact_id FK              │  (FK → contacts)
    │ author_id FK               │  (FK → profiles)
    │ content                    │
    │ type                       │  enum(note, appel, email, réunion)
    │ created_at                 │
    │ updated_at                 │
    └────────────────────────────┘
    
    
         ┌──────────────────┐
         │  companies       │
         ├──────────────────┤
         │ id (UUID) PK     │
         │ name             │
         │ industry         │
         │ website          │
         │ address          │
         │ town             │
         │ created_at       │
         │ updated_at       │
         └────────┬─────────┘
                  │ (1)
                  │
        Referenced by:
        - contacts (company_id)
        - leads (company_id)
```

---

## Dictionnaire des Tables

### 1. `auth.users` (Table Supabase Auth)
| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| id | UUID | PK | ID utilisateur unique |
| email | text | UNIQUE | Email de connexion |
| password_hash | text | NOT NULL | Hash du mot de passe |
| created_at | timestamp | DEFAULT now() | Date de création |

**Clés étrangères** : -

---

### 2. `profiles` (Gestion des rôles)
| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| id | UUID | PK, FK | ID utilisateur (lien vers auth.users) |
| role | text | CHECK, DEFAULT 'user' | admin \| commercial \| user |
| email | text | | Email de l'utilisateur |

**Clés étrangères** :
- `id` → `auth.users.id`

---

### 3. `companies` (Sociétés)
| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| id | UUID | PK | ID unique auto-généré |
| name | text | NOT NULL | Nom de l'entreprise |
| industry | text | | Secteur d'activité |
| website | text | | Site web |
| address | text | | Adresse physique |
| town | text | | Ville |
| created_at | timestamp | DEFAULT now() | Date de création |

**Clés étrangères** : -

---

### 4. `contacts` (Contacts/Leads commerciaux)
| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| id | UUID | PK | ID unique auto-généré |
| first_name | text | NOT NULL | Prénom |
| last_name | text | NOT NULL | Nom |
| email | text | UNIQUE, NOT NULL | Email unique |
| phone | text | | Téléphone |
| company_id | UUID | FK | Lien vers companies |
| user_id | UUID | FK | Créateur du contact (auth.users) |
| assigned_to | UUID | FK | Commercial assigné (profiles) |
| created_at | timestamp | DEFAULT now() | Date de création |

**Clés étrangères** :
- `company_id` → `companies.id`
- `user_id` → `auth.users.id`
- `assigned_to` → `profiles.id`

**Sécurité** : RLS (Row Level Security)
- Admin voit tous
- Commercial voit ses contacts + non assignés

---

### 5. `leads` (Pipeline de vente)
| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| id | UUID | PK | ID unique auto-généré |
| title | text | NOT NULL, DEFAULT 'Sans titre' | Titre du lead |
| contact_id | UUID | FK | Contact associé |
| company_id | UUID | FK | Société associée |
| status | text | CHECK, DEFAULT 'nouveau' | nouveau \| en cours \| converti \| perdu |
| source | text | | Source du lead (web, appel, email, etc.) |
| description | text | | Description longue |
| estimated_value | numeric | DEFAULT 0 | Valeur estimée en € |
| assigned_to | UUID | FK | Commercial responsable |
| created_at | timestamp | DEFAULT now() | Date de création |
| updated_at | timestamp | DEFAULT now() | Date de dernière modification |

**Clés étrangères** :
- `contact_id` → `contacts.id`
- `company_id` → `companies.id`
- `assigned_to` → `profiles.id`

**Statuts valides** : nouveau, en cours, converti, perdu

---

### 6. `contact_notes` (Historique des interactions)
| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| id | UUID | PK | ID unique auto-généré |
| contact_id | UUID | FK | Contact lié |
| author_id | UUID | FK | Auteur (profiles) |
| content | text | NOT NULL | Contenu de la note |
| type | text | CHECK, NOT NULL | note \| appel \| email \| réunion |
| created_at | timestamp | DEFAULT now() | Date de création |

**Clés étrangères** :
- `contact_id` → `contacts.id`
- `author_id` → `profiles.id`

**Types valides** : note, appel, email, réunion

---

### 7. `tasks` (Tâches/Reminders)
| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| id | UUID | PK | ID unique auto-généré |
| title | text | NOT NULL | Titre de la tâche |
| due_date | timestamp | | Date d'échéance |
| is_completed | boolean | DEFAULT false | État de réalisation |
| contact_id | UUID | FK | Contact lié (optionnel) |
| user_id | UUID | FK | Utilisateur propriétaire |

**Clés étrangères** :
- `contact_id` → `contacts.id`
- `user_id` → `auth.users.id`

---

## Relations entre Entités

### 1. **profiles** ↔ **contacts**
- **Type** : 1-N (Un profil, Plusieurs contacts assignés)
- **Relation** : `contacts.assigned_to` → `profiles.id`
- **Cas d'usage** : Voir tous les contacts assignés à un commercial

### 2. **profiles** ↔ **leads**
- **Type** : 1-N (Un profil, Plusieurs leads assignés)
- **Relation** : `leads.assigned_to` → `profiles.id`
- **Cas d'usage** : Voir la pipeline d'un commercial

### 3. **companies** ↔ **contacts**
- **Type** : 1-N (Une société, Plusieurs contacts)
- **Relation** : `contacts.company_id` → `companies.id`
- **Cas d'usage** : Voir tous les contacts d'une société

### 4. **companies** ↔ **leads**
- **Type** : 1-N (Une société, Plusieurs leads)
- **Relation** : `leads.company_id` → `companies.id`
- **Cas d'usage** : Pipeline par société

### 5. **contacts** ↔ **leads**
- **Type** : 1-N (Un contact, Plusieurs leads)
- **Relation** : `leads.contact_id` → `contacts.id`
- **Cas d'usage** : Voir les leads d'un contact

### 6. **contacts** ↔ **contact_notes**
- **Type** : 1-N (Un contact, Plusieurs notes)
- **Relation** : `contact_notes.contact_id` → `contacts.id`
- **Cas d'usage** : Historique des interactions d'un contact

### 7. **profiles** ↔ **contact_notes**
- **Type** : 1-N (Un profil, Plusieurs notes créées)
- **Relation** : `contact_notes.author_id` → `profiles.id`
- **Cas d'usage** : Voir les notes écrites par un utilisateur

### 8. **auth.users** ↔ **contacts**
- **Type** : 1-N (Un utilisateur, Plusieurs contacts créés)
- **Relation** : `contacts.user_id` → `auth.users.id`
- **Cas d'usage** : Traçabilité du créateur

### 9. **auth.users** ↔ **tasks**
- **Type** : 1-N (Un utilisateur, Plusieurs tâches)
- **Relation** : `tasks.user_id` → `auth.users.id`
- **Cas d'usage** : Tâches d'un utilisateur

### 10. **contacts** ↔ **tasks**
- **Type** : 1-N (Un contact, Plusieurs tâches liées)
- **Relation** : `tasks.contact_id` → `contacts.id`
- **Cas d'usage** : Tâches liées à un contact

---

## Constraints & Validations

### Domaines de valeurs

| Champ | Valeurs Valides | Exemple |
|-------|---|---|
| `profiles.role` | admin, commercial, user | 'commercial' |
| `leads.status` | nouveau, en_cours, gagné, perdu | 'en_cours' |
| `contact_notes.type` | note, appel, email, réunion | 'appel' |

### Intégrité Référentielle

- ✅ FK cascades NOT SET (soft delete préservé)
- ✅ Unicité de l'email pour contacts
- ✅ RLS activé pour contacts et leads
- ✅ Timestamps auto-générés création/modification

---

## Indexes Recommandés

```sql
-- Performance des recherches
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_assigned_to ON contacts(assigned_to);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_first_name ON contacts(first_name);
CREATE INDEX idx_contacts_last_name ON contacts(last_name);

-- Performance des leads
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_company_id ON leads(company_id);
CREATE INDEX idx_leads_contact_id ON leads(contact_id);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);

-- Performance de l'historique
CREATE INDEX idx_contact_notes_contact_id ON contact_notes(contact_id);
CREATE INDEX idx_contact_notes_author_id ON contact_notes(author_id);
CREATE INDEX idx_contact_notes_created_at ON contact_notes(created_at DESC);

-- Performance des tâches
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_contact_id ON tasks(contact_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

