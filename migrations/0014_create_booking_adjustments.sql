-- ==============================================================================
-- 遷移腳本：0014_create_booking_adjustments.sql
-- 目的：支援 P3 極端業務與現場營運情境
-- 1. 於 bookings 表擴充取消原因分類 (cancel_reason_category) 與取消備註 (cancel_reason_note)
-- 2. 新建 booking_adjustments 現場費用調整子表 (支援加人加床、雜費、折扣折讓與尾款核銷)
-- ==============================================================================

-- 1. 擴充 bookings 表取消分類與備註欄位
ALTER TABLE bookings ADD COLUMN cancel_reason_category TEXT;
ALTER TABLE bookings ADD COLUMN cancel_reason_note TEXT;

-- 2. 建立現場費用調整表 (booking_adjustments)
CREATE TABLE IF NOT EXISTS booking_adjustments (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  title TEXT NOT NULL,
  amount INTEGER NOT NULL,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT DEFAULT 'admin',
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_booking_adjustments_booking_id ON booking_adjustments(booking_id);
