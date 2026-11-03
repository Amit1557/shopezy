from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ....database.database import get_db
from ....models.admin import Admin
from ....models.customer import Customer
from ....core.security import verify_password, create_access_token, get_password_hash
from ....schemas.admin import AdminLogin, Token, AdminOut
from ....schemas.customer import CustomerRegister, CustomerLogin, CustomerAuthResponse, CustomerProfile
from ....core.config import settings
from .deps import get_current_admin, get_current_customer

router = APIRouter()


@router.post("/login", response_model=Token)
def admin_login(credentials: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == credentials.email).first()
    if not admin or not verify_password(credentials.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    if not admin.is_active:
        raise HTTPException(status_code=400, detail="Admin account is disabled")
    token = create_access_token({"sub": admin.email, "admin_id": admin.id})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=AdminOut)
def get_current_admin_info(admin: Admin = Depends(get_current_admin)):
    return admin


# ==========================================
# CUSTOMER AUTHENTICATION ENDPOINTS
# ==========================================

@router.post("/customer/register", response_model=CustomerAuthResponse)
def register_customer(data: CustomerRegister, db: Session = Depends(get_db)):
    # Check if mobile exists
    existing = db.query(Customer).filter(Customer.mobile == data.mobile).first()
    if existing and existing.hashed_password:
        raise HTTPException(
            status_code=400,
            detail="An account already exists with this mobile number. Please log in."
        )

    hashed_pw = get_password_hash(data.password)

    if existing:
        existing.name = data.name
        if data.email:
            existing.email = data.email
        existing.hashed_password = hashed_pw
        customer = existing
    else:
        customer = Customer(
            name=data.name,
            mobile=data.mobile,
            email=data.email,
            hashed_password=hashed_pw
        )
        db.add(customer)

    db.commit()
    db.refresh(customer)

    token = create_access_token({
        "sub": customer.mobile,
        "customer_id": customer.id,
        "role": "customer"
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "customer": CustomerProfile.from_orm(customer)
    }


@router.post("/customer/login", response_model=CustomerAuthResponse)
def login_customer(data: CustomerLogin, db: Session = Depends(get_db)):
    ident = data.identifier.strip()
    customer = db.query(Customer).filter(
        (Customer.mobile == ident) | (Customer.email == ident)
    ).first()

    if not customer or not customer.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with this mobile or email. Please sign up first."
        )

    if not verify_password(data.password, customer.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again."
        )

    token = create_access_token({
        "sub": customer.mobile,
        "customer_id": customer.id,
        "role": "customer"
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "customer": CustomerProfile.from_orm(customer)
    }


@router.get("/customer/me", response_model=CustomerProfile)
def get_customer_profile(customer: Customer = Depends(get_current_customer)):
    return CustomerProfile.from_orm(customer)

