from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from pydantic import BaseModel
import random, time, re
from typing import Optional
from ....database.database import get_db
from ....models.admin import Admin
from ....models.customer import Customer
from ....core.security import verify_password, create_access_token, get_password_hash
from ....schemas.admin import AdminLogin, Token, AdminOut, AdminProfileUpdate
from ....schemas.customer import CustomerRegister, CustomerLogin, CustomerAuthResponse, CustomerProfile
from ....core.config import settings
from ....services.sms_service import send_sms_otp
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
async def send_otp(data: SendOtpRequest):
    mobile = data.mobile.strip().replace("+91", "").replace(" ", "").replace("-", "")
    if len(mobile) != 10 or not mobile.isdigit():
        raise HTTPException(400, "Please enter a valid 10-digit Indian mobile number")

    otp_code = str(random.randint(1000, 9999))
    expires_at = time.time() + 600  # 10 minutes

    OTP_STORE[mobile] = {
        "otp": otp_code,
        "expires_at": expires_at
    }

    # Attempt to dispatch real SMS via SMS gateway
    sms_result = await send_sms_otp(mobile, otp_code)

    response_payload = {
        "success": True,
        "message": f"Verification code sent to +91 {mobile}",
        "expires_in_seconds": 600,
        "is_live_sms": bool(sms_result.get("sent"))
    }

    return response_payload


@router.post("/otp/verify")
def verify_otp(data: VerifyOtpRequest):
    mobile = data.mobile.strip().replace("+91", "").replace(" ", "").replace("-", "")
    entry = OTP_STORE.get(mobile)

    if entry and entry["otp"] == data.otp and time.time() <= entry["expires_at"]:
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

def _clean_customer_phone(raw: str) -> str:
    digits = re.sub(r'[^0-9]', '', (raw or "").strip())
    if len(digits) == 12 and digits.startswith('91'):
        return digits[2:]
    if len(digits) == 11 and digits.startswith('0'):
        return digits[1:]
    return digits[-10:] if len(digits) >= 10 else digits


@router.post("/customer/register", response_model=CustomerAuthResponse)
def register_customer(data: CustomerRegister, db: Session = Depends(get_db)):
    clean_mob = _clean_customer_phone(data.mobile)
    if len(clean_mob) != 10:
        raise HTTPException(400, "Please enter a valid 10-digit Indian mobile number")

    clean_email = data.email.strip() if data.email and data.email.strip() else None

    # Find existing customer by mobile or email
    existing = db.query(Customer).filter(
        (Customer.mobile == clean_mob) |
        (Customer.mobile == data.mobile.strip()) |
        (Customer.mobile == "+91" + clean_mob)
    ).first()

    hashed_pw = get_password_hash(data.password)

    if existing and existing.hashed_password:
        # Check if password matches - if so, smoothly log them in!
        if verify_password(data.password, existing.hashed_password):
            token = create_access_token({
                "sub": existing.mobile,
                "customer_id": existing.id,
                "role": "customer"
            })
            return {
                "access_token": token,
                "token_type": "bearer",
                "customer": CustomerProfile.from_orm(existing)
            }
        raise HTTPException(
            status_code=400,
            detail="An account already exists with this mobile number. Please go to 'Sign In / Login' tab and enter your password."
        )

    if existing:
        existing.name = data.name.strip()
        existing.mobile = clean_mob
        if clean_email:
            existing.email = clean_email
        existing.hashed_password = hashed_pw
        db.commit()
        db.refresh(existing)
        customer = existing
    else:
        customer = Customer(
            name=data.name.strip(),
            mobile=clean_mob,
            email=clean_email,
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
    clean_mob = _clean_customer_phone(ident)

    # Search by cleaned mobile, raw identifier, +91 format, or strict case-sensitive email
    filters = [
        Customer.mobile == ident,
        Customer.email == ident
    ]
    if len(clean_mob) == 10:
        filters.extend([
            Customer.mobile == clean_mob,
            Customer.mobile == "+91" + clean_mob
        ])

    customer = db.query(Customer).filter(or_(*filters)).first()

    if not customer or not customer.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with this mobile or email. Please click 'New Customer? Sign Up' to register."
        )

    if not verify_password(data.password, customer.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please verify your password or sign up if new."
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
