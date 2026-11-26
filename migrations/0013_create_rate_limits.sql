-- ==============================================================================
-- 增量遷移腳本：0013_create_rate_limits.sql
-- 目的：建立分散式頻率限制與防暴力窮舉快取表，以及訂單客戶端 IP 欄位 (P2 資安防護)
-- ==============================================================================

-- 1. 訂單表擴充 client_ip 欄位
ALTER TABLE bookings ADD COLUMN client_ip TEXT;

-- 2. 建立速率限制與防暴力鎖定表
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  rate_key TEXT PRIMARY KEY,
  attempt_count INTEGER DEFAULT 1,
  reset_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_reset ON rate_limit_logs (reset_at);
