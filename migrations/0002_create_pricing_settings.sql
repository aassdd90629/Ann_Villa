-- ==============================================================================
-- 檔案名稱: 0002_create_pricing_settings.sql
-- 專案名稱: 山語 Villa 官方網站
-- 資料庫引擎: Cloudflare D1 (Serverless SQLite)
-- 說明: 本增量遷移腳本建立全站動態定價設定表 (pricing_settings) 與國定連續假期表 (holiday_rates)，
-- 支援管家後台可視化即時調整平假日分級價格、一般假日與連假專案價，免改程式碼即可全站生效。
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. 全站通用定價設定表 (pricing_settings)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 注入初始通用價格設定 (依業主 2026 最新營運標準)
INSERT OR REPLACE INTO pricing_settings (setting_key, setting_value, description) VALUES
('weekday_tier1_price', '20000', '平日 10人以下每晚包棟價格 (NT$, 含早餐)'),
('weekday_tier2_price', '25000', '平日 11-14人每晚包棟價格 (NT$, 含早餐)'),
('weekday_tier3_price', '30000', '平日 15-18人每晚包棟價格 (NT$, 含早餐)'),
('weekend_price', '35000', '一般假日 (週五至週日) 每晚包棟價格 (NT$, 含早餐)'),
('deposit_amount', '3000', '現場入住押金 (NT$, 退房無損退還)'),
('max_capacity', '18', '全區包棟最高容納人數 (最多18人, 無加床)'),
('check_in_time', '15:00', '標準入住時間'),
('check_out_time', '11:00', '標準退房時間');

-- ------------------------------------------------------------------------------
-- 2. 國定假日與連續假期專案價目表 (holiday_rates)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS holiday_rates (
  id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  name_en TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price INTEGER NOT NULL,
  has_breakfast INTEGER DEFAULT 1, -- 1: 含早餐, 0: 不含早餐 (過年不提供)
  note_zh TEXT,
  note_en TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_holiday_rates_dates ON holiday_rates(start_date, end_date);

-- 注入現有 2026-2028 年度國定連續假期資料 (一律自假日前一天起算)
INSERT OR REPLACE INTO holiday_rates (id, name_zh, name_en, start_date, end_date, price, has_breakfast, note_zh, sort_order) VALUES
('h-2026-xmas', '2026 聖誕節連假', '2026 Christmas Holiday', '2026-12-24', '2026-12-27', 47000, 1, '含精緻手作早餐', 1),
('h-2026-nye', '2026 跨年假期', '2026 New Year''s Eve', '2026-12-31', '2027-01-01', 47000, 1, '含精緻手作早餐', 2),
('h-2027-ny', '2027 元旦連假', '2027 New Year Holiday', '2027-01-01', '2027-01-03', 47000, 1, '含精緻手作早餐', 3),
('h-2027-cny', '2027 農曆春節過年連假', '2027 Lunar New Year Holiday', '2027-02-04', '2027-02-10', 50000, 0, '春節期間不提供早餐', 4),
('h-2027-228', '2027 和平紀念日連假', '2027 Peace Memorial Day Holiday', '2027-02-26', '2027-03-01', 38000, 1, '含精緻手作早餐', 5),
('h-2027-tomb', '2027 清明與兒童連假', '2027 Children''s & Tomb Sweeping Day', '2027-04-02', '2027-04-06', 38000, 1, '含精緻手作早餐', 6),
('h-2027-labor', '2027 五一勞動節連假', '2027 Labor Day Holiday', '2027-04-29', '2027-05-02', 38000, 1, '含精緻手作早餐', 7),
('h-2027-dragon', '2027 端午連假', '2027 Dragon Boat Festival Holiday', '2027-06-08', '2027-06-09', 35000, 1, '含精緻手作早餐', 8),
('h-2027-moon', '2027 中秋連假', '2027 Mid-Autumn Festival Holiday', '2027-09-14', '2027-09-15', 35000, 1, '含精緻手作早餐', 9),
('h-2027-teacher', '2027 教師節連假', '2027 Teachers'' Day Holiday', '2027-09-27', '2027-09-28', 35000, 1, '含精緻手作早餐', 10),
('h-2027-national', '2027 雙十國慶連假', '2027 National Day Holiday', '2027-10-08', '2027-10-11', 38000, 1, '含精緻手作早餐', 11),
('h-2027-retro', '2027 光復節連假', '2027 Retrocession Day Holiday', '2027-10-22', '2027-10-25', 38000, 1, '含精緻手作早餐', 12),
('h-2027-xmas', '2027 聖誕連假', '2027 Christmas Holiday', '2027-12-23', '2027-12-26', 47000, 1, '含精緻手作早餐', 13),
('h-2028-ny', '2028 跨年元旦連假', '2028 New Year''s Eve & New Year Holiday', '2027-12-30', '2028-01-02', 47000, 1, '含精緻手作早餐', 14);
