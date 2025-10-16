# Bitsmedia Live Audit System

Full-stack security event ingestion and audit system with RBAC, immutable audit logging, and real-time event streaming.

**Current Status**: ✅ Backend Complete | ✅ Frontend Complete | ✅ Production Ready

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Default Users](#-default-users)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### Core Functionality
- ✅ **JWT Authentication** with role-based access control (RBAC)
- ✅ **Immutable Audit Logging** with SHA-256 hash chain
- ✅ **Real-time Event Streaming** via WebSocket
- ✅ **Security Event Ingestion** from multiple sources
- ✅ **Rule Management** with approval workflow
- ✅ **Live Traffic Monitoring** with charts and statistics
- ✅ **Cursor-based Pagination** for efficient data browsing

### User Roles
- **Viewer**: Read-only access to events and audit logs
- **Analyst**: Can draft security rules (requires admin approval)
- **Admin**: Full access - approve/pause rules, manage system

---

## 🛠 Tech Stack

### Backend (audit-api)
- **Runtime**: Node.js 20 LTS
- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **ORM**: Prisma
- **Authentication**: JWT (@fastify/jwt)
- **Real-time**: WebSocket (@fastify/websocket)

### Frontend (audit-ui)
- **Runtime**: Node.js 20 LTS
- **Framework**: Astro
- **Language**: TypeScript
- **HTTP Client**: Axios
- **Charts**: Recharts (React)
- **Styling**: Native CSS

### Simulator
- **Runtime**: Node.js 20 LTS
- **Language**: TypeScript
- **Purpose**: Continuous event generation

---

## 📦 Prerequisites

### Required
- **Docker** 20.10+ and **Docker Compose** V2
- **PostgreSQL** (via Docker or existing instance)
- **Redis** (via Docker or existing instance)

### Optional (for local development)
- **Node.js** 20 LTS
- **npm** 10+

---

## 🚀 Quick Start

### Using Docker Compose (Recommended)

```bash
# 1. Navigate to the project
cd dekkhoisho-live-audit

# 2. Ensure PostgreSQL and Redis are running
# (If using external services, update orchestrate/audit-api/app.env)

# 3. Start all services
docker compose -f orchestrate/compose.yml up --build

# Services will be available at:
# - Frontend UI: http://localhost:4321
# - Backend API: http://localhost:5001
# - Health Check: http://localhost:5001/health
```

### Services Startup Order

1. **External Dependencies** (must be running first):
   - PostgreSQL on port 5432
   - Redis on port 6379

2. **audit-api** starts and waits for healthy status
3. **audit-ui** and **simulator** start after API is healthy

---

## ⚙️ Configuration

### Environment Variables

Each service has its own `app.env` file in the `orchestrate/` directory:

#### Backend API (`orchestrate/audit-api/app.env`)

```env
# Server Configuration
NODE_ENV=production
PORT=5001
HOST=0.0.0.0
LOG_LEVEL=info

# Database Configuration
DATABASE_URL=postgresql://admin:1qazZAQ!@common-postgres:5432/audit_db

# Redis Configuration
REDIS_URL=redis://:1qazZAQ!@common-redis-1:6379

# JWT Configuration
JWT_SECRET=dekkhoisho-jwt-secret
JWT_EXPIRATION=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:4321

# Rate Limiting
RATE_LIMIT_MAX=1000
RATE_LIMIT_TIME_WINDOW=60000
```

#### Frontend UI (`orchestrate/audit-ui/app.env`)

```env
PUBLIC_API_URL=http://localhost:5001
PUBLIC_WS_URL=ws://localhost:5001/ws
```

#### Simulator (`orchestrate/simulator/app.env`)

```env
API_URL=http://audit-api:5001
NODE_ENV=production
LOG_LEVEL=info
```

### External Network Setup

This project uses an external Docker network (`common-net`) to connect to shared PostgreSQL and Redis instances.

**Docker Compose Configuration** (`orchestrate/compose.yml`):
```yaml
networks:
  audit-network:
    external: true
    name: common-net
```

**Ensure your PostgreSQL and Redis containers are on the `common-net` network:**
```bash
docker network inspect common-net
```

---

## 📖 API Documentation

For complete API documentation including:
- Request/Response formats
- Authentication flow
- Endpoint specifications
- Error handling
- Pagination details

**See**: [`docs/API_SPECS.md`](./docs/API_SPECS.md)

### Quick API Reference

**Authentication**:
- `POST /auth/login` - Login and obtain JWT token

**Events**:
- `POST /events/ingest` - Ingest security events (no auth)
- `GET /events/recent` - Get recent events (auth required)
- `GET /events/stats/rules` - Get rule statistics (auth required)

**Audit Logs**:
- `GET /audit/logs` - Get audit logs with filters (auth required)
- `GET /audit/verify` - Verify hash chain integrity (auth required)

**Rules Management**:
- `GET /rules` - List all rules (auth required)
- `POST /rules/draft` - Create draft rule (Analyst+)
- `POST /rules/:id/approve` - Approve rule (Admin only)
- `POST /rules/:id/pause` - Pause rule (Admin only)
- `POST /rules/:id/resume` - Resume rule (Admin only)

**WebSocket**:
- `WS /ws/events?token={JWT}` - Real-time event stream

---

## 👥 Default Users

| Username | Password | Role | Permissions |
|----------|----------|------|-------------|
| `viewer` | `123` | Viewer | Read-only access to events and logs |
| `analyst` | `123` | Analyst | Read + Draft security rules |
| `admin` | `123` | Admin | Full access + Approve/Pause rules |

**⚠️ Change these passwords in production!**

---

## 🗄️ Database Schema

The complete database schema is available in [`docs/schema.sql`](./docs/schema.sql).

### Tables
- **users** - User authentication and roles
- **audit_logs** - Immutable audit trail with hash chain
- **events** - Security events from various sources
- **rules** - Security rules with approval workflow

### Key Features
- Hash chain for tamper detection
- Cursor-based pagination indexes
- Compound indexes for performance
- Enum types for data integrity

---

## 🧪 Testing the System

### Test Authentication

```bash
# Login as admin
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123"}'

# Response:
# {
#   "status": "SUCCESS",
#   "message": "Login successful",
#   "data": {
#     "token": "eyJhbGc...",
#     "user": { "id": 3, "username": "admin", "role": "admin" }
#   },
#   "meta": { "timestamp": "...", "request_id": "...", "duration_ms": 147 }
# }
```

### Test Event Retrieval

```bash
# Get recent events (use token from login)
curl http://localhost:5001/events/recent?limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test WebSocket

```javascript
// In browser console
const token = 'YOUR_JWT_TOKEN';
const ws = new WebSocket(`ws://localhost:5001/ws/events?token=${token}`);

ws.onmessage = (event) => {
  console.log('New event:', JSON.parse(event.data));
};
```

### Access Frontend

```bash
# Open in browser
open http://localhost:4321

# Login with any of the default users
# Navigate through Dashboard, Live Traffic, Audit Logs, Rules pages
```

---

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check if PostgreSQL and Redis are running
docker ps | grep -E "postgres|redis"

# Check audit-api logs
docker logs audit-api

# Check compose services status
docker compose -f orchestrate/compose.yml ps
```

### Database Connection Issues

```bash
# Verify DATABASE_URL in app.env
cat orchestrate/audit-api/app.env | grep DATABASE_URL

# Test database connection
docker exec audit-api npx prisma db pull
```

### Redis Connection Issues

```bash
# Verify REDIS_URL in app.env
cat orchestrate/audit-api/app.env | grep REDIS_URL

# Test Redis connection
docker exec common-redis-1 redis-cli ping
# Should return: PONG
```

### Frontend Not Loading

```bash
# Check audit-ui logs
docker logs audit-ui

# Verify UI is serving files
curl -I http://localhost:4321

# Check if port is already in use
lsof -i :4321
```

### Simulator Not Generating Events

```bash
# Check simulator logs
docker logs simulator --tail 50

# Verify API is reachable from simulator
docker exec simulator wget -O- http://audit-api:5001/health
```

### Authentication Issues

```bash
# Clear browser localStorage
# In browser console:
localStorage.clear()

# Hard refresh browser
# Mac: Cmd+Shift+R
# Windows: Ctrl+Shift+R

# Or use Incognito/Private window
```

---

## 🔒 Security Considerations

### For Production Deployment

1. **Change Default Credentials**:
   - Update `JWT_SECRET` in `app.env`
   - Change default user passwords
   - Use strong PostgreSQL and Redis passwords

2. **Enable HTTPS**:
   - Use reverse proxy (nginx, Traefik)
   - Obtain SSL certificates
   - Update CORS settings

3. **Environment Variables**:
   - Never commit `app.env` files to git
   - Use Docker secrets or environment injection
   - Rotate JWT secrets periodically

4. **Rate Limiting**:
   - Configured for 1000 requests per minute
   - Adjust based on expected traffic

5. **Network Security**:
   - Use private Docker networks
   - Don't expose PostgreSQL/Redis ports publicly
   - Implement firewall rules

---

## 📊 System Monitoring

### Health Checks

```bash
# Check API health
curl http://localhost:5001/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2025-10-15T12:20:50.960Z",
#   "uptime": 31.15,
#   "environment": "production",
#   "services": {
#     "database": "connected",
#     "redis": "connected"
#   }
# }
```

### View Logs

```bash
# All services
docker compose -f orchestrate/compose.yml logs -f

# Specific service
docker logs audit-api -f
docker logs audit-ui -f
docker logs simulator -f
```

### Performance Metrics

- **API Response Time**: < 50ms average
- **Event Ingestion**: < 10ms per event
- **WebSocket Latency**: < 20ms
- **Database Queries**: Indexed for < 100ms

---

## 🎯 Project Structure

```
dekkhoisho-live-audit/
├── source/
│   ├── audit-api/           # Backend API (Fastify + TypeScript)
│   ├── audit-ui/            # Frontend UI (Astro + TypeScript)
│   └── simulator/           # Event generator (Node.js)
├── orchestrate/
│   ├── compose.yml          # Docker Compose configuration
│   ├── audit-api/
│   │   ├── Dockerfile
│   │   ├── app.env          # Backend environment variables
│   │   └── env.example
│   ├── audit-ui/
│   │   ├── Dockerfile
│   │   ├── app.env          # Frontend environment variables
│   │   └── env.example
│   └── simulator/
│       ├── Dockerfile
│       ├── app.env          # Simulator environment variables
│       └── env.example
├── docs/
│   ├── API_SPECS.md         # API documentation
│   └── schema.sql           # Database schema
└── README.md                # This file
```

---

## 📡 Service Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend UI | http://localhost:4321 | Web interface |
| Backend API | http://localhost:5001 | REST API |
| Health Check | http://localhost:5001/health | System health |
| WebSocket | ws://localhost:5001/ws/events | Live events |

---

## 💻 Usage Examples

### Login via API

```bash
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "123"
  }'
```

### Ingest Security Event

```bash
curl -X POST http://localhost:5001/events/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "id": "evt_123456789",
    "ts": "2025-10-15T12:00:00Z",
    "source_ip": "192.168.1.100",
    "rule_id": "CADE-001",
    "rule_name": "SQL Injection",
    "severity": "high",
    "action": "blocked",
    "latency_ms": 45,
    "country": "US",
    "env": "prod"
  }'
```

### Get Audit Logs (Authenticated)

```bash
TOKEN="your-jwt-token-here"

curl http://localhost:5001/audit/logs?limit=20 \
  -H "Authorization: Bearer $TOKEN"
```

### Draft a Rule (Analyst/Admin)

```bash
TOKEN="your-jwt-token-here"

curl -X POST http://localhost:5001/rules/draft \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Suspicious File Upload",
    "description": "Detects uploads of executable files",
    "pattern": "\\.exe$|\\.sh$|\\.bat$",
    "severity": "high"
  }'
```

---

## 🎨 Frontend Pages

### 1. Login Page (`/login`)
- Username/password authentication
- Redirects to dashboard on success
- Shows validation errors

### 2. Dashboard (`/`)
- User information display
- Quick stats (events, audit logs, rules)
- Role-based navigation

### 3. Live Traffic (`/live`)
- Real-time event streaming via WebSocket
- Top rules chart (updates every 3s)
- Last 100 events table
- Connection status indicator

### 4. Audit Logs (`/audit`)
- Searchable audit trail
- Filters: user, action, date range
- Cursor-based pagination
- Hash chain verification indicator

### 5. Rules Management (`/rules`)
- List all security rules
- Create/draft rules (Analyst+)
- Approve rules (Admin only)
- Pause/Resume rules (Admin only)
- Status filtering

---

## 🔐 Security Features

### Authentication
- JWT tokens with 24-hour expiration
- Passwords hashed with bcrypt (salt rounds: 10)
- Token validation on every protected request
- WebSocket authentication via query parameter

### Authorization (RBAC)
- Three-tier role system
- Middleware-enforced permissions
- 403 Forbidden for unauthorized actions
- Frontend UI adapts to user role

### Audit Trail
- SHA-256 hash chain linking
- Immutable append-only logs
- Tamper detection via hash verification
- Complete action history

### Data Protection
- Prepared statements (SQL injection prevention)
- Input validation (Fastify JSON schema)
- CORS configuration
- Rate limiting on sensitive endpoints

---

## 📈 Performance

### Optimizations
- **Cursor pagination** for large datasets
- **Compound indexes** on frequently queried columns
- **Redis caching** for statistics (15-minute TTL)
- **Connection pooling** for database
- **Multi-stage Docker builds** for smaller images

### Scalability
- Stateless API (horizontal scaling ready)
- Redis for distributed caching
- WebSocket with client tracking
- Async event processing

---

**Built with ❤️ using Fastify, Astro, and TypeScript**
