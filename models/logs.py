from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, TIMESTAMP, Text, Date, UniqueConstraint, BigInteger
from sqlalchemy.sql import func
from database import Base

class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(BigInteger, primary_key=True, index=True)
    job_type = Column(String(50), index=True)
    status = Column(String(20), index=True)
    error_message = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now(), index=True)

class DailySalesSummary(Base):
    __tablename__ = "daily_sales_summary"

    id = Column(Integer, primary_key=True, index=True)
    target_date = Column(Date, nullable=False)
    account_id = Column(Integer, ForeignKey("platform_accounts.id"))
    total_sales_amt = Column(Numeric(15, 2), default=0)
    total_cost_amt = Column(Numeric(15, 2), default=0)
    total_commission = Column(Numeric(15, 2), default=0)
    order_count = Column(Integer, default=0)

    __table_args__ = (
        UniqueConstraint('target_date', 'account_id', name='uq_target_date_account_id'),
    )
