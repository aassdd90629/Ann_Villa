-- ==============================================================================
-- 檔案名稱: 0018_create_guide_categories.sql
-- 專案名稱: 山語 Villa 官方網站
-- 資料庫引擎: Cloudflare D1 (Serverless SQLite)
-- 說明: 建立周邊景點與在地推薦之動態膠囊分類表 (guide_categories)，
-- 支援管家與業主於後台自主新增、編輯、排序與上下架周邊導覽的膠囊分類標籤，
-- 徹底解除前台分類按鈕寫死限制。
-- ==============================================================================

CREATE TABLE IF NOT EXISTS guide_categories (
  -- 分類代碼唯一值 (例如 'attraction', 'dining', 'farm', 'nature')
  id TEXT PRIMARY KEY,

  -- 分類名稱 (繁中)，顯示於膠囊按鈕
  name_zh TEXT NOT NULL,

  -- 分類名稱 (英文)
  name_en TEXT,

  -- Lucide 圖示名稱 (例如 'Compass', 'UtensilsCrossed', 'Sparkles', 'Trees', 'Camera', 'Coffee')
  icon TEXT DEFAULT 'Compass',

  -- 區塊副標籤 (繁中)，如 '精選私房推薦'、'必訪在地美味'
  tag_zh TEXT,

  -- 區塊副標籤 (英文)
  tag_en TEXT,

  -- 排序權重 (數字越小排越前)
  sort_order INTEGER DEFAULT 1,

  -- 啟用狀態: 1 為啟用顯示於前台, 0 為隱藏停用
  is_active INTEGER DEFAULT 1,

  -- 建立與最後修改時間戳記 (UTC)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guide_categories_sort ON guide_categories(is_active, sort_order ASC);

-- 注入初始標準分類 (周邊私房景點、在地特色美食)
INSERT OR IGNORE INTO guide_categories (id, name_zh, name_en, icon, tag_zh, tag_en, sort_order, is_active) VALUES
  ('attraction', '周邊景點', 'Attractions', 'Compass', '私房景點推薦', 'Curated Scenic Spots', 1, 1),
  ('dining', '在地美食', 'Local Dining', 'UtensilsCrossed', '私房美食品嚐', 'Authentic Local Dining', 2, 1);
