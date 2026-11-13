-- ==============================================================================
-- 檔案名稱: 0000_init_schema.sql
-- 專案名稱: 山語 Villa 官方網站
-- 資料庫引擎: Cloudflare D1 (Serverless SQLite)
-- 說明: 本腳本定義山語 Villa 核心營運之四張基礎資料表與索引結構。
-- 包含房型定價、線上直訂訂單、檔期鎖定 (Airbnb 與手動鎖房) 與排程日誌。
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. 房型與包棟方案表 (rooms)
-- 用途: 儲存山語 Villa 所有客房與全區包棟的定價政策、人數上限與基本規格。
-- 業務規則: 預設全區最多容納 14 人，分為平日與假日差別定價。
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rooms (
  -- 房型唯一識別碼 (Primary Key)，格式為英數字串，例如: 'villa-full', 'room-01', 'room-02'
  id TEXT PRIMARY KEY,
  
  -- 房型或包棟方案的繁體中文名稱，例如: '山語・全區尊榮包棟', '1樓 綠意四人景觀套房'
  name TEXT NOT NULL,
  
  -- 房型亮點副標題，例如: '1樓無障礙便利動線・大面綠意窗景・獨立乾濕分離衛浴'
  subtitle TEXT,
  
  -- 平日每晚基本定價 (新台幣 NT$)，平日定義通常為週日至週四 (非國定假日)
  base_price INTEGER NOT NULL,
  
  -- 假日每晚基本定價 (新台幣 NT$)，假日定義為週五、週六及國定連假前夕
  holiday_price INTEGER NOT NULL,
  
  -- 標準容納人數 (預設計價人數)，例如: 雙人房填 2、全區包棟填 14
  capacity_standard INTEGER NOT NULL,
  
  -- 最大可容納人數 (含加床加人後的絕對上限)，超過此人數 API 將自動阻擋防止超住
  capacity_max INTEGER NOT NULL,
  
  -- 超出標準人數時，每增加一人/每晚之加床加人費用 (新台幣 NT$)，預設 1500 元
  extra_bed_price INTEGER DEFAULT 1500,
  
  -- 房型上架啟用狀態: 1 為啟用 (官網開放預訂/展示)，0 為下架 (隱藏不開放)
  is_active INTEGER DEFAULT 1,
  
  -- 資料記錄建立時間 (UTC 時間戳記，預設當前時間)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 資料記錄最後修改更新時間
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- ------------------------------------------------------------------------------
-- 2. 訂單預約表 (bookings)
-- 用途: 儲存官網旅客送出的線上預訂單，包含訂房人個資、日期、金額計算與生命週期狀態。
-- 業務規則: 預約時需由後端進行「防撞期重疊檢查 (Overlap Check)」，互斥區間不得重複預訂。
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  -- 訂單唯一編號 (Primary Key)，格式採用語意化編號: SY-YYYYMMDD-XXXX (例: SY-20261115-8821)
  id TEXT PRIMARY KEY,
  
  -- 關聯之房型或包棟 ID，外鍵對應 rooms(id)，例如 'villa-full'
  room_id TEXT NOT NULL,
  
  -- 主要訂房人姓名 (真實中文全名)
  guest_name TEXT NOT NULL,
  
  -- 訂房人聯絡手機號碼 (用於簡訊、緊急聯繫與身分核對，格式例: 0912345678)
  guest_phone TEXT NOT NULL,
  
  -- 訂房人電子郵件信箱 (系統自動寄送預訂確認信與交通指南之目標信箱)
  guest_email TEXT NOT NULL,
  
  -- 訂房人 LINE ID (方便管家第一時間加入聯繫，為選填欄位)
  line_id TEXT,
  
  -- 本次預計入住總人數 (含成人與佔床兒童)
  guest_count INTEGER NOT NULL,
  
  -- 預計入住日期，格式嚴格限定為標準 YYYY-MM-DD (例如: 2026-11-15)
  check_in DATE NOT NULL,
  
  -- 預計退房日期，格式嚴格限定為標準 YYYY-MM-DD (例如: 2026-11-17)
  check_out DATE NOT NULL,
  
  -- 總入住晚數 (至少為 1 晚，計算公式為 check_out 日期減去 check_in 日期)
  nights INTEGER NOT NULL DEFAULT 1,
  
  -- 住宿總金額 (新台幣 NT$)，由後端依據平日/假日/晚數統一精算，避免前端竄改
  total_amount INTEGER NOT NULL,
  
  -- 應付定金金額 (新台幣 NT$)，依法規及民宿政策通常為總額之 50%
  deposit_amount INTEGER NOT NULL,
  
  -- 定金支付狀態:
  --   'UNPAID' -> 尚未支付 (下單後 24 小時內待旅客匯款)
  --   'PAID'   -> 已收到定金 (管家對帳完成後更新)
  deposit_status TEXT DEFAULT 'UNPAID',
  
  -- 訂單總體生命週期狀態:
  --   'PENDING'   -> 待確認 (剛送單，等待定金入帳)
  --   'CONFIRMED' -> 已確認 (定金入帳，正式鎖定檔期)
  --   'CANCELLED' -> 已取消 (旅客取消或逾期未匯款，自動釋放檔期)
  --   'COMPLETED' -> 已結案 (旅客已退房結帳)
  status TEXT DEFAULT 'PENDING',
  
  -- 訂單來源管道:
  --   'OFFICIAL' -> 官網線上直訂
  --   'PHONE'    -> 電話來電委託管家代訂
  --   'MANUAL'   -> 管家手動建立之保留單
  source TEXT DEFAULT 'OFFICIAL',
  
  -- 旅客填寫之特殊需求備註 (例如: 需加烤肉設備、自備嬰兒副食品、慶生佈置等)
  special_requests TEXT,
  
  -- 管家內部審核備註 (旅客不可見，例如: '11/14 已核對台銀後五碼 88219 訂金已入帳')
  admin_notes TEXT,
  
  -- 訂單建立時間戳記 (UTC)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 訂單最後修改時間戳記
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 外鍵約束: 綁定 rooms 資料表
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- 索引優化: 加速防撞期查詢與手機號碼查單速度
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings (room_id, check_in, check_out, status);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings (guest_phone);


-- ------------------------------------------------------------------------------
-- 3. 房態檔期鎖定表 (availability_blocks)
-- 用途: 彙整外部 OTA (如 Airbnb iCal 自動同步) 以及管家手動鎖定之不可預約區間。
-- 業務規則: 只要在此區間內的日期，官網行事曆組件將即時反灰禁用，防範重複訂房 (Double Booking)。
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS availability_blocks (
  -- 自動遞增唯一識別碼 (Primary Key)
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 被鎖定之房型，包棟 Villa 預設鎖定 'villa-full'
  room_id TEXT NOT NULL DEFAULT 'villa-full',
  
  -- 檔期佔用起始日，標準格式 YYYY-MM-DD
  start_date DATE NOT NULL,
  
  -- 檔期佔用結束日，標準格式 YYYY-MM-DD
  end_date DATE NOT NULL,
  
  -- 檔期鎖定原因說明，例如: 'Reserved - Airbnb', '泳池例行清洗保養', '屋主自留'
  summary TEXT NOT NULL,
  
  -- 鎖定來源管道:
  --   'AIRBNB'      -> 來自 Airbnb iCal 自動同步機制
  --   'MAINTENANCE' -> 園區設施維修保養休館
  --   'MANUAL_LOCK' -> 管家手動在後台鎖房
  source TEXT NOT NULL,
  
  -- 外部日曆事件之唯一識別碼 (UID，例如 iCal RFC 5545 UID)，具備 UNIQUE 約束，
  -- 用於防止多次定時同步時寫入重複的日曆事件
  external_uid TEXT UNIQUE,
  
  -- 建立時間戳記 (UTC)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 外鍵約束: 綁定 rooms 資料表
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- 索引優化: 加速官網日曆反灰區間之範圍比對查詢
CREATE INDEX IF NOT EXISTS idx_blocks_dates ON availability_blocks (room_id, start_date, end_date);


-- ------------------------------------------------------------------------------
-- 4. 系統排程同步日誌表 (sync_logs)
-- 用途: 追蹤與外部平台 (如 Airbnb iCal) 之定時同步歷史與異常排查。
-- 業務規則: 每次定時排程 (Cron) 或手動同步執行後自動寫入一筆紀錄，便於維運監控。
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_logs (
  -- 自動遞增日誌唯一 ID (Primary Key)
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 同步管道名稱，例如: 'AIRBNB'
  channel TEXT NOT NULL,
  
  -- 本次同步執行狀態: 'SUCCESS' (成功) 或 'FAILED' (失敗)
  status TEXT NOT NULL,
  
  -- 本次成功解析並更新之事件總筆數 (例如: 14)
  events_count INTEGER DEFAULT 0,
  
  -- 詳細日誌訊息、異常堆疊或 HTTP 回應摘要
  message TEXT,
  
  -- 排程執行時間戳記 (UTC)
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
