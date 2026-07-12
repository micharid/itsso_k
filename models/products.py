from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Numeric, TIMESTAMP
from sqlalchemy.orm import relationship
from database import Base

class SourceProduct(Base):
    __tablename__ = "source_products"

    id = Column(Integer, primary_key=True, index=True)
    b2b_product_code = Column(String(100), unique=True, index=True)
    name = Column(String(255), nullable=False)
    cost_price = Column(Numeric(12, 2), nullable=False)
    stock_quantity = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

class MarketProduct(Base):
    __tablename__ = "market_products"

    id = Column(Integer, primary_key=True, index=True)
    source_product_id = Column(Integer, ForeignKey("source_products.id"), index=True)
    account_id = Column(Integer, ForeignKey("platform_accounts.id"), index=True)
    market_item_id = Column(String(100), index=True)
    selling_price = Column(Numeric(12, 2), nullable=False)
    status = Column(String(50), nullable=False)
    last_synced_at = Column(TIMESTAMP)
