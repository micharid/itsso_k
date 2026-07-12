from sqlalchemy import Column, Integer, String, Numeric
from database import Base

class PlatformAccount(Base):
    __tablename__ = "platform_accounts"

    id = Column(Integer, primary_key=True, index=True)
    platform_type = Column(String(50), nullable=False, index=True)
    alias_name = Column(String(100), nullable=False)
    api_key = Column(String(255))
    api_secret = Column(String(500))
    commission_rate = Column(Numeric(5, 2), default=0.00)
