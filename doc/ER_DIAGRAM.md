# ER Diagram - Version alignée au périmètre implémenté

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "has_profile"
    AUTH_USERS ||--o{ CONTACTS : "creates"

    PROFILES ||--o{ CONTACTS : "assigned_to"
    PROFILES ||--o{ LEADS : "assigned_to"
    PROFILES ||--o{ CONTACT_NOTES : "author"

    COMPANIES ||--o{ CONTACTS : "contains"
    COMPANIES ||--o{ LEADS : "targets"

    CONTACTS ||--o{ LEADS : "originates"
    CONTACTS ||--o{ CONTACT_NOTES : "history"

    AUTH_USERS {
        uuid id PK
        string email UK
        timestamp created_at
    }

    PROFILES {
        uuid id PK "FK auth_users.id"
        string email
        string role "admin|commercial|user"
    }

    COMPANIES {
        uuid id PK
        string name
        string industry
        string website
        string address
        string town
        timestamp created_at
        timestamp updated_at
    }

    CONTACTS {
        uuid id PK
        string first_name
        string last_name
        string email UK
        string phone
        uuid company_id FK
        uuid assigned_to FK
        uuid user_id FK
        timestamp created_at
        timestamp updated_at
    }

    LEADS {
        uuid id PK
        string title
        uuid contact_id FK
        uuid company_id FK
        string status "nouveau|en cours|converti|perdu"
        string source
        string description
        numeric estimated_value
        uuid assigned_to FK
        timestamp created_at
        timestamp updated_at
    }

    CONTACT_NOTES {
        uuid id PK
        uuid contact_id FK
        uuid author_id FK
        string content
        string type "note|appel|email|réunion"
        timestamp created_at
        timestamp updated_at
    }
```

## Notes

- Le statut lead utilise les valeurs réelles de l'application: nouveau, en cours, converti, perdu.
- Les entités tasks/emailings sont volontairement exclues de ce diagramme car non implémentées dans la version actuelle.
