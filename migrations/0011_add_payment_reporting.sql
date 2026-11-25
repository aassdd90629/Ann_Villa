-- ==============================================================================
-- 增量遷移腳本：0011_add_payment_reporting.sql
-- 目的：支援旅客訂單查詢與線上自主回報定金匯款末五碼
-- ==============================================================================

-- 1. 新增旅客回報匯款末五碼與回報時間
ALTER TABLE bookings ADD COLUMN bank_last_5 TEXT;
ALTER TABLE bookings ADD COLUMN payment_reported_at DATETIME;
ALTER TABLE bookings ADD COLUMN payment_note TEXT;

-- 2. 建立手機與電子信箱複合查詢索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_bookings_lookup ON bookings (guest_phone, guest_email);
