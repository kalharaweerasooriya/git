"""
AI Feature 1 — Smart Restock Prediction.

For every product we estimate average daily demand from historical sales,
then use a linear-regression trend on daily demand to project near-future
consumption. From that we derive:
    * days_to_stockout  = current_qty / projected_daily_demand
    * recommended_restock = demand over (lead time + safety days) - current stock

Returns a list of products sorted by urgency (soonest stockout first).
"""
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

import config
import db


def _daily_demand_series(items: pd.DataFrame, product_id: int, window_days: int) -> pd.Series:
    cutoff = pd.Timestamp.now().normalize() - pd.Timedelta(days=window_days)
    sub = items[(items["product_id"] == product_id) & (items["sale_date"] >= cutoff)]
    if sub.empty:
        return pd.Series(dtype=float)
    daily = sub.groupby(sub["sale_date"].dt.date)["quantity"].sum()
    # reindex across the full window so missing days count as zero demand
    idx = pd.date_range(cutoff.date(), pd.Timestamp.now().date(), freq="D").date
    daily = daily.reindex(idx, fill_value=0)
    return daily


def _projected_daily_demand(daily: pd.Series) -> float:
    """Average of historical mean and a linear-trend projection."""
    if daily.empty:
        return 0.0
    mean_demand = float(daily.mean())
    if len(daily) >= 7 and daily.sum() > 0:
        x = np.arange(len(daily)).reshape(-1, 1)
        y = daily.values.astype(float)
        model = LinearRegression().fit(x, y)
        projected = float(model.predict([[len(daily) + config.LEAD_TIME_DAYS]])[0])
        projected = max(projected, 0.0)
        # blend trend with historical average for stability
        return round((mean_demand + projected) / 2.0, 3)
    return round(mean_demand, 3)


def predict(window_days: int | None = None) -> dict:
    window_days = window_days or config.ANALYSIS_WINDOW_DAYS
    products = db.load_products()
    items = db.load_sales_items()

    results = []
    cover_days = config.LEAD_TIME_DAYS + config.SAFETY_STOCK_DAYS
    for _, p in products.iterrows():
        daily = _daily_demand_series(items, p["id"], window_days)
        demand = _projected_daily_demand(daily)
        qty = int(p["quantity"])

        if demand > 0:
            days_to_stockout = round(qty / demand, 1)
        else:
            days_to_stockout = None  # no recent demand

        target_stock = demand * cover_days
        recommended = int(max(0, round(target_stock - qty)))

        if days_to_stockout is not None and days_to_stockout <= config.LEAD_TIME_DAYS:
            message = (f"{p['name']} may run out within {days_to_stockout:.0f} days. "
                       f"Recommended restock quantity: {recommended} units.")
            urgency = "HIGH"
        elif days_to_stockout is not None and days_to_stockout <= cover_days:
            message = (f"{p['name']} is running low (~{days_to_stockout:.0f} days left). "
                       f"Consider restocking {recommended} units.")
            urgency = "MEDIUM"
        elif demand == 0:
            message = f"{p['name']} has no recent sales — no restock needed."
            urgency = "NONE"
        else:
            message = f"{p['name']} stock is healthy (~{days_to_stockout:.0f} days of cover)."
            urgency = "LOW"

        results.append({
            "productId": int(p["id"]),
            "name": p["name"],
            "currentStock": qty,
            "avgDailyDemand": demand,
            "daysToStockout": days_to_stockout,
            "recommendedRestock": recommended,
            "urgency": urgency,
            "message": message,
        })

    order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2, "NONE": 3}
    results.sort(key=lambda r: (order[r["urgency"]],
                                r["daysToStockout"] if r["daysToStockout"] is not None else 9999))
    return {
        "available": True,
        "feature": "Smart Restock Prediction",
        "leadTimeDays": config.LEAD_TIME_DAYS,
        "safetyStockDays": config.SAFETY_STOCK_DAYS,
        "predictions": results,
    }
