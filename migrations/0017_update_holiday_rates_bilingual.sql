-- ==============================================================================
-- 檔案名稱: 0017_update_holiday_rates_bilingual.sql
-- 專案名稱: 山語 Villa 官方網站
-- 資料庫引擎: Cloudflare D1 (Serverless SQLite)
-- 說明: 本增量遷移腳本確保 holiday_rates 資料表完全支援中英雙語動態設定。
-- 1. 更新標準國定連續假期的 name_en 欄位為標準英譯。
-- 2. 針對所有尚未設定 name_en 或 name_en 為空的連假紀錄，依其名稱特徵補齊雙語名稱，確保前後台雙語切換無死角。
-- ==============================================================================

-- 1. 確保現有 14 筆標準連續假期的英譯完整性
UPDATE holiday_rates SET name_en = '2026 Christmas Holiday' WHERE id = 'h-2026-xmas';
UPDATE holiday_rates SET name_en = '2026 New Year''s Eve' WHERE id = 'h-2026-nye';
UPDATE holiday_rates SET name_en = '2027 New Year Holiday' WHERE id = 'h-2027-ny';
UPDATE holiday_rates SET name_en = '2027 Lunar New Year Holiday' WHERE id = 'h-2027-cny';
UPDATE holiday_rates SET name_en = '2027 Peace Memorial Day Holiday' WHERE id = 'h-2027-228';
UPDATE holiday_rates SET name_en = '2027 Children''s & Tomb Sweeping Day' WHERE id = 'h-2027-tomb';
UPDATE holiday_rates SET name_en = '2027 Labor Day Holiday' WHERE id = 'h-2027-labor';
UPDATE holiday_rates SET name_en = '2027 Dragon Boat Festival Holiday' WHERE id = 'h-2027-dragon';
UPDATE holiday_rates SET name_en = '2027 Mid-Autumn Festival Holiday' WHERE id = 'h-2027-moon';
UPDATE holiday_rates SET name_en = '2027 Teachers'' Day Holiday' WHERE id = 'h-2027-teacher';
UPDATE holiday_rates SET name_en = '2027 National Day Holiday' WHERE id = 'h-2027-national';
UPDATE holiday_rates SET name_en = '2027 Retrocession Day Holiday' WHERE id = 'h-2027-retro';
UPDATE holiday_rates SET name_en = '2027 Christmas Holiday' WHERE id = 'h-2027-xmas';
UPDATE holiday_rates SET name_en = '2028 New Year''s Eve & New Year Holiday' WHERE id = 'h-2028-ny';

-- 2. 針對匯入或自訂之連假，若 name_en 為 NULL 或空字串，依關鍵字補全預設英譯
UPDATE holiday_rates 
SET name_en = 'Lunar New Year Holiday' 
WHERE (name_en IS NULL OR TRIM(name_en) = '') AND (name_zh LIKE '%春節%' OR name_zh LIKE '%過年%');

UPDATE holiday_rates 
SET name_en = 'New Year Holiday' 
WHERE (name_en IS NULL OR TRIM(name_en) = '') AND name_zh LIKE '%元旦%';

UPDATE holiday_rates 
SET name_en = 'New Year''s Eve' 
WHERE (name_en IS NULL OR TRIM(name_en) = '') AND name_zh LIKE '%跨年%';

UPDATE holiday_rates 
SET name_en = 'Peace Memorial Day Holiday' 
WHERE (name_en IS NULL OR TRIM(name_en) = '') AND (name_zh LIKE '%和平%' OR name_zh LIKE '%228%');

UPDATE holiday_rates 
SET name_en = 'Children''s & Tomb Sweeping Day' 
WHERE (name_en IS NULL OR TRIM(name_en) = '') AND (name_zh LIKE '%清明%' OR name_zh LIKE '%兒童%');

UPDATE holiday_rates 
SET name_en = 'Labor Day Holiday' 
WHERE (name_en IS NULL OR TRIM(name_en) = '') AND name_zh LIKE '%勞動%';

UPDATE holiday_rates 
SET name_en = 'Dragon Boat Festival Holiday' 
WHERE (name_en IS NULL OR TRIM(name_en) = '') AND name_zh LIKE '%端午%';

UPDATE holiday_rates 
SET name_en = 'Mid-Autumn Festival Holiday' 
WHERE (name_en IS NULL OR TRIM(name_en) = '') AND name_zh LIKE '%中秋%';

UPDATE holiday_rates 
SET name_en = 'Teachers'' Day Holiday' 
WHERE (name_en IS NULL OR TRIM(name_en) = '') AND name_zh LIKE '%教師%';

UPDATE holiday_rates 
SET name_en = 'National Day Holiday' 
WHERE (name_en IS NULL OR TRIM(name_en) = '') AND (name_zh LIKE '%國慶%' OR name_zh LIKE '%雙十%');

UPDATE holiday_rates 
SET name_en = 'Retrocession Day Holiday' 
WHERE (name_en IS NULL OR TRIM(name_en) = '') AND name_zh LIKE '%光復%';

UPDATE holiday_rates 
SET name_en = 'Christmas Holiday' 
WHERE (name_en IS NULL OR TRIM(name_en) = '') AND name_zh LIKE '%聖誕%';

-- 3. 兜底保護：若仍有任何未匹配之新假期，設定為 Holiday Special
UPDATE holiday_rates 
SET name_en = 'Holiday Special' 
WHERE name_en IS NULL OR TRIM(name_en) = '';
