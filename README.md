# Bitsmedia Live Audit System

Full-stack security event ingestion and audit system with RBAC, immutable audit logging, and real-time event streaming.

## 🎯 Project Status

### ✅ Completed Components

#### Backend API (audit-api) - 100% Complete
- ✅ **Authentication System**
  - JWT-based authentication
  - Password hashing with bcrypt
  - Login endpoint with audit logging
  
- ✅ **RBAC (Role-Based Access Control)**
  - Three roles: viewer, analyst, admin
  - JWT middleware for authentication
  - Role-based middleware for authorization
  - 403 responses for unauthorized access

- ✅ **Immutable Audit Logging**
  - SHA-256 hash chain implementation
  - Append-only audit trail
  - Previous hash linking for tamper detection
  - Audit log verification endpoint

- ✅ **Event Ingestion System**
  - REST endpoint for event ingestion (`/events/ingest`)
  - JSON schema validation
  - PostgreSQL storage
  - Redis integration for statistics

- ✅ **WebSocket Server**
  - Real-time event broadcasting
  - JWT authentication for WebSocket connections
  - Client tracking and management

- ✅ **Rule Management**
  - Draft rules (Analyst+)
  - Approve/pause/resume rules (Admin only)
  - All actions create audit logs

- ✅ **Database & Services**
  - PostgreSQL with schema initialization
  - Redis for rolling 15-minute statistics
  - Automatic DB setup on startup
  - Health check endpoints

#### Simulator Worker - 100% Complete
- ✅ Continuous event generation (500ms interval)
- ✅ Random data pools for realistic events
- ✅ Structured logging based on environment
- ✅ Error handling and retry logic
- ✅ Graceful shutdown handling

#### Infrastructure - 100% Complete
- ✅ Docker Compose configuration
- ✅ PostgreSQL 15 container
- ✅ Redis 7 container
- ✅ Health checks for all services
- ✅ Multi-stage Dockerfiles for optimization
- ✅ Environment variable configuration
- ✅ Network isolation

### 🚧 In Progress

#### Frontend (audit-ui) - 20% Complete
- ✅ Astro project initialized
- ✅ Dependencies installed (axios, recharts)
- ✅ Docker configuration ready
- ⏳ **Pages to Implement:**
  - Login page
  - Dashboard
  - Audit logs page with filters
  - Live traffic page with WebSocket
  - Rules management page
- ⏳ **Components to Build:**
  - Authentication utilities
  - API client wrapper
  - WebSocket client
  - Chart components (Recharts)
  - Table components
  - Filter components

## 📁 Project Structure

```
bitsmedia-live-audit/
├── source/
│   ├── audit-api/                 ✅ Complete
│   │   ├── src/
│   │   │   ├── config/            # Environment configuration
│   │   │   ├── database/          # PostgreSQL service
│   │   │   ├── middleware/        # JWT & RBAC middleware
│   │   │   ├── routes/            # API routes
│   │   │   ├── services/          # Redis & Audit services
│   │   │   ├── types/             # TypeScript types
│   │   │   ├── utils/             # Helper functions
│   │   │   └── server.ts          # Main server file
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── audit-ui/                  ⏳ In Progress
│   │   ├── src/
│   │   │   ├── components/        # (To be built)
│   │   │   ├── layouts/           # (To be built)
│   │   │   ├── pages/             # (To be built)
│   │   │   └── utils/             # (To be built)
│   │   └── package.json
│   │
│   └── simulator/                 ✅ Complete
│       ├── src/
│       │   └── index.ts           # Event generator
│       ├── package.json
│       └── tsconfig.json
│
└── orchestrate/                   ✅ Complete
    ├── compose.yml                # Docker Compose
    ├── audit-api/
    │   ├── Dockerfile
    │   ├── app.env
    │   └── env.example
    ├── audit-ui/
    │   ├── Dockerfile
    │   ├── app.env
    │   └── env.example
    └── simulator/
        ├── Dockerfile
        ├── app.env
        └── env.example
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)

### Running the System

```bash
# Navigate to orchestrate directory
cd orchestrate

# Start all services
docker compose up --build

# Services will be available at:
# - Backend API: http://localhost:3000
# - Frontend UI: http://localhost:4321 (when ready)
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
```

### Test the Backend

```bash
# Health check
curl http://localhost:3000/health

# Login as admin
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123"}'

# Get audit logs (replace TOKEN)
curl http://localhost:3000/audit/logs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get recent events (replace TOKEN)
curl http://localhost:3000/events/recent \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get rule statistics (replace TOKEN)
curl http://localhost:3000/events/stats/rules \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📊 API Endpoints

### Authentication
- `POST /auth/login` - Login and get JWT token

### Events
- `POST /events/ingest` - Ingest security events (no auth)
- `GET /events/recent` - Get recent events (auth required)
- `GET /events/stats/rules` - Get top rule statistics (auth required)

