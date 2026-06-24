"""
AI Feature 3 — Sales Trend Analysis & Forecasting.

Aggregates revenue by day / week / month, fits a linear-regression model on
daily revenue to forecast the next 7 days, and detects the weekend effect.
"""
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

import db


def analyze() -> dict:
    daily = db.load_daily_sales()
    if daily.empty:
        return {"available": True, "feature": "Sales Trend Analysis",
                "message": "No sales data available yet.",
                "daily": [], "weekly": [], "monthly": [], "forecast": []}

    daily = daily.sort_values("day").reset_index(drop=True)

    # ---- weekly & monthly aggregates ----
    weekly = (daily.set_index("day")["revenue"]
              .resample("W").sum().reset_index())
    monthly = (daily.set_index("day")["revenue"]
               .resample("MS").sum().reset_index())

    # ---- linear forecast for next 7 days ----
    x = np.arange(len(daily)).reshape(-1, 1)
    y = daily["revenue"].values.astype(float)
    model = LinearRegression().fit(x, y)
    slope = float(model.coef_[0])
    future_x = np.arange(len(daily), len(daily) + 7).reshape(-1, 1)
    future_y = model.predict(future_x)
    last_day = daily["day"].iloc[-1]
    forecast = [
        {"day": (last_day + pd.Timedelta(days=i + 1)).strftime("%Y-%m-%d"),
         "predictedRevenue": round(float(max(v, 0)), 2)}
        for i, v in enumerate(future_y)
    ]

    # ---- weekend effect ----
    daily["weekday"] = daily["day"].dt.weekday
    weekend_avg = daily[daily["weekday"] >= 5]["revenue"].mean()
    weekday_avg = daily[daily["weekday"] < 5]["revenue"].mean()
    weekend_lift = 0.0
    if weekday_avg and not np.isnan(weekday_avg) and weekday_avg > 0:
        weekend_lift = round((weekend_avg - weekday_avg) / weekday_avg * 100, 1)

    # ---- month-over-month change ----
    mom_change = None
    if len(monthly) >= 2:
        prev, cur = monthly["revenue"].iloc[-2], monthly["revenue"].iloc[-1]
        if prev > 0:
            mom_change = round((cur - prev) / prev * 100, 1)

    messages = []
    if slope > 0:
        messages.append(f"Overall sales are trending upward (+{slope:.1f} per day).")
    elif slope < 0:
        messages.append(f"Overall sales are trending downward ({slope:.1f} per day).")
    if weekend_lift > 5:
        messages.append(f"Sales increase during weekends (+{weekend_lift:.0f}% vs weekdays).")
    if mom_change is not None:
        direction = "increased" if mom_change >= 0 else "decreased"
        messages.append(f"Sales {direction} by {abs(mom_change):.0f}% this month.")

    return {
        "available": True,
        "feature": "Sales Trend Analysis",
        "slopePerDay": round(slope, 2),
        "weekendLiftPct": weekend_lift,
        "monthOverMonthPct": mom_change,
        "messages": messages,
        "daily": [{"day": d.strftime("%Y-%m-%d"), "revenue": round(float(r), 2)}
                  for d, r in zip(daily["day"], daily["revenue"])],
        "weekly": [{"week": w.strftime("%Y-%m-%d"), "revenue": round(float(r), 2)}
                   for w, r in zip(weekly["day"], weekly["revenue"])],
        "monthly": [{"month": m.strftime("%Y-%m"), "revenue": round(float(r), 2)}
                    for m, r in zip(monthly["day"], monthly["revenue"])],
        "forecast": forecast,
    }
