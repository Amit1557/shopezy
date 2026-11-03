import sys
import os

# Ensure UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)

def run_tests():
    print("=== STARTING END-TO-END SYSTEM TESTS ===\n")
    
    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200
    print("PASS: Health check passed.")

    # 2. Public products listing
    res = client.get("/api/v1/products/public")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] > 0
    print(f"PASS: Public products listing returned {data['total']} products.")
    first_product = data["products"][0]
    first_slug = first_product["slug"]

    # 3. Product detail by slug
    res = client.get(f"/api/v1/products/public/{first_slug}")
    assert res.status_code == 200
    detail = res.json()
    assert detail["id"] == first_product["id"]
    # Verify purchase_cost and meesho_link are NOT exposed publicly
    assert "purchase_cost" not in detail
    assert "meesho_link" not in detail
    print(f"PASS: Public product detail verified. Supplier costs/links are strictly hidden.")

    # 4. Public Categories
    res = client.get("/api/v1/categories/")
    assert res.status_code == 200
    categories = res.json()
    assert len(categories) > 0
    print(f"PASS: Categories listed: {len(categories)} categories.")

    # 5. Place a Cash on Delivery (COD) Order
    order_payload = {
        "customer_name": "Rohan Sharma",
        "customer_mobile": "9876543210",
        "customer_alternate_mobile": "9876543211",
        "flat_number": "A-402, Sunshine Apartments",
        "street": "Linking Road, Bandra West",
        "landmark": "Opposite National Park",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400050",
        "items": [
            {
                "product_id": first_product["id"],
                "selected_size": "L",
                "selected_color": "Navy Blue",
                "quantity": 2
            }
        ]
    }
    res = client.post("/api/v1/orders/place", json=order_payload)
    assert res.status_code == 200
    order_res = res.json()
    order_id = order_res["order_id"]
    expected_amount = first_product["selling_price"] * 2
    assert order_res["total_amount"] == expected_amount
    print(f"PASS: Placed COD order successfully: {order_id} (Total: Rs. {order_res['total_amount']})")

    # 6. Customer order tracking
    res = client.get(f"/api/v1/orders/track?order_id={order_id}&mobile=9876543210")
    assert res.status_code == 200
    track_data = res.json()
    assert track_data["order_id"] == order_id
    assert track_data["status"] == "NEW"
    print(f"PASS: Customer order tracking works with verified mobile.")

    # Test tracking with wrong mobile (should fail with 403)
    res = client.get(f"/api/v1/orders/track?order_id={order_id}&mobile=9999999999")
    assert res.status_code == 403
    print("PASS: Order tracking rejects unauthorized mobile numbers (403 Forbidden).")

    # 7. Customer My Orders lookup
    res = client.get("/api/v1/orders/my-orders?mobile=9876543210")
    assert res.status_code == 200
    cust_orders = res.json()
    assert any(o["order_id"] == order_id for o in cust_orders)
    print(f"PASS: Customer my-orders list returned {len(cust_orders)} order(s).")

    # 8. Unauthorized Admin Access check (must fail with 401/403)
    res = client.get("/api/v1/orders/admin")
    assert res.status_code in [401, 403]
    print("PASS: Unauthorized access to admin order API blocked.")

    # 9. Admin Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": settings.ADMIN_EMAIL,
        "password": settings.ADMIN_PASSWORD
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {token}"}
    print("PASS: Admin login successful with JWT token issued.")

    # 10. Admin view order details
    res = client.get(f"/api/v1/orders/admin/{order_id}", headers=admin_headers)
    assert res.status_code == 200
    admin_order = res.json()
    assert admin_order["customer"]["name"] == "Rohan Sharma"
    assert len(admin_order["items"]) == 1
    assert admin_order["items"][0]["selected_size"] == "L"
    print(f"PASS: Admin retrieved complete customer delivery details for {order_id}.")

    # 11. Meesho Sourcing / Manual Fulfilment Workflow
    meesho_payload = {
        "meesho_order_id": "MSHO-9948271",
        "meesho_product_link": "https://meesho.com/s/p/cotton-shirt-reseller",
        "actual_purchase_cost": 270.0 * 2,  # Rs. 540 total cost
        "order_placed_date": "2026-11-03T00:00:00Z",
        "tracking_info": "Delhivery AWB 8492048102",
        "is_ordered_on_meesho": True,
        "internal_notes": "Sourced via Supplier XYZ on Meesho, reseller delivery configured."
    }
    res = client.put(f"/api/v1/orders/admin/{order_id}/meesho", json=meesho_payload, headers=admin_headers)
    assert res.status_code == 200
    print("PASS: 'MARK AS ORDERED ON MEESHO' executed; sourcing costs & Meesho ID saved.")

    # Verify status changed to MEESHO_ORDERED
    res = client.get(f"/api/v1/orders/admin/{order_id}", headers=admin_headers)
    assert res.json()["status"] == "MEESHO_ORDERED"
    print("PASS: Order status automatically transitioned to MEESHO_ORDERED.")

    # 12. Advance status to SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED
    client.put(f"/api/v1/orders/admin/{order_id}/status", json={"status": "SHIPPED", "note": "Handed to courier"}, headers=admin_headers)
    client.put(f"/api/v1/orders/admin/{order_id}/status", json={"status": "DELIVERED", "note": "Cash collected upon delivery"}, headers=admin_headers)

    res = client.get(f"/api/v1/orders/admin/{order_id}", headers=admin_headers)
    updated_order = res.json()
    assert updated_order["status"] == "DELIVERED"
    assert len(updated_order["status_history"]) >= 4
    print("PASS: Order transitioned to DELIVERED with audit history preserved.")

    # 13. Verify Profit Calculations
    res = client.get("/api/v1/analytics/dashboard", headers=admin_headers)
    assert res.status_code == 200
    analytics = res.json()
    expected_profit = expected_amount - 540.0
    assert analytics["total_actual_profit"] >= expected_profit
    print(f"PASS: Profit calculation verified: Realized Profit is Rs. {analytics['total_actual_profit']} (Expected profit from order was Rs. {expected_profit}).")

    # 14. Admin Product Creation
    new_prod_payload = {
        "name": "Men Slim Fit Washed Denim Jacket",
        "description": "High quality denim jacket with brass buttons",
        "category_id": categories[0]["id"],
        "purchase_cost": 450.0,
        "selling_price": 899.0,
        "original_price": 1799.0,
        "discount_percentage": 50.0,
        "meesho_link": "https://meesho.com/s/p/denim-jacket",
        "is_active": True,
        "is_featured": True,
        "cod_available": True,
        "stock_quantity": 25,
        "variants": [
            {"variant_type": "size", "value": "M", "is_available": True},
            {"variant_type": "size", "value": "L", "is_available": True}
        ]
    }
    res = client.post("/api/v1/products/admin", json=new_prod_payload, headers=admin_headers)
    assert res.status_code == 200
    created_prod = res.json()
    print(f"PASS: Admin created new sourced product: '{created_prod['name']}' (ID: {created_prod['id']}).")

    # 15. Verify new product is instantly visible on public storefront
    res = client.get(f"/api/v1/products/public/{created_prod['slug']}")
    assert res.status_code == 200
    print("PASS: New product is immediately available on public storefront.")

    # 16. Admin Customer List
    res = client.get("/api/v1/analytics/customers", headers=admin_headers)
    assert res.status_code == 200
    customers_data = res.json()
    assert any(c["mobile"] == "9876543210" for c in customers_data["customers"])
    print("PASS: Customer record automatically generated and listed in admin customer database.")

    print("\n=== ALL 16 END-TO-END TESTS COMPLETED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()
