"""Configuration for the Flask AI service (override via environment variables)."""
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "smart_inventory")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "root")

SQLALCHEMY_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# Business parameters
LEAD_TIME_DAYS = int(os.getenv("LEAD_TIME_DAYS", "5"))        # supplier lead time
SAFETY_STOCK_DAYS = int(os.getenv("SAFETY_STOCK_DAYS", "7"))  # buffer
ANALYSIS_WINDOW_DAYS = int(os.getenv("ANALYSIS_WINDOW_DAYS", "60"))
DEAD_STOCK_DAYS = int(os.getenv("DEAD_STOCK_DAYS", "30"))
EXPIRY_ALERT_DAYS = int(os.getenv("EXPIRY_ALERT_DAYS", "14"))

PORT = int(os.getenv("AI_PORT", "5001"))
