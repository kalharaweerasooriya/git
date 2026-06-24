# Smart Inventory Management System with AI-Based Business Insights

A full-stack **Smart Inventory Management System** for a supermarket / retail shop, enhanced
with **AI/ML-based business insights**.

## Tech Stack

| Layer        | Technology                                  |
|--------------|---------------------------------------------|
| Frontend     | React (Vite) + Chart.js + Axios + React Router |
| Backend API  | Spring Boot 3 (Java 17), Spring Security + JWT, Spring Data JPA |
| Database     | MySQL 8                                     |
| AI/ML Service| Python 3.11 + Flask + scikit-learn + pandas |

## Architecture

```
                ┌─────────────────────┐
                │   React Frontend     │  (port 5173)
                │  Dashboard / Charts  │
                └──────────┬──────────┘
                           │ REST (JSON + JWT)
                           ▼
                ┌─────────────────────┐
                │  Spring Boot Backend │  (port 8080)
                │  Auth / Products /   │
                │  Inventory / Sales / │
                │  Reports             │
                └─────┬───────────┬───┘
                      │           │ REST (JSON)
            JPA/JDBC  │           ▼
                      │   ┌─────────────────────┐
                      │   │   Flask AI Service   │  (port 5001)
                      │   │  - Restock Predictor │
                      │   │  - Movement Analysis │
                      │   │  - Trend Forecasting │
                      │   │  - Intelligent Alerts│
                      │   └──────────┬──────────┘
                      ▼              │ reads sales/stock
                ┌─────────────────────┐
                │     MySQL Database   │  (port 3306)
                └─────────────────────┘
```

## Project Structure

```
smart-inventory/
├── backend/        # Spring Boot REST API
├── frontend/       # React single-page application
├── ai-service/     # Python Flask AI/ML microservice
├── database/       # SQL schema + seed-data generator
└── docs/           # ER diagram, architecture, report outline
```

## Features

### Part 1 — Core Inventory System
- **User Authentication** — JWT login/logout with `ADMIN` / `STAFF` roles
- **Product Management** — add / update / delete / search products
- **Inventory Management** — add stock, update quantity, view stock, low-stock alerts
- **Sales Management** — record sales, generate invoices, store sales history
- **Reports** — daily sales, monthly sales, product stock reports

### Part 2 — AI/ML Enhancement (Flask service)
1. **Smart Restock Prediction** — forecasts days-to-stockout and recommended restock quantity
2. **Fast & Slow Moving Product Analysis** — classifies fast / slow / dead stock
3. **Sales Trend Analysis** — daily/weekly/monthly trends + linear forecast
4. **Intelligent Alerts** — low stock, overstock, sudden sales drops, expiring products

### Required Charts (frontend)
- Sales Trend Chart
- Product Performance Chart
- Revenue Analysis Chart
- AI Prediction Chart

## Quick Start

> Requires: JDK 17+, Node 18+, Python 3.11+, MySQL 8. Run each component in its own terminal.

### 1. Database
```bash
mysql -u root -p < database/schema.sql
# Generate 50+ products and 1000+ sales records:
cd database
pip install -r requirements.txt
python generate_data.py            # writes seed_data.sql
mysql -u root -p smart_inventory < seed_data.sql
```

### 2. AI Service (Flask)
```bash
cd ai-service
pip install -r requirements.txt
python app.py                      # http://localhost:5001
```

### 3. Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run                # http://localhost:8080
# (edit src/main/resources/application.properties for your MySQL user/password)
```

### 4. Frontend (React)
```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173
```

### Default Logins
| Role  | Username | Password   |
|-------|----------|------------|
| Admin | admin    | admin123   |
| Staff | staff    | staff123   |

> Passwords above are seeded as BCrypt hashes in `database/schema.sql`.

See [`docs/`](docs/) for the ER diagram, architecture diagram, and report outline.
