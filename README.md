# ShopEzy – Cash on Delivery E-Commerce Reselling Platform

A complete, production-ready Cash on Delivery (COD) e-commerce reselling platform designed for independent online entrepreneurs using Meesho as their sourcing and manual fulfillment provider.

---

## 🌟 Key Highlights

- **Meesho-Inspired Familiar UX**: Premium mobile-first shopping experience built for Indian buyers with prominent search, category navigation, discount badges, and responsive layouts.
- **Pure Cash on Delivery (COD)**: No payment gateways needed. Zero cart abandonment from complex payment flows.
- **Meesho Reseller Workflow**: Dedicated seller dashboard with a **"MARK AS ORDERED ON MEESHO"** feature, capturing purchase costs, Meesho Order IDs, courier tracking numbers, and delivery dates.
- **True Profit & Margin Accounting**: Real-time margin calculation:
  $$\text{Expected Margin} = \text{Selling Price} - \text{Estimated Product Cost}$$
  $$\text{Actual Profit} = \text{Delivered Collected Revenue} - \text{Actual Meesho Cost} - \text{Expenses}$$
- **Zero Customer Leakage**: Confidential Meesho links, internal costs, and supplier notes are strictly hidden from customer APIs.
- **Order Tracking & Customer Database**: Customers can look up live parcel status with their Order ID and registered mobile number without mandatory account creation.

---

## 📂 Project Structure

```
my website/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/  # Auth, Products, Orders, Categories, Analytics
│   │   ├── core/              # Config, Security, JWT
│   │   ├── database/          # SQLAlchemy engine & session
│   │   ├── models/            # Relational database models
│   │   ├── schemas/           # Pydantic input/output schemas
│   │   └── utils/             # Database initialization & sample seeder
│   ├── run.py                 # Uvicorn server launcher
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        # UI widgets, layout headers, customer cards
│   │   ├── context/           # CartContext, AuthContext
│   │   ├── pages/
│   │   │   ├── customer/      # Home, Catalog, Detail, Cart, Checkout, Track
│   │   │   └── admin/         # Login, Dashboard, Orders, Products, Categories, Analytics
│   │   └── services/          # Axios API service clients
│   ├── package.json
│   └── vite.config.js
└── docs/                      # Architecture, DB Schema & Setup guides
```

---

## 🚀 Quick Start

### 1. Run Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python run.py
```
*API will run at http://localhost:8000 (Swagger docs at http://localhost:8000/docs).*

### 2. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
*Open http://localhost:5173 to access the customer store, or http://localhost:5173/admin/login for the seller panel.*

**Default Admin Credentials:**
- Email: `admin@shopezy.com`
- Password: `admin123`

