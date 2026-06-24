"""
Smart Inventory — Flask AI/ML microservice.

Exposes four intelligent features over REST:
    GET /api/ai/restock   — Smart Restock Prediction
    GET /api/ai/movement  — Fast & Slow Moving Product Analysis
    GET /api/ai/trend     — Sales Trend Analysis & Forecast
    GET /api/ai/alerts    — Intelligent Alerts
    GET /api/ai/insights  — Combined headline summary
    GET /health           — health check
"""
from flask import Flask, jsonify
from flask_cors import CORS

import config
from ai import restock, movement, trend, alerts

app = Flask(__name__)
CORS(app)


def _safe(fn):
    """Run an analysis function and convert DB/other errors into a friendly payload."""
    try:
        return jsonify(fn()), 200
    except Exception as e:  # noqa: BLE001
        return jsonify({
            "available": False,
            "message": "AI analysis failed. Is MySQL running and seeded?",
            "error": str(e),
        }), 200


@app.get("/health")
def health():
    return jsonify({"status": "UP", "service": "ai-service"}), 200


@app.get("/api/ai/restock")
def api_restock():
    return _safe(restock.predict)


@app.get("/api/ai/movement")
def api_movement():
    return _safe(movement.analyze)


@app.get("/api/ai/trend")
def api_trend():
    return _safe(trend.analyze)


@app.get("/api/ai/alerts")
def api_alerts():
    return _safe(alerts.generate)


@app.get("/api/ai/insights")
def api_insights():
    """Headline summary combining all four features for the AI dashboard."""
    try:
        r = restock.predict()
        m = movement.analyze()
        t = trend.analyze()
        a = alerts.generate()

        headlines = []
        urgent = [p for p in r["predictions"] if p["urgency"] == "HIGH"][:3]
        for p in urgent:
            headlines.append(p["message"])
        headlines.extend(t.get("messages", [])[:2])
        for d in m.get("deadStock", [])[:2]:
            if d.get("message"):
                headlines.append(d["message"])

        return jsonify({
            "available": True,
            "headlines": headlines,
            "stats": {
                "urgentRestock": len([p for p in r["predictions"] if p["urgency"] == "HIGH"]),
                "fastMovers": m["counts"].get("FAST", 0),
                "slowMovers": m["counts"].get("SLOW", 0),
                "deadStock": m["counts"].get("DEAD", 0),
                "activeAlerts": a["total"],
                "weekendLiftPct": t.get("weekendLiftPct", 0),
                "monthOverMonthPct": t.get("monthOverMonthPct"),
            },
        }), 200
    except Exception as e:  # noqa: BLE001
        return jsonify({"available": False, "message": "AI summary failed.",
                        "error": str(e)}), 200


if __name__ == "__main__":
    print(f"Starting AI service on http://localhost:{config.PORT}")
    app.run(host="0.0.0.0", port=config.PORT, debug=True)