### Audit
- `GET /audit/logs` - Get audit logs with filters (auth required)
- `GET /audit/verify` - Verify audit log integrity (auth required)

### Rules
- `GET /rules` - List all rules (auth required)
- `POST /rules/draft` - Create draft rule (Analyst+)
- `POST /rules/:id/approve` - Approve rule (Admin only)
- `POST /rules/:id/pause` - Pause rule (Admin only)
- `POST /rules/:id/resume` - Resume rule (Admin only)

### WebSocket
- `WS /ws/events?token=JWT` - Real-time event stream

## 👥 Default Users

| Username | Password | Role | Permissions |
|----------|----------|------|-------------|
| viewer | 123 | Viewer | Read-only |
| analyst | 123 | Analyst | Read + Draft rules |
| admin | 123 | Admin | Full access |

## 📝 Frontend Implementation Guide

The frontend needs to be built with the following pages:

### 1. Login Page (`/login`)
```typescript
// Required functionality:
- Username/password form
- Call POST /auth/login
- Store JWT in localStorage
- Redirect to dashboard on success
```

### 2. Dashboard (`/`)
```typescript
// Required functionality:
- Display user info (username, role)
- Navigation links based on role
- Logout button
```

### 3. Audit Page (`/audit`)
```typescript
// Required functionality:
- Table showing audit logs
- Filters: user, action, date range
- Pagination
- Display hash for verification
- API: GET /audit/logs
```

### 4. Live Traffic Page (`/live`)
```typescript
// Required functionality:
- TOP: Recharts chart showing top 5 rules
  - Poll GET /stats/rules every 3 seconds
  - Bar or line chart
- BOTTOM: Live event stream table
  - WebSocket connection to ws://api/ws/events
  - Show last 100 events
  - Auto-scroll or highlight new
  - Columns: Timestamp, IP, Rule, Severity, Action
```

### 5. Rules Page (`/rules`)
```typescript
// Required functionality:
- List all rules
- Button to draft rule (Analyst+)
- Buttons to approve/pause (Admin only)
- Hide buttons based on user role
```

### Key Utilities Needed

```typescript
// src/utils/api.ts
import axios from 'axios';

const API_URL = import.meta.env.PUBLIC_API_URL;

export const apiClient = axios.create({
  baseURL: API_URL,
});

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// src/utils/auth.ts
export function isAuthenticated() {
  return !!localStorage.getItem('token');
}

export function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// src/utils/websocket.ts
export function createWebSocketClient(token: string) {
  const WS_URL = import.meta.env.PUBLIC_WS_URL;
  const ws = new WebSocket(`${WS_URL}/events?token=${token}`);
  return ws;
}
```

## 🔧 Development

### Backend Development
```bash
cd source/audit-api
npm install
npm run dev  # Runs on http://localhost:3000
```

### Frontend Development
```bash
cd source/audit-ui
npm install
npm run dev  # Runs on http://localhost:4321
```

### Simulator Development
```bash
cd source/simulator
npm install
npm run dev
```

## 📚 Documentation

- **ARCHITECTURE.md** - System architecture and flow diagrams
- **API_SPECS.md** - Complete API documentation
- **CLARIFICATIONS.md** - Detailed explanations of key concepts

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs
docker compose logs audit-api

# Verify database
docker compose logs postgres

# Check environment variables
cat orchestrate/audit-api/app.env
```

### Simulator not sending events
```bash
# Check logs
docker compose logs simulator

# Verify API is reachable
docker compose exec simulator ping audit-api
```

### Database connection issues
```bash
# Restart postgres
docker compose restart postgres

# Check if port is already in use
lsof -i :5432
```

## 🎯 Next Steps

1. **Complete Frontend Pages** (Priority: High)
   - Implement login page with authentication
   - Build audit logs page with filters
   - Create live traffic page with WebSocket
   - Add rules management page

2. **Testing** (Priority: Medium)
   - Test all three user roles
   - Verify RBAC enforcement
   - Test WebSocket connections
   - Verify audit hash chain integrity

3. **Enhancements** (Priority: Low)
   - Add more visualization options
   - Implement export functionality
   - Add search capabilities
   - Improve error handling

## 📈 Progress Summary

```
Overall Completion: ~75%

✅ Backend API:           100%
✅ Simulator:             100%
✅ Infrastructure:        100%
⏳ Frontend:               20%
⏳ Testing:                 0%
⏳ Documentation Updates:  50%
```

## 🔐 Security Notes

- Change JWT_SECRET in production
- Use strong PostgreSQL passwords
- Enable HTTPS in production
- Implement rate limiting properly
- Review CORS settings

## 📄 License

This project is for interview/assessment purposes.

---

**For detailed API documentation, see API_SPECS.md**  
**For architecture details, see ARCHITECTURE.md**  
**For concept explanations, see CLARIFICATIONS.md**

