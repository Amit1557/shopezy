from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, date
from ....database.database import get_db
from ....models.order import Order, OrderItem, OrderStatusHistory
from ....models.customer import Customer, CustomerAddress
from ....models.product import Product
from ....models.meesho import MeeshoFulfilment
from ....models.admin import Admin
from ....schemas.order import (
    OrderCreate,
    OrderOut,
    OrderPublic,
    OrderStatusUpdate,
    MeeshoFulfilmentUpdate,
    ReturnRequest,
)
from .deps import get_current_admin

router = APIRouter()


def generate_order_id(db: Session) -> str:
    today = datetime.now().strftime("%Y%m%d")
    count = db.query(Order).filter(Order.order_id.like(f"ORD-{today}-%")).count()
    return f"ORD-{today}-{count + 1:04d}"


@router.post("/place", response_model=dict)
def place_order(data: OrderCreate, db: Session = Depends(get_db)):
    # Find or create customer by mobile
    customer = db.query(Customer).filter(Customer.mobile == data.customer_mobile).first()
    if not customer:
        customer = Customer(
            name=data.customer_name,
            mobile=data.customer_mobile,
            alternate_mobile=data.customer_alternate_mobile,
        )
        db.add(customer)
        db.flush()
    else:
        customer.name = data.customer_name

    # Build order items and calculate total
    total = 0.0
    items_data = []
    for item in data.items:
        product = (
            db.query(Product)
            .filter(Product.id == item.product_id, Product.is_active == True)
            .first()
        )
        if not product:
            raise HTTPException(400, f"Product {item.product_id} not found or inactive")
        primary_img = next(
            (img.image_url for img in product.images if img.is_primary),
            product.images[0].image_url if product.images else None,
        )
        item_total = product.selling_price * item.quantity
        total += item_total
        items_data.append(
            {
                "product_id": product.id,
                "product_name": product.name,
                "product_image": primary_img,
                "selected_size": item.selected_size,
                "selected_color": item.selected_color,
                "quantity": item.quantity,
                "unit_price": product.selling_price,
                "total_price": item_total,
            }
        )
        product.total_orders += item.quantity

    order_id = generate_order_id(db)
    order = Order(
        order_id=order_id,
        customer_id=customer.id,
        status="NEW",
        payment_method="COD",
        total_amount=total,
        flat_number=data.flat_number,
        street=data.street,
        landmark=data.landmark,
        city=data.city,
        state=data.state,
        pincode=data.pincode,
        otp_verified=data.otp_verified if data.otp_verified is not None else True,
    )
    db.add(order)
    db.flush()

    for item_d in items_data:
        oi = OrderItem(order_id=order.id, **item_d)
        db.add(oi)

    history = OrderStatusHistory(
        order_id=order.id,
        status="NEW",
        note="Order placed successfully",
        changed_by="customer",
    )
    db.add(history)

    # Create empty meesho fulfilment record
    mf = MeeshoFulfilment(order_id=order.id)
    db.add(mf)

    db.commit()
    return {"order_id": order_id, "total_amount": total, "message": "Order placed successfully"}


def _clean_customer_history(history_list):
    res = []
    for h in (history_list or []):
        note = (h.note or "").replace("Meesho", "Warehouse").replace("meesho", "warehouse")
        status = h.status
        res.append({
            "id": h.id,
            "status": status,
            "note": note,
            "changed_by": "Fulfillment Team" if "admin" in (h.changed_by or "") else (h.changed_by or "system"),
            "created_at": h.created_at,
        })
    return res


