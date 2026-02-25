# Diagramme ER - Entity Relationship Diagram

## Visualisation Complète

```mermaid
erDiagram
    AUTH-USERS ||--o{ PROFILES : "1:N"
    AUTH-USERS ||--o{ CONTACTS : "creates"
    AUTH-USERS ||--o{ TASKS : "owns"
    
    PROFILES ||--o{ CONTACTS : "assigned_to"
    PROFILES ||--o{ LEADS : "assigned_to"
    PROFILES ||--o{ CONTACT-NOTES : "author"
    
    COMPANIES ||--o{ CONTACTS : "contains"
    COMPANIES ||--o{ LEADS : "target"
    
    CONTACTS ||--o{ LEADS : "generates"
    CONTACTS ||--o{ CONTACT-NOTES : "documented_by"
    CONTACTS ||--o{ TASKS : "linked_to"
    
    AUTH-USERS {
        uuid id PK
        string email UK
        string password_hash
        timestamp created_at
    }
    
    PROFILES {
        uuid id PK "FK to auth.users"
        enum role "admin|commercial|user"
        string email
    }
    
    COMPANIES {
        uuid id PK
        string name
        string industry
        string website
        string address
        string town
        timestamp created_at
    }
    
    CONTACTS {
        uuid id PK
        string first_name
        string last_name
        string email UK
        string phone
        uuid company_id FK
        uuid user_id FK
        uuid assigned_to FK
        timestamp created_at
        timestamp updated_at
    }
    
    LEADS {
        uuid id PK
        string title
        uuid contact_id FK
        uuid company_id FK
        enum status "nouveau|en_cours|gagné|perdu"
        string source
        string description
        numeric estimated_value
        uuid assigned_to FK
        timestamp created_at
        timestamp updated_at
    }
    
    CONTACT-NOTES {
        uuid id PK
        uuid contact_id FK
        uuid author_id FK
        string content
        enum type "note|appel|email|réunion"
        timestamp created_at
    }
    
    TASKS {
        uuid id PK
        string title
        timestamp due_date
        boolean is_completed
        uuid contact_id FK
        uuid user_id FK
    }
```

## Légende

- **PK** = Primary Key (Clé primaire)
- **FK** = Foreign Key (Clé étrangère)
- **UK** = Unique Key (Contrainte d'unicité)
- **||--o{** = 1:N (One to Many)
- **enum** = Énumération (valeurs prédéfinies)

