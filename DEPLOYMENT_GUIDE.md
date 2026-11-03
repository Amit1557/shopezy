# 🚀 Step-by-Step Production Deployment Guide (100% FREE)

This guide walks you through deploying your **ShopEzy COD E-Commerce Reselling Platform** to the cloud so anyone with a smartphone or laptop in India can visit your store, browse products, place Cash on Delivery orders, and request returns!

---

## 📋 Overview

| Component | Platform | Plan | Setup Time |
|---|---|---|---|
| **Git Repository** | [GitHub.com](https://github.com) | Free (Public or Private) | 2 mins |
| **Backend API** | [Render.com](https://render.com) | Free Web Service | 5 mins |
| **Frontend Store** | [Vercel.com](https://vercel.com) | Free Hobby Plan | 3 mins |
| **Total Cost** | — | **₹0 / Free Forever** | ~10 mins |

---

## Step 1: Push Code to GitHub

1. Open your browser and go to [https://github.com](https://github.com).
2. Log in (or create a free account).
3. Click the **"+"** button (top right) $\rightarrow$ **"New repository"**.
4. Name your repository (e.g., `shopezy-reseller`).
5. Choose **Private** or **Public**.
6. **Do NOT** check "Add a README" (we already have one). Click **"Create repository"**.
7. In your computer's terminal, run these 3 commands:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/shopezy-reseller.git
   git push -u origin main
   ```
   *(Replace `<YOUR_GITHUB_USERNAME>` with your actual GitHub username).*

---

## Step 2: Deploy Backend to Render.com (Free)

1. Go to [https://render.com](https://render.com) and click **"Get Started"** (Sign in with your GitHub account).
2. On your Render Dashboard, click **"New +"** $\rightarrow$ **"Web Service"**.
3. Choose **"Build and deploy from a Git repository"** $\rightarrow$ Connect your `shopezy-reseller` repository.
4. Fill in these exact settings:
   - **Name:** `shopezy-backend` (or your brand name)
   - **Region:** `Singapore` (Closest to India for fastest speed)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`
5. Click **"Advanced"** $\rightarrow$ **"Add Environment Variable"**:
   - `CORS_ORIGINS`: `*`
   - `SECRET_KEY`: `my-super-secret-key-123456789`
   - `ADMIN_EMAIL`: `admin@shopezy.com`
   - `ADMIN_PASSWORD`: `admin123` *(change to your secure password)*
6. Click **"Deploy Web Service"**.
7. Wait ~2-3 minutes. Once the build finishes, Render gives you a public URL:
   👉 **`https://shopezy-backend.onrender.com`**
   *(Save this URL for Step 3!)*

---

## Step 3: Deploy Frontend to Vercel (Free)

1. Go to [https://vercel.com](https://vercel.com) and sign up/log in with GitHub.
2. Click **"Add New..."** $\rightarrow$ **"Project"**.
3. Find your `shopezy-reseller` repository and click **"Import"**.
4. In the Project Configuration:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click "Edit" $\rightarrow$ select `frontend` $\rightarrow$ click "Continue".
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Open the **"Environment Variables"** dropdown:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://shopezy-backend.onrender.com/api/v1` *(Your Render backend URL with `/api/v1` at the end)*
6. Click **"Deploy"**!
7. Within 60 seconds, your site is live! Vercel will provide your live store domain:
   🎉 **`https://shopezy-reseller.vercel.app`**

---

## 🌐 Adding a Custom Domain (Optional)

If you buy a domain like `www.mybrand.in` or `www.mybrand.com` from GoDaddy / Hostinger:
1. In Vercel, go to **Settings** $\rightarrow$ **Domains**.
2. Type `www.mybrand.in` $\rightarrow$ click **Add**.
3. Copy the 2 DNS records (A record & CNAME) provided by Vercel and paste them into your GoDaddy/Hostinger DNS manager.
4. Your custom brand domain will be active with free automatic SSL (HTTPS)!

---

## 🔑 Your Live Admin Dashboard

Once deployed, you can access your seller admin panel directly from any device:
- URL: `https://your-site.vercel.app/admin`
- Email: `admin@shopezy.com`
- Password: `admin123` (or the custom password you set in Render)
