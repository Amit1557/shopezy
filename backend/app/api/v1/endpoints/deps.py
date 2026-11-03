from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from ....database.database import get_db
from ....models.admin import Admin
from ....models.customer import Customer
from ....core.security import decode_token

security = HTTPBearer(auto_error=False)


def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Admin:
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    admin = db.query(Admin).filter(Admin.email == payload.get("sub")).first()
    if not admin or not admin.is_active:
        raise HTTPException(status_code=401, detail="Admin not found or inactive")
    return admin


def get_current_customer(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Customer:
    if not credentials:
        raise HTTPException(status_code=401, detail="Please login to access your account")
    token = credentials.credentials
    payload = decode_token(token)
    if not payload or payload.get("role") != "customer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired customer session",
        )
    customer = db.query(Customer).filter(Customer.id == payload.get("customer_id")).first()
    if not customer:
        raise HTTPException(status_code=401, detail="Customer not found")
    return customer
