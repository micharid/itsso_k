from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
import models # imports all models from models/__init__.py

def test_models_initialization():
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Just asserting the session works and models can be queried without error (even if empty)
    assert session.query(models.User).count() == 0
    assert session.query(models.Order).count() == 0
    assert session.query(models.OrderRawData).count() == 0

    session.close()
