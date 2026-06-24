"""
AI Feature 2 — Fast & Slow Moving Product Analysis.

Uses sales velocity (units sold per day over the analysis window) and
K-Means clustering to group products into FAST / SLOW movers. Products with
no sales in the dead-stock window are flagged as DEAD STOCK.

Returns category counts (for a pie/bar chart) plus per-product detail.
"""
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

import config
import db


def analyze(window_days: int | None = None) -> dict:
    window_days = window_days or config.ANALYSIS_WINDOW_DAYS
    products = db.load_products()
    items = db.load_sales_items()

    cutoff = pd.Timestamp.now().normalize() - pd.Timedelta(days=window_days)
    dead_cutoff = pd.Timestamp.now().normalize() - pd.Timedelta(days=config.DEAD_STOCK_DAYS)

    recent = items[items["sale_date"] >= cutoff]
    units = recent.groupby("product_id")["quantity"].sum()
    revenue = recent.groupby("product_id")["line_total"].sum()

    # last sale date per product (for dead-stock detection)
    last_sale = items.groupby("product_id")["sale_date"].max()

    rows = []
    for _, p in products.iterrows():
        pid = int(p["id"])
        u = float(units.get(pid, 0.0))
        rev = float(revenue.get(pid, 0.0))
        velocity = round(u / window_days, 3)
        last = last_sale.get(pid)
        rows.append({
            "productId": pid, "name": p["name"], "category": p["category"],
            "unitsSold": int(u), "revenue": round(rev, 2),
            "velocity": velocity,
            "lastSale": None if pd.isna(last) else pd.Timestamp(last).strftime("%Y-%m-%d"),
            "_dead": (pd.isna(last) or pd.Timestamp(last) < dead_cutoff),
        })

    df = pd.DataFrame(rows)

    # K-Means on velocity + revenue for the products that DID sell
    movers = df[~df["_dead"]].copy()
    if len(movers) >= 3:
        feats = StandardScaler().fit_transform(movers[["velocity", "revenue"]])
        km = KMeans(n_clusters=2, n_init=10, random_state=42).fit(feats)
        # cluster with the higher mean velocity = FAST
        centers_velocity = [movers["velocity"][km.labels_ == c].mean() for c in range(2)]
        fast_cluster = int(np.argmax(centers_velocity))
        movers["category_label"] = ["FAST" if lbl == fast_cluster else "SLOW" for lbl in km.labels_]
    else:
        median_v = movers["velocity"].median() if not movers.empty else 0
        movers["category_label"] = movers["velocity"].apply(lambda v: "FAST" if v >= median_v else "SLOW")

    label_map = dict(zip(movers["productId"], movers["category_label"]))

    detail = []
    for r in rows:
        label = "DEAD" if r["_dead"] else label_map.get(r["productId"], "SLOW")
        msg = None
        if label == "DEAD":
            days = "45+" if r["lastSale"] is None else \
                (pd.Timestamp.now() - pd.Timestamp(r["lastSale"])).days
            msg = f"{r['name']} has not sold for {days} days (dead stock)."
        detail.append({
            "productId": r["productId"], "name": r["name"], "category": r["category"],
            "unitsSold": r["unitsSold"], "revenue": r["revenue"],
            "velocity": r["velocity"], "lastSale": r["lastSale"],
            "movement": label, "message": msg,
        })

    counts = {"FAST": 0, "SLOW": 0, "DEAD": 0}
    for d in detail:
        counts[d["movement"]] += 1

    detail.sort(key=lambda d: d["velocity"], reverse=True)

    return {
        "available": True,
        "feature": "Fast & Slow Moving Product Analysis",
        "windowDays": window_days,
        "counts": counts,
        "topFast": [d for d in detail if d["movement"] == "FAST"][:10],
        "deadStock": [d for d in detail if d["movement"] == "DEAD"],
        "products": detail,
    }
