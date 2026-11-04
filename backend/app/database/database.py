from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from ..core.config import settings

db_url = settings.DATABASE_URL
# Render and Supabase provide postgres:// which SQLAlchemy 2.0 requires as postgresql://
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

is_sqlite = "sqlite" in db_url

engine_kwargs = {
    "connect_args": {"check_same_thread": False} if is_sqlite else {},
}

if not is_sqlite:
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_recycle": 280,
        "pool_size": 10,
        "max_overflow": 20,
    })

engine = create_engine(db_url, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
