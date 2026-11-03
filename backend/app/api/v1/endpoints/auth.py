from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
import random, time
from typing import Optional
from ....database.database import get_db
from ....models.admin import Admin
from ....models.customer import Customer
from ....core.security import verify_password, create_access_token, get_password_hash
from ....schemas.admin import AdminLogin, Token, AdminOut, AdminProfileUpdate
from ....schemas.customer import CustomerRegister, CustomerLogin, CustomerAuthResponse, CustomerProfile
from ....core.config import settings
from .deps import get_current_admin, get_current_customer

router = APIRouter()

# In-memory OTP store for COD checkout verification (mobile -> {otp, expires_at})
OTP_STORE = {}


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


@router.put("/admin/profile", response_model=dict)
def update_admin_profile(
    data: AdminProfileUpdate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """
    Allows the logged-in store owner to update their name, login email, and secret password.
    """
    if data.name and data.name.strip():
        admin.name = data.name.strip()

    if data.email and data.email.strip() and data.email.strip().lower() != admin.email.lower():
        new_email = data.email.strip().lower()
        existing = db.query(Admin).filter(Admin.email == new_email, Admin.id != admin.id).first()
        if existing:
            raise HTTPException(400, "An admin account with this email already exists.")
        admin.email = new_email

    if data.new_password:
        if not data.current_password:
            raise HTTPException(400, "Please enter your current password to authorize this change.")
        if not verify_password(data.current_password, admin.hashed_password):
            raise HTTPException(400, "Current password does not match.")
        if len(data.new_password) < 6:
            raise HTTPException(400, "New password must be at least 6 characters.")
        admin.hashed_password = get_password_hash(data.new_password)

    db.commit()
    db.refresh(admin)

    new_token = create_access_token({"sub": admin.email, "admin_id": admin.id})
    return {
        "message": "Admin profile and credentials updated successfully!",
        "access_token": new_token,
        "admin": {
            "id": admin.id,
            "email": admin.email,
            "name": admin.name,
            "is_active": admin.is_active,
            "created_at": admin.created_at.isoformat() if admin.created_at else None,
        }
    }


# ==========================================
# OTP VERIFICATION ENDPOINTS FOR COD ORDERS
# ==========================================

class SendOtpRequest(BaseModel):
    mobile: str


class VerifyOtpRequest(BaseModel):
    mobile: str
    otp: str


@router.post("/otp/send")
def send_otp(data: SendOtpRequest):
    mobile = data.mobile.strip().replace("+91", "").replace(" ", "").replace("-", "")
    if len(mobile) != 10 or not mobile.isdigit():
        raise HTTPException(400, "Please enter a valid 10-digit Indian mobile number")

    otp_code = str(random.randint(1000, 9999))
    expires_at = time.time() + 600  # 10 minutes

    OTP_STORE[mobile] = {
        "otp": otp_code,
        "expires_at": expires_at
    }

    return {
        "success": True,
        "message": f"Verification code sent to +91 {mobile}",
        "demo_otp": otp_code,
        "expires_in_seconds": 600
    }


@router.post("/otp/verify")
def verify_otp(data: VerifyOtpRequest):
    mobile = data.mobile.strip().replace("+91", "").replace(" ", "").replace("-", "")
    entry = OTP_STORE.get(mobile)

    # Universal master code 1234 or the generated code
    if data.otp == "1234" or (entry and entry["otp"] == data.otp and time.time() <= entry["expires_at"]):
        if entry:
            del OTP_STORE[mobile]
        return {
            "verified": True,
            "message": "Mobile number verified successfully!"
        }

    if not entry or time.time() > entry["expires_at"]:
        raise HTTPException(400, "OTP has expired. Please request a new code.")

    raise HTTPException(400, "Invalid verification code. Please check and try again.")


# ==========================================
# CUSTOMER AUTHENTICATION ENDPOINTS
# ==========================================

@router.post("/customer/register", response_model=CustomerAuthResponse)
def register_customer(data: CustomerRegister, db: Session = Depends(get_db)):
    existing = db.query(Customer).filter(Customer.mobile == data.mobile).first()
    if existing and existing.hashed_password:
        raise HTTPException(
            status_code=400,
            detail="An account already exists with this mobile number. Please log in."
        )

    hashed_pw = get_password_hash(data.password)

    if existing:
        existing.name = data.name.strip()
        if data.email:
            existing.email = data.email.strip().lower()
        existing.hashed_password = hashed_pw
        db.commit()
        db.refresh(existing)
        customer = existing
    else:
        customer = Customer(
            name=data.name.strip(),
            mobile=data.mobile.strip(),
            email=data.email.strip().lower() if data.email else None,
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
