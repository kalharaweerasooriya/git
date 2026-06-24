"""
Seed-data generator for the Smart Inventory Management System.

Generates:
  * 50+ products across 8 categories
  * Historical stock-in movements
  * 1000+ sales transactions over the last ~180 days,
    with realistic weekend spikes and per-product demand trends.

Output: seed_data.sql  (load AFTER schema.sql)

Usage:
    pip install -r requirements.txt
    python generate_data.py
    mysql -u root -p smart_inventory < seed_data.sql
"""
import random
from datetime import datetime, timedelta

random.seed(42)

# ----------------------------------------------------------------------
# Optional: regenerate real BCrypt hashes for admin123 / staff123.
# Falls back gracefully if the `bcrypt` package is not installed.
# ----------------------------------------------------------------------
def bcrypt_hash(raw: str):
    try:
        import bcrypt
        return bcrypt.hashpw(raw.encode(), bcrypt.gensalt(rounds=10)).decode()
    except Exception:
        return None


# category_id -> list of product base names
CATALOG = {
    1: ["Cola 1.5L", "Orange Juice 1L", "Mineral Water 500ml", "Energy Drink",
        "Green Tea 500ml", "Apple Juice 1L", "Iced Coffee 250ml", "Lemonade 1L"],
    2: ["Fresh Milk 1L", "Cheddar Cheese 200g", "Greek Yogurt 500g",
        "Butter 250g", "Cream 200ml", "Flavored Milk 200ml"],
    3: ["White Bread", "Whole Wheat Bread", "Burger Buns 6pk",
        "Chocolate Cake", "Croissant 4pk", "Dinner Rolls"],
    4: ["Basmati Rice 5kg", "Wheat Flour 2kg", "Corn Flakes 500g",
        "Oats 1kg", "Brown Rice 2kg", "Pasta 500g"],
    5: ["Potato Chips 150g", "Chocolate Bar", "Cream Biscuits",
        "Mixed Nuts 200g", "Popcorn 100g", "Wafers 120g", "Pretzels 150g"],
    6: ["Dish Soap 500ml", "Floor Cleaner 1L", "Laundry Powder 2kg",
        "Paper Towels 6pk", "Garbage Bags 30pk", "Glass Cleaner 500ml"],
    7: ["Shampoo 400ml", "Bath Soap 100g", "Toothpaste 150g",
        "Hand Wash 250ml", "Body Lotion 200ml", "Deodorant 150ml"],
    8: ["Frozen Peas 500g", "Frozen Fries 1kg", "Frozen Chicken 1kg",
        "Ice Cream 1L", "Frozen Mixed Veg 500g"],
}

# Per-category demand profile: (avg daily units, weekend multiplier, perishable?)
PROFILE = {
    1: (9, 1.6, False), 2: (12, 1.3, True),  3: (10, 1.4, True),
    4: (6, 1.1, False), 5: (11, 1.7, False), 6: (4, 1.0, False),
    7: (5, 1.2, False), 8: (7, 1.5, True),
}

products = []          # (id, sku, name, cat, unit_price, cost_price, qty, reorder, maxstock, expiry, avg_daily, weekend_mult)
pid = 0
for cat, names in CATALOG.items():
    avg, wend, perishable = PROFILE[cat]
    for name in names:
        pid += 1
        cost = round(random.uniform(0.8, 25.0), 2)
        price = round(cost * random.uniform(1.25, 1.8), 2)
        reorder = random.choice([10, 15, 20, 25])
        maxstock = reorder * random.choice([8, 10, 12])
        qty = random.randint(0, maxstock)
        expiry = None
        if perishable:
            expiry = (datetime.now() + timedelta(days=random.randint(-5, 60))).strftime("%Y-%m-%d")
        # give a few products an intentionally "dead" profile (very low demand)
        daily = avg * random.uniform(0.05, 1.4)
        sku = f"P{cat:02d}{pid:03d}"
        products.append([pid, sku, name, cat, price, cost, qty, reorder,
                         maxstock, expiry, daily, wend])

print(f"Generated {len(products)} products")

# ----------------------------------------------------------------------
# Generate sales over the last 180 days
# ----------------------------------------------------------------------
DAYS = 180
start = datetime.now() - timedelta(days=DAYS)
sales = []          # (invoice_no, user_id, total, payment, sale_date)
sale_items = []     # (sale_id, product_id, qty, unit_price, line_total)
movements = []      # (product_id, change_qty, type, reason, created_at)

# initial stock-in movement per product
for p in products:
    movements.append((p[0], p[6] + 300, "IN", "Initial stock", start.strftime("%Y-%m-%d %H:%M:%S")))

invoice_seq = 0
sale_id = 0
PAYMENTS = ["CASH", "CARD", "ONLINE"]

