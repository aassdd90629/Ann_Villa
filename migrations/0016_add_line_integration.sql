-- ==============================================================================
-- 遷移腳本：0016_add_line_integration.sql
-- 目的：支援 LINE 官方帳號 (Messaging API) 全自動推播與訂單綁定體系
-- 1. bookings 新增 line_user_id (LINE 專屬 U-ID) 與 line_notified_at (最後推播時間)
-- 2. 新增 line_notification_logs 表格，詳細留存每則推播軌跡與錯誤訊息
-- ==============================================================================

ALTER TABLE bookings ADD COLUMN line_user_id TEXT;
ALTER TABLE bookings ADD COLUMN line_notified_at DATETIME;

CREATE INDEX IF NOT EXISTS idx_bookings_line_user_id ON bookings (line_user_id);

CREATE TABLE IF NOT EXISTS line_notification_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  line_user_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'SUCCESS' | 'FAILED' | 'SKIPPED'
  http_status INTEGER,
  response_body TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_line_notification_logs_booking_id ON line_notification_logs (booking_id);
CREATE INDEX IF NOT EXISTS idx_line_notification_logs_created_at ON line_notification_logs (created_at);
