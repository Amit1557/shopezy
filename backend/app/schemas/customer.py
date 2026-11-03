from pydantic import BaseModel, validator
from typing import Optional
import re

class CustomerRegister(BaseModel):
    name: str
    mobile: str
    email: Optional[str] = None
    password: str

    @validator("mobile")
    def validate_mobile(cls, v):
        clean = re.sub(r"[^\d]", "", v)
        if len(clean) == 10 and clean[0] in "6789":
            return clean
        if len(clean) == 12 and clean.startswith("91") and clean[2] in "6789":
            return clean[2:]
        raise ValueError("Please provide a valid 10-digit Indian mobile number")

    @validator("password")
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

class CustomerLogin(BaseModel):
    identifier: str  # mobile or email
    password: str

class CustomerProfile(BaseModel):
    id: int
    name: str
    mobile: str
    alternate_mobile: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True

class CustomerAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    customer: CustomerProfile

