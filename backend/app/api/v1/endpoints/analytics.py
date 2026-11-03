from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, case, or_
from datetime import datetime, date, timedelta
from typing import Optional, List
from ....database.database import get_db
from ....models.order import Order, OrderItem
from ....models.customer import Customer
from ....models.product import Product
from ....models.meesho import MeeshoFulfilment
from ....models.expense import Expense
from ....models.admin import Admin
from .deps import get_current_admin

router = APIRouter()

@router.get("/dashboard")
def get_dashboard_stats(
    period: str = "all",  # today, 7days, 30days, all
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    now = datetime.utcnow()
    if period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "7days":
        start = now - timedelta(days=7)
    elif period == "30days":
        start = now - timedelta(days=30)
    else:
        start = None
    
    if date_from:
        start = datetime.combine(date_from, datetime.min.time())
    end = datetime.combine(date_to, datetime.max.time()) if date_to else None
    
    def apply_date_filter(q):
        if start:
            q = q.filter(Order.created_at >= start)
        if end:
            q = q.filter(Order.created_at <= end)
        return q
    
    base_q = apply_date_filter(db.query(Order))
    
    total_orders = base_q.count()
    new_orders = base_q.filter(Order.status == "NEW").count()
    confirmed = base_q.filter(Order.status == "CONFIRMED").count()
    meesho_ordered = base_q.filter(Order.status == "MEESHO_ORDERED").count()
    shipped = base_q.filter(Order.status == "SHIPPED").count()
    out_for_delivery = base_q.filter(Order.status == "OUT_FOR_DELIVERY").count()
    delivered = base_q.filter(Order.status.in_(["DELIVERED", "COMPLETED"])).count()
    cancelled = base_q.filter(Order.status == "CANCELLED").count()
    returned = base_q.filter(Order.status.in_(["RETURN_REQUESTED", "RETURNED"])).count()
    
    total_sales_q = apply_date_filter(db.query(func.sum(Order.total_amount)).filter(
        Order.status.notin_(["CANCELLED", "RETURNED"])
    ))
    total_sales = total_sales_q.scalar() or 0.0
    
    delivered_orders = apply_date_filter(
        db.query(Order).filter(Order.status.in_(["DELIVERED", "COMPLETED"]))
    ).all()
    
    total_actual_profit = 0.0
    total_expected_margin = 0.0
    
    for order in delivered_orders:
        mf = db.query(MeeshoFulfilment).filter(MeeshoFulfilment.order_id == order.id).first()
        if mf and mf.actual_purchase_cost is not None:
            actual_profit = order.total_amount - mf.actual_purchase_cost
            total_actual_profit += actual_profit
        
        for item in order.items:
            if item.product_id:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    margin = (item.unit_price - product.purchase_cost) * item.quantity
                    total_expected_margin += margin
    
    total_customers = db.query(Customer).count()
    
    return {
        "total_orders": total_orders,
        "new_orders": new_orders,
        "confirmed": confirmed,
        "meesho_ordered": meesho_ordered,
        "shipped": shipped,
        "out_for_delivery": out_for_delivery,
        "delivered": delivered,
        "cancelled": cancelled,
        "returned": returned,
        "total_customers": total_customers,
        "total_sales": round(total_sales, 2),
        "total_expected_margin": round(total_expected_margin, 2),
        "total_actual_profit": round(total_actual_profit, 2),
    }

@router.get("/profit-report")
def get_profit_report(
    period: str = "30days",
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    now = datetime.utcnow()
    if period == "7days":
        start = now - timedelta(days=7)
    elif period == "30days":
        start = now - timedelta(days=30)
    else:
        start = None
    
    q = db.query(Order)
    if start:
        q = q.filter(Order.created_at >= start)
    
    orders = q.order_by(Order.created_at.desc()).all()
    report = []
    for order in orders:
        mf = db.query(MeeshoFulfilment).filter(MeeshoFulfilment.order_id == order.id).first()
        purchase_cost = mf.actual_purchase_cost if mf else None
        actual_profit = None
        if purchase_cost is not None:
            actual_profit = order.total_amount - purchase_cost
        
        report.append({
            "order_id": order.order_id,
            "status": order.status,
            "selling_price": order.total_amount,
            "purchase_cost": purchase_cost,
            "actual_profit": actual_profit,
            "is_meesho_ordered": mf.is_ordered_on_meesho if mf else False,
            "created_at": order.created_at
        })
    
    return report

@router.get("/customers")
def get_customers(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    q = db.query(Customer)
    if search:
        s = f"%{search.strip()}%"
        q = q.filter(or_(
            Customer.name.ilike(s),
            Customer.mobile.ilike(s),
            Customer.email.ilike(s)
        ))
    total = q.count()
    customers = q.order_by(Customer.created_at.desc()).offset((page-1)*limit).limit(limit).all()
    
    # Summary stats across all customers
    all_customers = db.query(Customer).all()
    total_customers_count = len(all_customers)
    total_registered_count = sum(1 for c in all_customers if c.hashed_password)
    repeat_customers_count = 0
    total_customer_revenue = 0.0

    for c in all_customers:
        cust_orders = db.query(Order).filter(Order.customer_id == c.id).all()
        if len(cust_orders) >= 2:
            repeat_customers_count += 1
        total_customer_revenue += sum(o.total_amount for o in cust_orders if o.status not in ["CANCELLED", "RETURNED"])

    result = []
    for c in customers:
        orders = db.query(Order).filter(Order.customer_id == c.id).order_by(Order.created_at.desc()).all()
        total_orders = len(orders)
        total_value = sum(o.total_amount for o in orders if o.status not in ["CANCELLED", "RETURNED"])
        delivered = sum(1 for o in orders if o.status in ["DELIVERED", "COMPLETED"])
        cancelled = sum(1 for o in orders if o.status == "CANCELLED")
        returned = sum(1 for o in orders if o.status in ["RETURN_REQUESTED", "RETURNED"])
        last_order = orders[0].created_at if orders else None

        result.append({
            "id": c.id,
            "name": c.name,
            "mobile": c.mobile,
            "email": c.email,
            "has_account": bool(c.hashed_password),
            "total_orders": total_orders,
            "delivered_orders": delivered,
            "cancelled_orders": cancelled,
            "returned_orders": returned,
            "total_value": round(total_value, 2),
            "last_order_date": last_order,
            "created_at": c.created_at
        })
    
    return {
        "customers": result,
        "total": total,
        "page": page,
        "pages": (total+limit-1)//limit if limit > 0 else 1,
        "stats": {
            "total_customers": total_customers_count,
            "total_registered": total_registered_count,
            "repeat_customers": repeat_customers_count,
            "total_revenue": round(total_customer_revenue, 2)
        }
    }

@router.get("/customers/{customer_id}")
def get_customer_detail(
    customer_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(404, "Customer not found")

    orders = db.query(Order).filter(Order.customer_id == customer.id).order_by(Order.created_at.desc()).all()
    
    total_orders = len(orders)
    total_spent = sum(o.total_amount for o in orders if o.status not in ["CANCELLED", "RETURNED"])
    delivered_count = sum(1 for o in orders if o.status in ["DELIVERED", "COMPLETED"])
    cancelled_count = sum(1 for o in orders if o.status == "CANCELLED")
    returned_count = sum(1 for o in orders if o.status in ["RETURN_REQUESTED", "RETURNED"])

    # Collect unique addresses
    addresses = []
    for o in orders:
        addr = f"{o.flat_number}, {o.street}, {o.city}, {o.state} - {o.pincode}"
        if addr not in addresses:
            addresses.append(addr)

    detailed_orders = []
    for o in orders:
        items = [
            {
                "id": it.id,
                "product_id": it.product_id,
                "product_name": it.product_name,
                "product_image": it.product_image,
                "selected_size": it.selected_size,
                "selected_color": it.selected_color,
                "quantity": it.quantity,
                "unit_price": it.unit_price,
                "total_price": it.total_price
            }
            for it in o.items
        ]
        detailed_orders.append({
            "order_id": o.order_id,
            "status": o.status,
            "total_amount": o.total_amount,
            "delivery_address": f"{o.flat_number}, {o.street}, {o.city}, {o.state} - {o.pincode}",
            "return_reason": o.return_reason,
            "return_requested_at": o.return_requested_at,
            "created_at": o.created_at,
            "items": items
        })

    return {
        "id": customer.id,
        "name": customer.name,
        "mobile": customer.mobile,
        "alternate_mobile": customer.alternate_mobile,
        "email": customer.email,
        "has_account": bool(customer.hashed_password),
        "created_at": customer.created_at,
        "saved_addresses": addresses,
        "stats": {
            "total_orders": total_orders,
            "delivered_count": delivered_count,
            "cancelled_count": cancelled_count,
            "returned_count": returned_count,
            "lifetime_spent": round(total_spent, 2),
            "average_order_value": round(total_spent / total_orders, 2) if total_orders > 0 else 0.0
        },
        "orders": detailed_orders
    }
