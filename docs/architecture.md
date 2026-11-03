# System Architecture – COD E-Commerce Reselling Platform

## Overview
This platform is a specialized, production-oriented Cash on Delivery (COD) e-commerce reselling solution designed for an independent business model where:
1. Sourcing is conducted manually via **Meesho** (or any wholesale marketplace).
2. The customer storefront operates as a distinct, standalone e-commerce brand ("ShopEzy").
3. Orders are received exclusively through Cash on Delivery without requiring mandatory account creation or third-party payment gateways.
4. The admin seller dashboard facilitates manual fulfillment into Meesho, tracking actual acquisition costs, courier details, and accurate realized profits.

```
+-------------------------------------------------------------------------+
|                           CUSTOMER STOREFRONT                           |
|  - Modern Indian E-Commerce UX (Meesho inspired visual language)        |
|  - Category Navigation, Product Catalog, Search & Dynamic Filtering     |
|  - Persistent Cart with Variant Selection (Size / Color)                |
|  - Cash on Delivery (COD) Seamless Checkout                             |
|  - Order Confirmation & Secure Phone/ID Parcel Tracking                 |
+------------------------------------+------------------------------------+
                                     |
                         HTTP / REST API (FastAPI)
                                     |
+------------------------------------+------------------------------------+
|                         BACKEND API & SERVICES                          |
|  - Public Catalog & Order Placement Endpoints                           |
|  - JWT Authenticated Admin API                                          |
|  - Order State Machine & Audit History                                  |
|  - Meesho Reseller Fulfilment Workflow Engine                           |
|  - Realized Profit & Expected Margin Calculations                       |
+------------------------------------+------------------------------------+
                                     |
                         SQLAlchemy ORM (SQLite / PostgreSQL)
                                     |
+------------------------------------+------------------------------------+
|                          DATABASE LAYER                                 |
|  - Admins, Products, Images, Variants, Categories                       |
|  - Customers, Addresses, Orders, Order Items (Price Snapshots)          |
|  - Meesho Fulfilment, Order Status History, COD Settlements             |
+-------------------------------------------------------------------------+
```

## Security & Architectural Constraints
- **Separation of Concerns**: Sourcing URLs and internal purchase costs are completely hidden from customer-facing APIs.
- **Price Immutability**: Historical order item records capture exact price, product name, and variants at the moment of order placement.
- **Zero API Dependency on Meesho**: Manual fulfillment workflow guarantees resilience against scraper breakdowns and unauthorized API changes.

