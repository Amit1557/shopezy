from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ....database.database import get_db
from ....models.category import Category
from ....models.admin import Admin
from ....schemas.category import CategoryCreate, CategoryUpdate, CategoryOut
from .deps import get_current_admin
import re

router = APIRouter()


def make_slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


@router.get("/", response_model=List[CategoryOut])
def get_categories(active_only: bool = True, db: Session = Depends(get_db)):
    q = db.query(Category)
    if active_only:
        q = q.filter(Category.is_active == True)
    return q.order_by(Category.sort_order).all()


@router.post("/", response_model=CategoryOut)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    slug = data.slug or make_slug(data.name)
    existing = db.query(Category).filter(Category.slug == slug).first()
    if existing:
        slug = f"{slug}-{db.query(Category).count()}"
    cat = Category(
        name=data.name,
        slug=slug,
        description=data.description,
        image_url=data.image_url,
        icon=data.icon,
        is_active=data.is_active,
        sort_order=data.sort_order,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/{cat_id}", response_model=CategoryOut)
def update_category(
    cat_id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(404, "Category not found")
    for k, v in data.dict(exclude_none=True).items():
        setattr(cat, k, v)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{cat_id}")
def delete_category(
    cat_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(404, "Category not found")
    db.delete(cat)
    db.commit()
    return {"message": "Category deleted"}
