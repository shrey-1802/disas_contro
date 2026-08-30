# DISISTA CONTROL — Deployment Guide

## Production Deployment Checklist

### Prerequisites
- Docker & Docker Compose (v20.10+)
- Node.js 18+ (for local development)
- MySQL 8.0+ or MariaDB 10.4+
- Valid GraphHopper API Key

---

## Quick Start: Docker Compose (Recommended)

### 1. Clone the Repository
```bash
git clone https://github.com/shrey-1802/disas_contro.git
cd disas_contro
git checkout deployment-ready
```

### 2. Configure Environment Variables

**Create `.env` file in root:**
```bash
cp backend/.env.example backend/.env
JWT_SECRET=$(openssl rand -base64 32)  # Generate secure key
echo "JWT_SECRET=$JWT_SECRET" >> backend/.env
echo "GRAPHHOPPER_API_KEY=YOUR_API_KEY" >> backend/.env
```

**For production, use `.env.production`:**
```bash
cp backend/.env.production .env.prod
# Edit with production values
export $(cat .env.prod | xargs)
```

### 3. Start Services with Docker Compose

```bash
# Development (with hot reload)
docker-compose -f docker-compose.yml up -d

# Production (optimized builds)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4. Initialize Database

```bash
# Wait for MySQL to be ready
sleep 30

# Run migrations
docker-compose exec backend npm run prisma:migrate:prod

# Seed with demo data (optional)
docker-compose exec backend npm run prisma:seed
```

### 5. Verify Deployment

```bash
# Check service health
curl http://localhost:3000/api/v1/health

# Access frontend
open http://localhost:8080

# Access API docs
open http://localhost:3000/api/docs
```

---

## Manual Deployment (Without Docker)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
NODE_ENV=production npm run prisma:migrate:prod

# Build and start
NODE_ENV=production npm run build
NODE_ENV=production npm start
```

### Frontend Setup

```bash
# Install dependencies
npm install

# Build frontend
npm run build

# Start production server
NODE_ENV=production npm start
```

---

## Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|----------|
| `NODE_ENV` | Environment mode | `production` |
| `DATABASE_URL` | MySQL connection | `mysql://user:pass@host:3306/db` |
| `JWT_SECRET` | JWT signing key | Generated secure key (min 32 chars) |
| `CORS_ORIGIN` | Allowed origins | `https://yourdomain.com` |
| `GRAPHHOPPER_API_KEY` | Routing service API | Get from GraphHopper |

### Optional Variables

```env
JWT_ACCESS_EXPIRES=2h              # Token expiry time
JWT_REFRESH_EXPIRES=7d             # Refresh token expiry
THROTTLE_LIMIT=100                 # Requests per minute
THROTTLE_TTL=60000                 # Rate limit window (ms)
LOG_LEVEL=warn                     # Logging level
LOG_FORMAT=json                    # Structured logging
```

---

## Database Setup

### Using Docker Compose (Automatic)
```bash
docker-compose up -d db
# Database initializes automatically from backend/schema.sql
```

### Manual MySQL Setup

```bash
# Connect to MySQL
mysql -u root -p

# Create database and import schema
SOURCE backend/schema.sql;

# Verify
SHOW TABLES FROM relief_supply_chain;
```

---

## Security Best Practices

### ✅ Pre-Deployment

- [ ] Generate strong `JWT_SECRET` (minimum 32 characters)
- [ ] Set production database credentials
- [ ] Configure CORS to only allow trusted domains
- [ ] Enable HTTPS (reverse proxy with Nginx/Caddy)
- [ ] Set `ENABLE_QUICK_LOGIN=false` in frontend
- [ ] Disable Swagger docs in production: `NODE_ENV=production`

### ✅ Post-Deployment

- [ ] Verify HTTPS is enabled
- [ ] Check security headers with online tools
- [ ] Monitor logs for errors: `docker-compose logs -f backend`
- [ ] Set up automated database backups
- [ ] Enable rate limiting on reverse proxy
- [ ] Implement WAF (Web Application Firewall)

---

## Health Checks & Monitoring

### Health Endpoint
```bash
curl http://localhost:3000/api/v1/health
```

### Docker Health Status
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## Troubleshooting

### Database Connection Failed
```bash
# Check MySQL is running
docker-compose ps db

# Verify connection string
echo $DATABASE_URL

# Test MySQL connection
mysql -u relief_user -p -h localhost relief_supply_chain
```

### Backend Won't Start
```bash
# Check logs
docker-compose logs backend

# Verify dependencies
cd backend && npm list

# Regenerate Prisma client
npm run prisma:generate
```

### Frontend Shows Blank Page
```bash
# Verify API endpoint is reachable
curl http://localhost:3000/api/v1/health

# Check frontend environment
cat frontend/js/env.js

# Test in browser console
fetch('http://localhost:3000/api/v1/health')
```

### CORS Errors
```bash
# Update CORS_ORIGIN environment variable
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com

# Restart services
docker-compose restart backend
```

---

## Scaling & Performance

### Load Balancing
- Use Nginx or HAProxy in front of multiple backend instances
- Configure sticky sessions for WebSocket connections

### Database Optimization
```sql
-- Enable slow query logging
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Monitor performance
SHOW PROCESSLIST;
SHOW ENGINE INNODB STATUS;
```

### Caching
- Implement Redis for session management
- Cache GraphHopper responses
- Use CDN for static frontend assets

---

## Backup & Recovery

### Database Backup
```bash
# Automated daily backup
docker-compose exec db mysqldump -u relief_user -p relief_supply_chain > backup_$(date +%Y%m%d).sql

# Restore from backup
mysql -u relief_user -p relief_supply_chain < backup_20260830.sql
```

### Application Backup
```bash
# Backup entire application
tar -czf disas_contro_backup_$(date +%Y%m%d).tar.gz .

# Restore
tar -xzf disas_contro_backup_20260830.tar.gz
```

---

## Support & Documentation

- **API Docs:** http://localhost:3000/api/docs (Swagger)
- **GitHub Issues:** https://github.com/shrey-1802/disas_contro/issues
- **Schema:** See `backend/schema.sql` for database structure
- **Demo Accounts:** See README.md for test credentials

---

## Version Info

- **Platform:** DISISTA CONTROL v1.0.0
- **Backend:** NestJS 10.4.15 + Prisma 6.4.1 + MySQL 8.0
- **Frontend:** Vanilla JS + CSS3
- **Deployment:** Docker Compose / Kubernetes ready
- **Last Updated:** August 30, 2026
