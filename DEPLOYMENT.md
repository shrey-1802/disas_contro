# 🚀 DISISTA CONTROL — Production Deployment Guide

This guide outlines production deployment instructions for **DISISTA CONTROL** (Disaster Relief Supply Chain Intelligence Platform).

---

## 🏗️ Architecture Overview

```
[ Clients / Mobile / Browsers ]
               │
               ▼
[ Frontend Server / CDN (Port 8080) ]
        ├── Security Headers (CSP, HSTS, X-Frame-Options)
        ├── Dynamic Gzip / Brotli Compression
        └── Stale-While-Revalidate Static Caching
               │
               ▼ REST / WebSockets
[ NestJS Backend Engine (Port 3000) ]
        ├── Helmet Security + CORS Guard
        ├── JWT Authentication + RBAC Interceptors
        ├── Prisma ORM Connection Pool
        └── Dynamic Rerouting & Supply Swap Engine
               │
               ▼ TLS 1.3 / Port 4000
[ TiDB Cloud Serverless MySQL (AWS Singapore) ]
```

---

## ⚡ Option 1: 1-Click Docker Compose Deployment

Run both backend and frontend in isolated production containers:

```bash
docker-compose up -d --build
```

- **Frontend**: `http://<your-server-ip>:8080`
- **Backend API**: `http://<your-server-ip>:3000/api/v1`
- **Swagger Docs**: `http://<your-server-ip>:3000/api/docs`

---

## 🌐 Option 2: Cloud Host Deployment (Render / Railway / AWS / DigitalOcean)

### 1. Backend Service (Node.js Environment)
- **Root Directory**: `backend`
- **Build Command**: `npm ci && npx prisma generate && npm run build`
- **Start Command**: `node dist/src/main.js`
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `PORT`: `3000`
  - `DATABASE_URL`: `mysql://21oR7kYsZBTwtTx.root:6Mku0PHqSvdMi4hD@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test?sslaccept=strict`
  - `JWT_SECRET`: `<generate-secure-random-string>`
  - `CORS_ORIGIN`: `https://your-frontend-domain.com`

### 2. Frontend Service (Node.js or Static Host / Vercel / Netlify)
- **Root Directory**: `.`
- **Start Command**: `node frontend-server.js`
- **Environment Variables**:
  - `PORT`: `8080`
  - `API_BASE_URL`: `https://your-backend-domain.com/api/v1`
  - `SOCKET_URL`: `https://your-backend-domain.com`

---

## 🔒 Production Security Checklist

- [x] **Database TLS Encryption**: Enabled with `?sslaccept=strict` connecting to TiDB Cloud.
- [x] **HTTP Security Headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`.
- [x] **Dynamic Gzip Compression**: Enabled for JS, CSS, JSON, HTML.
- [x] **CORS Origin Whitelisting**: Strict origin matching on all API routes.
- [x] **Graceful Shutdown**: SIGTERM and SIGINT listeners in backend and frontend servers.
- [x] **Offline Resilience**: Offline IndexedDB/localStorage queue with auto-retry on reconnect.
