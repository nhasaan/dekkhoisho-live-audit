-- DekkhoIsho Live Audit System - Database Schema
-- PostgreSQL Database Schema

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('viewer', 'analyst', 'admin');
CREATE TYPE rule_status AS ENUM ('draft', 'active', 'paused');
CREATE TYPE event_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE event_action AS ENUM ('allowed', 'blocked');

-- ============================================
-- TABLES
-- ============================================

-- Users Table
-- Stores user authentication and role information
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Audit Logs Table (Immutable, Append-Only)
-- Chain of custody with SHA-256 hash linking
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  username VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  target VARCHAR(255),
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
  hash VARCHAR(64) NOT NULL,
  previous_hash VARCHAR(64),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Security Events Table
-- Stores ingested security events from various sources
CREATE TABLE events (
  id VARCHAR(50) PRIMARY KEY,
  ts TIMESTAMP NOT NULL,
  source_ip VARCHAR(45) NOT NULL,
  path VARCHAR(255),
  method VARCHAR(10),
  service VARCHAR(100),
  rule_id VARCHAR(50) NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  severity event_severity NOT NULL,
  action event_action NOT NULL,
  latency_ms INTEGER NOT NULL,
  country VARCHAR(2) NOT NULL,
  env VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Security Rules Table
-- Defines security rules with approval workflow
CREATE TABLE rules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  pattern TEXT,
  severity event_severity NOT NULL,
  status rule_status DEFAULT 'draft' NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================

-- Audit Logs Indexes
CREATE INDEX idx_audit_user ON audit_logs(username);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_timestamp_id ON audit_logs(timestamp, id);
CREATE INDEX idx_audit_created_id ON audit_logs(created_at, id);
CREATE INDEX idx_audit_user_timestamp ON audit_logs(user_id, timestamp);
CREATE INDEX idx_audit_action_timestamp ON audit_logs(action, timestamp);

-- Security Events Indexes
CREATE INDEX idx_events_ts_id ON events(ts, id);
CREATE INDEX idx_events_created_id ON events(created_at, id);
CREATE INDEX idx_events_rule_ts ON events(rule_id, ts);
CREATE INDEX idx_events_severity_ts ON events(severity, ts);
CREATE INDEX idx_events_source_ip_ts ON events(source_ip, ts);
CREATE INDEX idx_events_action_ts ON events(action, ts);

-- Security Rules Indexes
CREATE INDEX idx_rules_status_created_id ON rules(status, created_at, id);
CREATE INDEX idx_rules_created_id ON rules(created_at, id);
CREATE INDEX idx_rules_creator_created ON rules(created_by, created_at);
CREATE INDEX idx_rules_severity_status ON rules(severity, status);

-- ============================================
-- SEED DATA
-- ============================================

-- Default Users (password: 123)
-- Note: Password hashes should be generated with bcrypt in application code
INSERT INTO users (username, password_hash, role) VALUES
  ('viewer', '$2b$10$hashedpassword', 'viewer'),
  ('analyst', '$2b$10$hashedpassword', 'analyst'),
  ('admin', '$2b$10$hashedpassword', 'admin')
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- NOTES
-- ============================================

-- 1. Audit Logs:
--    - APPEND-ONLY: Never update or delete
--    - Hash Chain: Each entry links to previous via hash
--    - Verification: Can detect tampering by recomputing hashes

-- 2. Events:
--    - High volume: Expect millions of records
--    - Cursor Pagination: Use (ts, id) compound index
--    - TTL: Consider partitioning or archiving old data

-- 3. Rules:
--    - Workflow: draft → active (via approval)
--    - Admin can pause/resume active rules
--    - Analysts can only create drafts

-- 4. Redis (not in SQL):
--    - rule:count:{rule_id} - 15-minute rolling counters
--    - stats:top_rules - Sorted set for top rules
--    - All keys have 900s TTL (15 minutes)

