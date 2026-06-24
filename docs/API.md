# REST API Reference

Base URL: `http://localhost:8080`
All endpoints except `/api/auth/**` require `Authorization: Bearer <JWT>`.

## Authentication
| Method | Path | Body | Notes |
|--------|------|------|-------|
| POST | `/api/auth/login` | `{username, password}` | Returns `{token, username, fullName, role}` |
| POST | `/api/auth/logout` | — | Client discards token |
| GET  | `/api/auth/me` | — | Current user |

## Products  (write ops require ROLE_ADMIN)
| Method | Path | Body |
|--------|------|------|
| GET | `/api/products?search=milk` | — |
| GET | `/api/products/{id}` | — |
| GET | `/api/products/low-stock` | — |
| POST | `/api/products` | `ProductRequest` |
| PUT | `/api/products/{id}` | `ProductRequest` |
| DELETE | `/api/products/{id}` | — |

`ProductRequest`: `{sku, name, categoryId, unitPrice, costPrice, quantity, reorderLevel, maxStock, expiryDate}`

## Categories
| GET | `/api/categories` | list |

## Inventory
| Method | Path | Body |
|--------|------|------|
| POST | `/api/inventory/{productId}/adjust` | `{type: IN\|OUT\|ADJUST, changeQty, reason}` |
| GET | `/api/inventory/{productId}/history` | — |
| GET | `/api/inventory/low-stock` | — |
| GET | `/api/inventory/over-stock` | — |

## Sales
| Method | Path | Body |
|--------|------|------|
| POST | `/api/sales` | `{paymentMethod, items:[{productId, quantity}]}` |
| GET | `/api/sales` | recent 50 |
| GET | `/api/sales/{id}` | one invoice |

## Reports
| GET | `/api/reports/summary` | dashboard metrics |
| GET | `/api/reports/daily?days=30` | daily sales |
| GET | `/api/reports/monthly` | monthly revenue |
| GET | `/api/reports/product-performance` | units + revenue per product |
| GET | `/api/reports/stock` | current stock report |

## AI / ML  (proxied to Flask on :5001)
| GET | `/api/ai/restock` | Smart restock predictions |
| GET | `/api/ai/movement` | Fast / slow / dead classification |
| GET | `/api/ai/trend` | Trend analysis + 7-day forecast |
| GET | `/api/ai/alerts` | Intelligent alerts |
| GET | `/api/ai/insights` | Combined headline summary |

## Flask AI service (direct, port 5001)
Same paths as above under `/api/ai/*`, plus `GET /health`.

### Example: login with curl
```bash
curl -s http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}'
```
