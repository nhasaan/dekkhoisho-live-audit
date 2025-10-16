# API Specifications

Complete REST and WebSocket API documentation for the DekkhoIsho Live Audit System.

---

## Base URL

```
Development: http://localhost:3000
Production:  https://your-domain.com
```

---

## Authentication

All protected endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

---

## REST API Endpoints

### Authentication APIs

#### POST /auth/login

Authenticate user and receive JWT token.

**Request:**
```json
{
  "username": "admin",
  "password": "123"
}
```

**Response: 200 OK**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

**Response: 401 Unauthorized**
```json
{
  "error": "Invalid credentials"
}
```

**Auth Required:** No

---

### Audit APIs

#### GET /audit/logs

Retrieve audit logs with optional filtering and pagination.

**Query Parameters:**
- `user` (optional, string): Filter by username
- `action` (optional, string): Filter by action type (e.g., "APPROVE_RULE")
- `dateFrom` (optional, ISO8601): Start date for filtering
- `dateTo` (optional, ISO8601): End date for filtering
- `page` (optional, number, default: 1): Page number
- `limit` (optional, number, default: 50, max: 100): Items per page

**Example Request:**
```
GET /audit/logs?user=admin&action=APPROVE_RULE&page=1&limit=20
```

**Response: 200 OK**
```json
{
  "logs": [
    {
      "id": 42,
      "user_id": 1,
      "username": "admin",
      "action": "APPROVE_RULE",
      "target": "rule_123",
      "metadata": {
        "rule_name": "SQL Injection Detection",
        "previous_status": "draft"
      },
      "timestamp": "2025-10-14T10:15:30Z",
      "hash": "a1b2c3d4e5f6...",
      "previous_hash": "f6e5d4c3b2a1..."
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

**Auth Required:** Yes (any role)

---

### Event APIs

#### POST /events/ingest

Ingest a new security event into the system.

**Request:**
```json
{
  "id": "evt_1001",
  "ts": "2025-10-14T10:24:18Z",
  "source_ip": "203.0.113.45",
  "path": "/api/login",
  "method": "POST",
  "service": "auth-service",
  "rule_id": "CADE-00123",
  "rule_name": "SQL Injection Attempt",
  "severity": "high",
  "action": "blocked",
  "latency_ms": 180,
  "country": "SG",
  "env": "prod"
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "eventId": "evt_1001"
}
```

**Response: 400 Bad Request**
```json
{
  "error": "Validation failed",
  "details": {
    "severity": "Must be one of: low, medium, high, critical"
  }
}
```

**Auth Required:** No (for simulator access)

---

#### GET /events/recent

Retrieve recent security events with pagination.

**Query Parameters:**
- `page` (optional, number, default: 1): Page number
- `limit` (optional, number, default: 50, max: 100): Items per page
- `severity` (optional, string): Filter by severity
- `rule_id` (optional, string): Filter by rule ID
- `dateFrom` (optional, ISO8601): Start date
- `dateTo` (optional, ISO8601): End date

**Example Request:**
```
GET /events/recent?severity=high&page=1&limit=50
```

**Response: 200 OK**
```json
{
  "events": [
    {
      "id": "evt_1001",
      "ts": "2025-10-14T10:24:18Z",
      "source_ip": "203.0.113.45",
      "path": "/api/login",
      "method": "POST",
      "service": "auth-service",
      "rule_id": "CADE-00123",
      "rule_name": "SQL Injection Attempt",
      "severity": "high",
      "action": "blocked",
      "latency_ms": 180,
      "country": "SG",
      "env": "prod",
      "created_at": "2025-10-14T10:24:18Z"
    }
  ],
  "total": 1523,
  "page": 1,
  "limit": 50,
  "totalPages": 31
}
```

**Auth Required:** Yes (any role)

---

#### GET /stats/rules

Get aggregated statistics for top rules within a time window.

**Query Parameters:**
- `window` (optional, string, default: "15m"): Time window
  - Options: `"15m"`, `"1h"`, `"24h"`

**Example Request:**
```
GET /stats/rules?window=15m
```

**Response: 200 OK**
```json
{
  "rules": [
    {
      "rule_id": "CADE-00123",
      "rule_name": "SQL Injection Attempt",
      "count": 487,
      "last_seen": "2025-10-14T10:24:18Z"
    },
    {
      "rule_id": "CADE-00124",
      "rule_name": "Brute Force Login",
      "count": 312,
      "last_seen": "2025-10-14T10:24:10Z"
    },
    {
      "rule_id": "CADE-00125",
      "rule_name": "XSS Attempt",
      "count": 156,
      "last_seen": "2025-10-14T10:23:55Z"
    },
    {
      "rule_id": "CADE-00126",
      "rule_name": "Path Traversal",
      "count": 89,
      "last_seen": "2025-10-14T10:23:40Z"
    },
    {
      "rule_id": "CADE-00127",
      "rule_name": "API Rate Limit Exceeded",
      "count": 45,
      "last_seen": "2025-10-14T10:23:30Z"
    }
  ],
  "timestamp": "2025-10-14T10:24:20Z",
  "window": "15m"
}
```

**Auth Required:** Yes (any role)

---

### Rule Management APIs

#### GET /rules

List all security rules.

**Query Parameters:**
- `status` (optional, string): Filter by status ("draft", "active", "paused")
- `page` (optional, number, default: 1)
- `limit` (optional, number, default: 50)

**Response: 200 OK**
```json
{
  "rules": [
    {
      "id": 123,
      "name": "SQL Injection Detection",
      "description": "Detects common SQL injection patterns",
      "pattern": "SELECT.*FROM|UNION.*SELECT",
      "severity": "high",
      "status": "active",
      "created_by": 2,
      "created_at": "2025-10-13T14:30:00Z",
      "updated_at": "2025-10-14T09:15:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 50
}
```

**Auth Required:** Yes (any role)

---

#### POST /rules/draft

Create a new draft rule.

**Request:**
```json
{
  "name": "Suspicious File Upload",
  "description": "Detects potentially malicious file uploads",
  "pattern": "\\.(exe|bat|cmd|sh|php|jsp)$",
  "severity": "medium"
}
```

**Response: 201 Created**
```json
{
  "rule": {
    "id": 456,
    "name": "Suspicious File Upload",
    "description": "Detects potentially malicious file uploads",
    "pattern": "\\.(exe|bat|cmd|sh|php|jsp)$",
    "severity": "medium",
    "status": "draft",
    "created_by": 2,
    "created_at": "2025-10-14T10:30:00Z"
  },
  "audit": {
    "id": 789,
    "action": "DRAFT_RULE",
    "target": "rule_456",
    "hash": "abc123def456..."
  }
}
```

**Auth Required:** Yes (Analyst or Admin)

---

#### POST /rules/:id/approve

Approve a draft rule and make it active.

**Response: 200 OK**
```json
{
  "rule": {
    "id": 456,
    "name": "Suspicious File Upload",
    "status": "active",
    "updated_at": "2025-10-14T10:35:00Z"
  },
  "audit": {
    "id": 790,
    "action": "APPROVE_RULE",
    "target": "rule_456",
    "hash": "def456ghi789..."
  }
}
```

**Response: 403 Forbidden**
```json
{
  "error": "Only admins can approve rules"
}
```

**Response: 404 Not Found**
```json
{
  "error": "Rule not found"
}
```

**Auth Required:** Yes (Admin only)

---

#### POST /rules/:id/pause

Pause an active rule.

**Request (optional):**
```json
{
  "reason": "High false positive rate"
}
```

**Response: 200 OK**
```json
{
  "rule": {
    "id": 456,
    "name": "Suspicious File Upload",
    "status": "paused",
    "updated_at": "2025-10-14T11:00:00Z"
  },
  "audit": {
    "id": 791,
    "action": "PAUSE_RULE",
    "target": "rule_456",
    "hash": "ghi789jkl012..."
  }
}
```

**Auth Required:** Yes (Admin only)

---

#### POST /rules/:id/resume

Resume a paused rule.

**Response: 200 OK**
```json
{
  "rule": {
    "id": 456,
    "name": "Suspicious File Upload",
    "status": "active",
    "updated_at": "2025-10-14T12:00:00Z"
  },
  "audit": {
    "id": 792,
    "action": "RESUME_RULE",
    "target": "rule_456",
    "hash": "jkl012mno345..."
  }
}
```

**Auth Required:** Yes (Admin only)

---

### Health & Info APIs

#### GET /health

Health check endpoint for monitoring.

**Response: 200 OK**
```json
{
  "status": "ok",
  "timestamp": "2025-10-14T10:24:20Z",
  "uptime": 3600,
  "environment": "production",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

**Auth Required:** No

---

#### GET /

API information endpoint.

**Response: 200 OK**
```json
{
  "name": "DekkhoIsho Live Audit API",
  "version": "1.0.0",
  "description": "Security event ingestion and audit system with RBAC",
  "endpoints": {
    "health": "/health",
    "auth": "/auth/login",
    "events": "/events",
    "audit": "/audit",
    "rules": "/rules",
    "websocket": "ws://localhost:3000/ws"
  }
}
```

**Auth Required:** No

---

## WebSocket API

### Connection

#### WS /ws/events

Stream live security events in real-time.

**Connection URL:**
```
ws://localhost:3000/ws/events?token=<jwt_token>
```

**Authentication:**
- JWT token via query parameter: `?token=<jwt_token>`
- Or send token in first message after connection

**Server → Client Messages:**

```json
{
  "type": "event",
  "data": {
    "id": "evt_1001",
    "ts": "2025-10-14T10:24:18Z",
    "source_ip": "203.0.113.45",
    "path": "/api/login",
    "method": "POST",
    "service": "auth-service",
    "rule_id": "CADE-00123",
    "rule_name": "SQL Injection Attempt",
    "severity": "high",
    "action": "blocked",
    "latency_ms": 180,
    "country": "SG",
    "env": "prod"
  }
}
```

**Client → Server Messages (Optional Filtering):**

```json
{
  "type": "subscribe",
  "filters": {
    "severity": "high",
    "rule_id": "CADE-00123"
  }
}
```

**Connection Events:**

```json
// Connected
{
  "type": "connected",
  "message": "WebSocket connection established",
  "clientId": "client_abc123"
}

// Ping/Pong (heartbeat)
{
  "type": "ping"
}

// Client responds with:
{
  "type": "pong"
}
```

---

#### WS /ws/stats

Stream live rule statistics updates.

**Connection URL:**
```
ws://localhost:3000/ws/stats?token=<jwt_token>
```

**Server → Client Messages (broadcast every 3 seconds):**

```json
{
  "type": "stats_update",
  "data": {
    "topRules": [
      {
        "rule_id": "CADE-00123",
        "rule_name": "SQL Injection Attempt",
        "count": 487,
        "last_seen": "2025-10-14T10:24:18Z"
      },
      {
        "rule_id": "CADE-00124",
        "rule_name": "Brute Force Login",
        "count": 312,
        "last_seen": "2025-10-14T10:24:10Z"
      }
    ],
    "timestamp": "2025-10-14T10:24:20Z",
    "window": "15m"
  }
}
```

---

## Error Responses

### Standard Error Format

All error responses follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { }
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET request |
| 201 | Created | Successful POST request that creates a resource |
| 400 | Bad Request | Invalid request format or validation error |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

### Example Error Responses

**401 Unauthorized:**
```json
{
  "error": "Token expired",
  "code": "TOKEN_EXPIRED"
}
```

**403 Forbidden:**
```json
{
  "error": "Insufficient permissions",
  "code": "FORBIDDEN",
  "details": {
    "required_role": "admin",
    "current_role": "analyst"
  }
}
```

**400 Bad Request:**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "severity": "Must be one of: low, medium, high, critical",
    "ts": "Must be a valid ISO8601 timestamp"
  }
}
```

---

## Rate Limiting

All endpoints (except WebSocket) are rate-limited:

- **Default**: 1000 requests per minute per IP
- **Login endpoint**: 10 requests per minute per IP
- **Headers** (included in response):
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

**Example Response Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 985
X-RateLimit-Reset: 1697280000
```

---

## CORS Configuration

The API supports CORS with the following configuration:

- **Allowed Origins**: Configured via `CORS_ORIGIN` environment variable
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: Content-Type, Authorization
- **Credentials**: Allowed (cookies, authorization headers)

---

## Data Validation

### Event Schema Validation

All events submitted to `/events/ingest` must conform to this schema:

```typescript
{
  id: string (required, unique, pattern: /^evt_\d+$/),
  ts: string (required, ISO8601 format),
  source_ip: string (required, valid IPv4 or IPv6),
  path: string (required),
  method: string (required, enum: GET|POST|PUT|DELETE|PATCH),
  service: string (required),
  rule_id: string (required, pattern: /^CADE-\d+$/),
  rule_name: string (required),
  severity: string (required, enum: low|medium|high|critical),
  action: string (required, enum: allowed|blocked),
  latency_ms: number (required, min: 0),
  country: string (required, 2-letter ISO code),
  env: string (required, enum: dev|staging|prod)
}
```

---

## Authentication Flow

```
1. Client sends POST /auth/login with credentials
2. Server validates credentials against database
3. Server generates JWT token with:
   - User ID
   - Username
   - Role (viewer, analyst, admin)
   - Expiration (24 hours)
4. Client stores token (localStorage or sessionStorage)
5. Client includes token in all future requests:
   - REST: Authorization: Bearer <token>
   - WebSocket: ?token=<token> or first message
6. Server validates token on each request
7. Server checks role permissions (RBAC)
8. If token expired → 401, client redirects to login
9. If insufficient role → 403, client shows error
```

---

## Example API Usage

### JavaScript/TypeScript (Axios)

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:3000';
let authToken = '';

// Login
async function login(username: string, password: string) {
  const response = await axios.post(`${API_URL}/auth/login`, {
    username,
    password
  });
  authToken = response.data.token;
  localStorage.setItem('token', authToken);
  return response.data.user;
}

// Get audit logs
async function getAuditLogs(filters: any) {
  const response = await axios.get(`${API_URL}/audit/logs`, {
    headers: {
      Authorization: `Bearer ${authToken}`
    },
    params: filters
  });
  return response.data;
}

// Approve rule (admin only)
async function approveRule(ruleId: number) {
  const response = await axios.post(
    `${API_URL}/rules/${ruleId}/approve`,
    {},
    {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }
  );
  return response.data;
}

// WebSocket connection
function connectToEvents() {
  const ws = new WebSocket(`ws://localhost:3000/ws/events?token=${authToken}`);
  
  ws.onopen = () => {
    console.log('Connected to event stream');
  };
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'event') {
      console.log('New event:', message.data);
      // Update UI
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  ws.onclose = () => {
    console.log('Disconnected, reconnecting...');
    setTimeout(connectToEvents, 5000);
  };
  
  return ws;
}
```

---

## Versioning

Current API Version: **v1.0.0**

Future versions will be accessible via URL prefix:
- `/v1/...` - Current version
- `/v2/...` - Future version

Breaking changes will increment the major version.

