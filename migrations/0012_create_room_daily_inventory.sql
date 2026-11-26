-- ==============================================================================
-- 增量遷移腳本：0012_create_room_daily_inventory.sql
-- 目的：建立每日庫存排他表，於資料庫層物理杜絕高併發同毫秒搶訂撞期 (Double Booking)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS room_daily_inventory (
  room_id TEXT NOT NULL,
  occupy_date TEXT NOT NULL,
  booking_id TEXT NOT NULL,
  source TEXT DEFAULT 'BOOKING', -- 'BOOKING' 或 'MANUAL_LOCK'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (room_id, occupy_date)
);

CREATE INDEX IF NOT EXISTS idx_inventory_booking_id ON room_daily_inventory (booking_id);
CREATE INDEX IF NOT EXISTS idx_inventory_date ON room_daily_inventory (occupy_date);

-- 自動將現有未取消之正式訂單同步至每日庫存排他表
WITH RECURSIVE dates(room_id, booking_id, source, occupy_date, end_date) AS (
  SELECT room_id, id, 'BOOKING', check_in, check_out FROM bookings WHERE status != 'CANCELLED'
  UNION ALL
  SELECT room_id, booking_id, source, date(occupy_date, '+1 day'), end_date
  FROM dates
  WHERE date(occupy_date, '+1 day') < end_date
)
INSERT OR IGNORE INTO room_daily_inventory (room_id, occupy_date, booking_id, source)
SELECT room_id, occupy_date, booking_id, source FROM dates;

-- 自動將現有管家鎖房同步至每日庫存排他表
WITH RECURSIVE block_dates(room_id, booking_id, source, occupy_date, end_date) AS (
  SELECT room_id, external_uid, 'MANUAL_LOCK', start_date, end_date FROM availability_blocks
  UNION ALL
  SELECT room_id, booking_id, source, date(occupy_date, '+1 day'), end_date
  FROM block_dates
  WHERE date(occupy_date, '+1 day') < end_date
)
INSERT OR IGNORE INTO room_daily_inventory (room_id, occupy_date, booking_id, source)
SELECT room_id, occupy_date, booking_id, source FROM block_dates;
