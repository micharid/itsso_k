from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from database import Base
import sqlalchemy

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("platform_accounts.id"))
    market_order_no = Column(String(100), unique=True, index=True)
    order_status = Column(String(50), nullable=False, index=True)
    total_amount = Column(Numeric(12, 2), nullable=False)
    buyer_name = Column(String(100))
    ordered_at = Column(TIMESTAMP, index=True)

class OrderRawData(Base):
    __tablename__ = "order_raw_data"

    order_id = Column(Integer, ForeignKey("orders.id"), primary_key=True)
    # Use JSON type for general compatibility (like SQLite in testing),
    # but could be specifically JSONB if PostgreSQL is guaranteed.
    payload = Column(sqlalchemy.JSON().with_variant(JSONB, 'postgresql'))

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), index=True)
    market_product_id = Column(Integer, ForeignKey("market_products.id"))
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)

class B2BPurchaseOrder(Base):
    __tablename__ = "b2b_purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_item_id = Column(Integer, ForeignKey("order_items.id"), unique=True)
    b2b_order_no = Column(String(100), index=True)
    tracking_number = Column(String(100))
    status = Column(String(50))
