-- 0000_init_schema.sql: 山語 Villa 核心資料庫結構

-- 1. 房型與包棟方案表
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT,
  base_price INTEGER NOT NULL,
  holiday_price INTEGER NOT NULL,
  capacity_standard INTEGER NOT NULL,
  capacity_max INTEGER NOT NULL,
  extra_bed_price INTEGER DEFAULT 1500,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 訂單預約表
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  line_id TEXT,
  guest_count INTEGER NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER NOT NULL DEFAULT 1,
  total_amount INTEGER NOT NULL,
  deposit_amount INTEGER NOT NULL,
  deposit_status TEXT DEFAULT 'UNPAID',
  status TEXT DEFAULT 'PENDING',
  source TEXT DEFAULT 'OFFICIAL',
  special_requests TEXT,
  admin_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings (room_id, check_in, check_out, status);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings (guest_phone);

-- 3. 檔期鎖定表 (Airbnb iCal 與手動保留)
CREATE TABLE IF NOT EXISTS availability_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL DEFAULT 'villa-full',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  summary TEXT NOT NULL,
  source TEXT NOT NULL,
  external_uid TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blocks_dates ON availability_blocks (room_id, start_date, end_date);

-- 4. 系統同步日誌表
CREATE TABLE IF NOT EXISTS sync_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  events_count INTEGER DEFAULT 0,
  message TEXT,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