@router.get("/track")
def track_order(order_id: str, mobile: str, db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.items),
            joinedload(Order.status_history),
            joinedload(Order.meesho_fulfilment),
        )
        .filter(Order.order_id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(404, "Order not found")
    if order.customer.mobile != mobile:
        raise HTTPException(403, "Mobile number does not match order")

    pub = OrderPublic(
        order_id=order.order_id,
        status=order.status,
        total_amount=order.total_amount,
        payment_method=order.payment_method,
        city=order.city,
        state=order.state,
        items=order.items,
        status_history=_clean_customer_history(order.status_history),
        return_reason=order.return_reason,
        return_requested_at=order.return_requested_at,
        created_at=order.created_at,
        tracking_info=order.meesho_fulfilment.tracking_info if order.meesho_fulfilment else None,
        expected_delivery_date=order.meesho_fulfilment.expected_delivery_date if order.meesho_fulfilment else None,
    )
    return pub


@router.get("/my-orders")
def get_customer_orders(mobile: str, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.mobile == mobile).first()
    if not customer:
        return []
    orders = (
        db.query(Order)
        .options(
            joinedload(Order.items),
            joinedload(Order.status_history),
            joinedload(Order.meesho_fulfilment),
        )
        .filter(Order.customer_id == customer.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    res = []
    for o in orders:
        pub = OrderPublic(
            order_id=o.order_id,
            status=o.status,
            total_amount=o.total_amount,
            payment_method=o.payment_method,
            city=o.city,
            state=o.state,
            items=o.items,
            status_history=_clean_customer_history(o.status_history),
            return_reason=o.return_reason,
            return_requested_at=o.return_requested_at,
            created_at=o.created_at,
            tracking_info=o.meesho_fulfilment.tracking_info if o.meesho_fulfilment else None,
            expected_delivery_date=o.meesho_fulfilment.expected_delivery_date if o.meesho_fulfilment else None,
        )
        res.append(pub)
    return res


@router.post("/request-return")
def request_order_return(data: ReturnRequest, db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(joinedload(Order.customer))
        .filter(Order.order_id == data.order_id)
        .first()
    )
    if not order:
        raise HTTPException(404, "Order not found")
    if order.customer.mobile != data.mobile:
        raise HTTPException(403, "Mobile number does not match order record")

    if order.status not in ["DELIVERED", "COMPLETED", "SHIPPED"]:
        raise HTTPException(
            400,
            f"Return can only be requested for delivered orders. Current status: {order.status}"
        )

    # Set return requested
    order.status = "RETURN_REQUESTED"
    order.return_reason = data.reason + (f" - {data.notes}" if data.notes else "")
    order.return_requested_at = datetime.now()

    history = OrderStatusHistory(
        order_id=order.id,
        status="RETURN_REQUESTED",
        note=f"Customer requested return: {order.return_reason}",
        changed_by="customer",
    )
    db.add(history)
    db.commit()

    return {
        "message": "Return request submitted successfully. Our team will verify and arrange pickup via Meesho.",
        "order_id": order.order_id,
        "status": order.status,
    }


# ADMIN endpoints
@router.get("/admin", response_model=dict)
def get_admin_orders(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    search: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    q = db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.items),
        joinedload(Order.status_history),
        joinedload(Order.meesho_fulfilment),
    )
    if status:
        q = q.filter(Order.status == status)
    if search:
        q = q.join(Customer).filter(
            or_(
                Order.order_id.ilike(f"%{search}%"),
                Customer.name.ilike(f"%{search}%"),
                Customer.mobile.ilike(f"%{search}%"),
            )
        )
    if date_from:
        q = q.filter(func.date(Order.created_at) >= date_from)
    if date_to:
        q = q.filter(func.date(Order.created_at) <= date_to)

    total = q.count()
    orders = q.order_by(Order.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return {
        "orders": [OrderOut.from_orm(o) for o in orders],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
    }


@router.get("/admin/{order_id_str}", response_model=OrderOut)
def get_admin_order(
    order_id_str: str,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    order = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.items),
            joinedload(Order.status_history),
            joinedload(Order.meesho_fulfilment),
        )
        .filter(Order.order_id == order_id_str)
        .first()
    )
    if not order:
        raise HTTPException(404, "Order not found")
    return order


@router.put("/admin/{order_id_str}/status")
def update_order_status(
    order_id_str: str,
    data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    order = db.query(Order).filter(Order.order_id == order_id_str).first()
    if not order:
        raise HTTPException(404, "Order not found")
    order.status = data.status
    history = OrderStatusHistory(
        order_id=order.id,
        status=data.status,
        note=data.note,
        changed_by=f"admin:{admin.email}",
    )
    db.add(history)
    db.commit()
    return {"message": "Status updated", "status": data.status}


@router.put("/admin/{order_id_str}/notes")
def update_admin_notes(
    order_id_str: str,
    notes: str,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    order = db.query(Order).filter(Order.order_id == order_id_str).first()
    if not order:
        raise HTTPException(404, "Order not found")
    order.admin_notes = notes
    db.commit()
    return {"message": "Notes updated"}


@router.put("/admin/{order_id_str}/meesho")
def update_meesho_fulfilment(
    order_id_str: str,
    data: MeeshoFulfilmentUpdate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    order = db.query(Order).filter(Order.order_id == order_id_str).first()
    if not order:
        raise HTTPException(404, "Order not found")
    mf = db.query(MeeshoFulfilment).filter(MeeshoFulfilment.order_id == order.id).first()
    if not mf:
        mf = MeeshoFulfilment(order_id=order.id)
        db.add(mf)
    for k, v in data.dict(exclude_none=True).items():
        setattr(mf, k, v)
    if data.is_ordered_on_meesho and order.status == "NEW":
        order.status = "MEESHO_ORDERED"
        history = OrderStatusHistory(
            order_id=order.id,
            status="MEESHO_ORDERED",
            note="Item packed and processed at central fulfillment facility",
            changed_by=f"admin:{admin.email}",
        )
        db.add(history)
    db.commit()
    return {"message": "Meesho fulfilment updated"}


class AdminReturnAction(BaseModel):
    action: str  # "MEESHO_SUBMITTED", "RETURNED", "REJECT"
    notes: Optional[str] = None
    meesho_return_id: Optional[str] = None


@router.put("/admin/{order_id_str}/return-action")
def admin_return_action(
    order_id_str: str,
    data: AdminReturnAction,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    order = (
        db.query(Order)
        .options(joinedload(Order.meesho_fulfilment))
        .filter(Order.order_id == order_id_str)
        .first()
    )
    if not order:
        raise HTTPException(404, "Order not found")

    new_status = order.status
    note_text = ""

    if data.action == "MEESHO_SUBMITTED":
        new_status = "RETURN_REQUESTED"
        note_text = f"Return filed on Meesho Supplier Panel. Return Ref: {data.meesho_return_id or 'Filed'}"
        if order.meesho_fulfilment and data.meesho_return_id:
            order.meesho_fulfilment.internal_notes = (
                (order.meesho_fulfilment.internal_notes or "") + f"\nMeesho Return Ref: {data.meesho_return_id}"
            ).strip()
    elif data.action == "RETURNED":
        new_status = "RETURNED"
        note_text = "Return pickup verified and product successfully returned to Meesho."
    elif data.action == "REJECT":
        new_status = "DELIVERED"
        note_text = f"Return request rejected: {data.notes or 'Does not meet return policy criteria'}"

    order.status = new_status
    if data.notes:
        order.return_admin_notes = data.notes

    history = OrderStatusHistory(
        order_id=order.id,
        status=new_status,
        note=note_text or data.notes or f"Admin updated return state: {data.action}",
        changed_by=f"admin:{admin.email}",
    )
    db.add(history)
    db.commit()
    return {"message": "Return status updated successfully", "status": new_status}

