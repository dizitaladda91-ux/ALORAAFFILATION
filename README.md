# Enterprise Affiliate Management SaaS Platform

Production-ready, commercial-grade **Affiliate Management Software** built with React 19, Node.js / Express (MVC + Service + Repository Pattern), and Supabase PostgreSQL.

---

## Architecture & Tech Stack

### Frontend
- **React 19** + **React Router DOM v7**
- **Vanilla CSS3 Design System** with HSL theme tokens (Stripe & Linear SaaS aesthetic)
- **Axios** with automatic JWT access token attachment and refresh token rotation interceptor
- **Context API** (`AuthContext`, `ThemeContext`, `NotificationContext`)
- **Responsive Layouts** with skeleton loaders, empty states, and modal components

### Backend
- **Node.js** + **Express.js**
- **Clean Architecture**: Repositories -> Services -> Controllers -> Middlewares -> Routes
- **Authentication**: JWT Access Token (15m) + JWT Refresh Token (7d) + Password hashing with `bcryptjs`
- **Security**: Helmet, CORS, Express Rate Limiter, Input Validation (`express-validator`), Centralized Error Handler
- **Database**: PostgreSQL (Supabase compatible) with parameterized queries, foreign key constraints, indexes, and soft deletes (`deleted_at`)

---

## Database Schema (17 Normalized Tables)
1. `roles` & `permissions` & `role_permissions`
2. `users` & `profiles`
3. `affiliate_links` & `click_events` & `conversion_events`
4. `referrals`
5. `commissions` & `commission_rules`
6. `withdraw_requests` & `transactions`
7. `notifications` & `activity_logs` & `audit_logs` & `system_settings`

---

## Pre-seeded Credentials (Password: `password123`)

| Role | Email | Capabilities |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@affiliate.com` | Full control, audit logs, system settings, user management |
| **Admin** | `admin@affiliate.com` | Approve affiliates, configure commission rules, reports |
| **Super Affiliate** | `superaffiliate@affiliate.com` | Team network management, sub-affiliate tracking |
| **Affiliate** | `affiliate@affiliate.com` | Custom referral code `AFF-HJ72KS`, click/conversion tracking, earnings |

---

## Getting Started

### 1. Database Setup (Supabase / Local Postgres)
Run the SQL DDL scripts inside `backend/src/database`:
1. Execute `schema.sql` in Supabase SQL Editor.
2. Execute `seed.sql` to populate roles and sample credentials.

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Update DATABASE_URL with your Supabase PostgreSQL connection string
npm install
npm run dev
```
Backend server will run at `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Frontend application will open at `http://localhost:3000`.

---

## Deployment Guide

### Vercel (Frontend)
- Build Command: `npm run build`
- Output Directory: `dist`
- Uses `frontend/vercel.json` for SPA URL rewrites.

### Render (Backend)
- Uses `backend/render.yaml` configuration.
- Set environment variables `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`.

### Docker
```bash
docker-compose up --build
```
Starts full stack (PostgreSQL database + Express API) containerized environment.
