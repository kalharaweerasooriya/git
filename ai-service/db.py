"""Database access layer — loads inventory & sales data into pandas DataFrames."""
import pandas as pd
from sqlalchemy import create_engine, text
import config

_engine = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(config.SQLALCHEMY_URL, pool_pre_ping=True)
    return _engine


def load_products() -> pd.DataFrame:
    sql = """
        SELECT p.id, p.sku, p.name, p.quantity, p.reorder_level, p.max_stock,
               p.unit_price, p.cost_price, p.expiry_date, c.name AS category
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
    """
    return pd.read_sql(text(sql), get_engine())


def load_sales_items() -> pd.DataFrame:
    """One row per sale line, with the parent sale's timestamp."""
    sql = """
        SELECT si.product_id, si.quantity, si.line_total,
               s.sale_date
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
    """
    df = pd.read_sql(text(sql), get_engine())
    if not df.empty:
        df["sale_date"] = pd.to_datetime(df["sale_date"])
    return df


def load_daily_sales() -> pd.DataFrame:
    """Total revenue and units per calendar day."""
    sql = """
        SELECT DATE(s.sale_date) AS day,
               SUM(s.total_amount) AS revenue,
               COUNT(DISTINCT s.id) AS transactions
        FROM sales s
        GROUP BY DATE(s.sale_date)
        ORDER BY day
    """
    df = pd.read_sql(text(sql), get_engine())
    if not df.empty:
        df["day"] = pd.to_datetime(df["day"])
    return df
