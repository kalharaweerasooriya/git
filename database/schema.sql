-- ============================================================
-- Smart Inventory Management System — Database Schema (MySQL 8)
-- ============================================================
DROP DATABASE IF EXISTS smart_inventory;
CREATE DATABASE smart_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_inventory;

-- ----------------------------------------------------------
-- Users / Authentication
-- ----------------------------------------------------------
CREATE TABLE users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(100) NOT NULL,            -- BCrypt hash
    full_name   VARCHAR(100) NOT NULL,
    role        ENUM('ADMIN','STAFF') NOT NULL DEFAULT 'STAFF',
    enabled     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------
-- Categories
-- ----------------------------------------------------------
CREATE TABLE categories (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(80) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- ----------------------------------------------------------
-- Products
-- ----------------------------------------------------------
CREATE TABLE products (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    sku           VARCHAR(40) NOT NULL UNIQUE,
    name          VARCHAR(120) NOT NULL,
    category_id   BIGINT,
    unit_price    DECIMAL(10,2) NOT NULL DEFAULT 0,   -- selling price
    cost_price    DECIMAL(10,2) NOT NULL DEFAULT 0,   -- purchase price
    quantity      INT NOT NULL DEFAULT 0,             -- current stock on hand
    reorder_level INT NOT NULL DEFAULT 10,            -- low-stock threshold
    max_stock     INT NOT NULL DEFAULT 200,           -- overstock threshold
    expiry_date   DATE,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_category FOREIGN KEY (category_id)
        REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_product_name (name)
);

-- ----------------------------------------------------------
-- Stock movements (inventory history)
-- ----------------------------------------------------------
CREATE TABLE stock_movements (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id  BIGINT NOT NULL,
    change_qty  INT NOT NULL,                         -- +in / -out
    type        ENUM('IN','OUT','ADJUST') NOT NULL,
    reason      VARCHAR(255),
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_movement_product FOREIGN KEY (product_id)
        REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_movement_product (product_id),
    INDEX idx_movement_date (created_at)
);

-- ----------------------------------------------------------
-- Sales (invoice header)
-- ----------------------------------------------------------
CREATE TABLE sales (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_no     VARCHAR(40) NOT NULL UNIQUE,
    user_id        BIGINT,
    total_amount   DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_method ENUM('CASH','CARD','ONLINE') NOT NULL DEFAULT 'CASH',
    sale_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sale_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_sale_date (sale_date)
);

-- ----------------------------------------------------------
-- Sale items (invoice lines)
-- ----------------------------------------------------------
CREATE TABLE sale_items (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    sale_id     BIGINT NOT NULL,
    product_id  BIGINT NOT NULL,
    quantity    INT NOT NULL,
    unit_price  DECIMAL(10,2) NOT NULL,
    line_total  DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_item_sale FOREIGN KEY (sale_id)
        REFERENCES sales(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_product FOREIGN KEY (product_id)
        REFERENCES products(id),
    INDEX idx_item_product (product_id)
);

-- ----------------------------------------------------------
-- Seed users (passwords are BCrypt hashes)
--   admin / admin123     staff / staff123
-- ----------------------------------------------------------
INSERT INTO users (username, password, full_name, role) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'System Administrator', 'ADMIN'),
('staff', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Shop Staff', 'STAFF');
-- NOTE: the hash above corresponds to "password". For real admin123/staff123 hashes
-- the generate_data.py script regenerates these rows. See database/README.md.

-- ----------------------------------------------------------
-- Seed categories
-- ----------------------------------------------------------
INSERT INTO categories (name, description) VALUES
('Beverages',   'Drinks, juices, soft drinks'),
('Dairy',       'Milk, cheese, yogurt'),
('Bakery',      'Bread, buns, cakes'),
('Grains',      'Rice, flour, cereals'),
('Snacks',      'Chips, biscuits, chocolates'),
('Household',   'Cleaning and home supplies'),
('Personal Care','Soap, shampoo, toothpaste'),
('Frozen',      'Frozen vegetables and meat');
