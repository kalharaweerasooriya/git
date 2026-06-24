"""
AI Feature 4 — Intelligent Alerts.

Generates four kinds of alerts:
    * LOW_STOCK      — quantity at/under reorder level
    * OVERSTOCK      — quantity at/above max stock
    * SALES_DROP     — last 7 days demand fell sharply vs the prior 7 days
    * EXPIRING       — perishable products expiring within EXPIRY_ALERT_DAYS
"""
import pandas as pd

import config
import db


def generate() -> dict:
    products = db.load_products()
    items = db.load_sales_items()
    today = pd.Timestamp.now().normalize()

    alerts = []

    # ---- LOW STOCK & OVERSTOCK & EXPIRING ----
    for _, p in products.iterrows():
        qty, reorder, mx = int(p["quantity"]), int(p["reorder_level"]), int(p["max_stock"])
        if qty <= reorder:
            alerts.append({
                "type": "LOW_STOCK", "severity": "HIGH", "productId": int(p["id"]),
                "product": p["name"],
                "message": f"Low stock: {p['name']} has only {qty} units (reorder at {reorder})."
            })
        elif qty >= mx:
            alerts.append({
                "type": "OVERSTOCK", "severity": "MEDIUM", "productId": int(p["id"]),
                "product": p["name"],
                "message": f"Overstock: {p['name']} has {qty} units (max {mx}). Avoid over-ordering."
            })

        expiry = p["expiry_date"]
        if pd.notna(expiry):
            expiry = pd.Timestamp(expiry)
            days_left = (expiry - today).days
            if days_left < 0:
                alerts.append({
                    "type": "EXPIRING", "severity": "HIGH", "productId": int(p["id"]),
                    "product": p["name"],
                    "message": f"{p['name']} expired {abs(days_left)} days ago — remove from shelf."
                })
            elif days_left <= config.EXPIRY_ALERT_DAYS:
                alerts.append({
                    "type": "EXPIRING", "severity": "MEDIUM", "productId": int(p["id"]),
                    "product": p["name"],
                    "message": f"{p['name']} expires in {days_left} days — discount or prioritise sale."
                })

    # ---- SUDDEN SALES DROP (per product) ----
    if not items.empty:
        last7_start = today - pd.Timedelta(days=7)
        prev7_start = today - pd.Timedelta(days=14)
        last7 = items[items["sale_date"] >= last7_start].groupby("product_id")["quantity"].sum()
        prev7 = items[(items["sale_date"] >= prev7_start) &
                      (items["sale_date"] < last7_start)].groupby("product_id")["quantity"].sum()
        name_map = dict(zip(products["id"], products["name"]))
        for pid, prev_qty in prev7.items():
            cur_qty = float(last7.get(pid, 0.0))
            if prev_qty >= 10 and cur_qty < prev_qty * 0.5:
                drop = round((1 - cur_qty / prev_qty) * 100)
                alerts.append({
                    "type": "SALES_DROP", "severity": "MEDIUM", "productId": int(pid),
                    "product": name_map.get(pid, str(pid)),
                    "message": f"Sudden sales drop: {name_map.get(pid, pid)} sales fell {drop}% this week."
                })

    counts = {}
    for a in alerts:
        counts[a["type"]] = counts.get(a["type"], 0) + 1

    sev_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    alerts.sort(key=lambda a: sev_order.get(a["severity"], 3))

    return {
        "available": True,
        "feature": "Intelligent Alerts",
        "total": len(alerts),
        "counts": counts,
        "alerts": alerts,
    }
