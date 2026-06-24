# Entity Relationship Diagram

The database (`smart_inventory`) has six tables. Diagram in Mermaid — it renders
on GitHub and in most Markdown viewers.

```mermaid
erDiagram
    USERS ||--o{ SALES : "records"
    CATEGORIES ||--o{ PRODUCTS : "classifies"
    PRODUCTS ||--o{ STOCK_MOVEMENTS : "has"
    PRODUCTS ||--o{ SALE_ITEMS : "appears in"
    SALES ||--|{ SALE_ITEMS : "contains"

    USERS {
        bigint id PK
        varchar username UK
        varchar password "BCrypt hash"
        varchar full_name
        enum role "ADMIN / STAFF"
        boolean enabled
        timestamp created_at
    }

    CATEGORIES {
        bigint id PK
        varchar name UK
        varchar description
    }

    PRODUCTS {
        bigint id PK
        varchar sku UK
        varchar name
        bigint category_id FK
        decimal unit_price
        decimal cost_price
        int quantity "stock on hand"
        int reorder_level "low-stock threshold"
        int max_stock "overstock threshold"
        date expiry_date
        timestamp created_at
    }

    STOCK_MOVEMENTS {
        bigint id PK
        bigint product_id FK
        int change_qty "+in / -out"
        enum type "IN / OUT / ADJUST"
        varchar reason
        timestamp created_at
    }

    SALES {
        bigint id PK
        varchar invoice_no UK
        bigint user_id FK
        decimal total_amount
        enum payment_method "CASH / CARD / ONLINE"
        timestamp sale_date
    }

    SALE_ITEMS {
        bigint id PK
        bigint sale_id FK
        bigint product_id FK
        int quantity
        decimal unit_price
        decimal line_total
    }
```

## Relationships

| Relationship | Type | Meaning |
|--------------|------|---------|
| Categories → Products | 1‑to‑many | A category groups many products |
| Products → Stock Movements | 1‑to‑many | Each stock change is logged per product |
| Products → Sale Items | 1‑to‑many | A product can appear in many sale lines |
| Sales → Sale Items | 1‑to‑many | An invoice has one or more line items |
| Users → Sales | 1‑to‑many | The staff/admin who recorded the sale |

## Notes
- `products.quantity` is the live stock level; every change is mirrored in
  `stock_movements` to preserve a full audit trail and historical demand.
- `sale_items` is the fact table the AI service reads for demand, trend and
  movement analysis.
