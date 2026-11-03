# Setup & Deployment Guide

This guide covers running the application locally for development and deploying to production using free-tier friendly services.

---

## 1. Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- Git

### Backend Setup
1. Open a terminal in the project directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables in `backend/.env`:
   ```ini
   DATABASE_URL=sqlite:///./cod_ecommerce.db
   SECRET_KEY=your-secure-secret-key-12345
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ADMIN_EMAIL=admin@shopezy.com
   ADMIN_PASSWORD=admin123
   CORS_ORIGINS=http://localhost:5173
   ```
5. Start the backend API server:
   ```bash
   python run.py
   ```
   The backend will run on `http://localhost:8000`.
   - Interactive Swagger API docs: `http://localhost:8000/docs`
   - Default categories and admin account will be automatically created on startup.

### Frontend Setup
1. Open a second terminal:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the application in your browser:
   - **Customer Storefront**: `http://localhost:5173`
   - **Admin Seller Panel**: `http://localhost:5173/admin/login`
     - Login: `admin@shopezy.com`
     - Password: `admin123`

---

## 2. Production Deployment

### Database: Supabase PostgreSQL (Free Tier)
1. Create a free account at [Supabase](https://supabase.com).
2. Create a new project and navigate to **Project Settings -> Database**.
3. Copy the **Connection URI** (e.g. `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`).
4. Set this as `DATABASE_URL` in your backend deployment.

### Backend: Render or Railway (Free / Low Cost)
1. Push your repository to GitHub.
2. Link your repository in [Render](https://render.com) or [Railway](https://railway.app).
3. Set the build & start commands:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Provide the production environment variables:
   - `DATABASE_URL`
   - `SECRET_KEY`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `CORS_ORIGINS=https://your-frontend-domain.vercel.app`

### Frontend: Vercel (Free Tier)
1. Connect your repository to [Vercel](https://vercel.com).
2. Set root directory to `frontend`.
3. Set environment variable:
   - `VITE_API_URL=https://your-backend.onrender.com/api/v1`
4. Deploy with one click.