for d in range(DAYS):
    day = start + timedelta(days=d)
    is_weekend = day.weekday() >= 5
    # gentle upward growth trend across the period
    trend = 1.0 + (d / DAYS) * 0.4
    # number of transactions that day
    base_txn = random.randint(4, 9)
    if is_weekend:
        base_txn = int(base_txn * 1.6)
    base_txn = int(base_txn * trend)

    for _ in range(base_txn):
        invoice_seq += 1
        sale_id += 1
        hour = random.randint(8, 21)
        minute = random.randint(0, 59)
        ts = day.replace(hour=hour, minute=minute, second=0)
        invoice_no = f"INV-{ts.strftime('%Y%m%d')}-{invoice_seq:05d}"
        user_id = random.choice([1, 2])
        n_items = random.randint(1, 5)
        chosen = random.sample(products, n_items)
        total = 0.0
        items_for_sale = []
        for p in chosen:
            avg_daily, wend_mult = p[10], p[11]
            qmean = avg_daily / max(base_txn, 1)
            mult = wend_mult if is_weekend else 1.0
            qty = max(1, int(random.gauss(qmean * mult * trend, 1)))
            qty = min(qty, 12)
            unit_price = p[4]
            line = round(unit_price * qty, 2)
            total += line
            items_for_sale.append((sale_id, p[0], qty, unit_price, line))
            movements.append((p[0], -qty, "OUT", f"Sale {invoice_no}",
                              ts.strftime("%Y-%m-%d %H:%M:%S")))
        sales.append((invoice_no, user_id, round(total, 2),
                      random.choice(PAYMENTS), ts.strftime("%Y-%m-%d %H:%M:%S")))
        sale_items.extend(items_for_sale)

print(f"Generated {len(sales)} sales and {len(sale_items)} sale items")

# ----------------------------------------------------------------------
# Write seed_data.sql
# ----------------------------------------------------------------------
def esc(v):
    if v is None:
        return "NULL"
    if isinstance(v, str):
        return "'" + v.replace("'", "''") + "'"
    return str(v)

with open("seed_data.sql", "w", encoding="utf-8") as f:
    f.write("USE smart_inventory;\n")
    f.write("SET FOREIGN_KEY_CHECKS=0;\n")
    f.write("DELETE FROM sale_items; DELETE FROM sales; "
            "DELETE FROM stock_movements; DELETE FROM products;\n")
    f.write("SET FOREIGN_KEY_CHECKS=1;\n\n")

    # update real bcrypt hashes if available
    h_admin = bcrypt_hash("admin123")
    h_staff = bcrypt_hash("staff123")
    if h_admin and h_staff:
        f.write(f"UPDATE users SET password={esc(h_admin)} WHERE username='admin';\n")
        f.write(f"UPDATE users SET password={esc(h_staff)} WHERE username='staff';\n\n")
    else:
        f.write("-- (install `bcrypt` to regenerate admin123/staff123 hashes)\n\n")

    # products
    f.write("INSERT INTO products "
            "(id,sku,name,category_id,unit_price,cost_price,quantity,reorder_level,max_stock,expiry_date) VALUES\n")
    rows = []
    for p in products:
        rows.append(f"({p[0]},{esc(p[1])},{esc(p[2])},{p[3]},{p[4]},{p[5]},"
                    f"{p[6]},{p[7]},{p[8]},{esc(p[9])})")
    f.write(",\n".join(rows) + ";\n\n")

    # sales (need ids -> rely on AUTO_INCREMENT order, so insert explicit ids)
    f.write("INSERT INTO sales (id,invoice_no,user_id,total_amount,payment_method,sale_date) VALUES\n")
    rows = []
    for i, s in enumerate(sales, start=1):
        rows.append(f"({i},{esc(s[0])},{s[1]},{s[2]},{esc(s[3])},{esc(s[4])})")
    f.write(",\n".join(rows) + ";\n\n")

    # sale items (batched)
    f.write("INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,line_total) VALUES\n")
    rows = [f"({it[0]},{it[1]},{it[2]},{it[3]},{it[4]})" for it in sale_items]
    f.write(",\n".join(rows) + ";\n\n")

    # stock movements (batched in chunks to keep statements reasonable)
    CHUNK = 1000
    for i in range(0, len(movements), CHUNK):
        chunk = movements[i:i + CHUNK]
        f.write("INSERT INTO stock_movements (product_id,change_qty,type,reason,created_at) VALUES\n")
        rows = [f"({m[0]},{m[1]},{esc(m[2])},{esc(m[3])},{esc(m[4])})" for m in chunk]
        f.write(",\n".join(rows) + ";\n\n")

print("Wrote seed_data.sql")
