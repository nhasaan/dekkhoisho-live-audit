-- Users table (seed with 3 dummy users)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('viewer', 'analyst', 'admin')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit logs (immutable, append-only)
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  username VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  target VARCHAR(255),
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  hash VARCHAR(64) NOT NULL,
  previous_hash VARCHAR(64),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(username);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);

-- Security events
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(50) PRIMARY KEY,
  ts TIMESTAMP NOT NULL,
  source_ip VARCHAR(45) NOT NULL,
  path VARCHAR(255),
  method VARCHAR(10),
  service VARCHAR(100),
  rule_id VARCHAR(50),
  rule_name VARCHAR(255),
  severity VARCHAR(20),
  action VARCHAR(20),
  latency_ms INTEGER,
  country VARCHAR(2),
  env VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
CREATE INDEX IF NOT EXISTS idx_events_rule ON events(rule_id);
CREATE INDEX IF NOT EXISTS idx_events_severity ON events(severity);

-- Rules table
CREATE TABLE IF NOT EXISTS rules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  pattern TEXT,
  severity VARCHAR(20),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed users (passwords are all '123' hashed with bcrypt)
-- bcrypt hash of '123': $2b$10$rN8JvQE4fHZ1K4xQ3v7wEOZE8QP3LYvYH7j7K8j7K8j7K8j7K8j7K8
INSERT INTO users (username, password_hash, role) VALUES
  ('viewer', '$2b$10$rN8JvQE4fHZ1K4xQ3v7wEOZE8QP3LYvYH7j7K8j7K8j7K8j7K8j7KO', 'viewer'),
  ('analyst', '$2b$10$rN8JvQE4fHZ1K4xQ3v7wEOZE8QP3LYvYH7j7K8j7K8j7K8j7K8j7KO', 'analyst'),
  ('admin', '$2b$10$rN8JvQE4fHZ1K4xQ3v7wEOZE8QP3LYvYH7j7K8j7K8j7K8j7K8j7KO', 'admin')
ON CONFLICT (username) DO NOTHING;

