-- ==============================================================================
-- 檔案名稱: 0005_create_media_assets.sql
-- 專案名稱: 山語 Villa 官方網站
-- 資料庫引擎: Cloudflare D1 (Serverless SQLite)
-- 說明: 建立全站圖片與媒體資產管理表 (media_assets)，支援 Cloudflare R2
-- 雲端儲存對接、首頁 Hero 輪播 11 張動態切換、五大特色客房寫真與公設體驗照。
-- ==============================================================================

CREATE TABLE IF NOT EXISTS media_assets (
  -- 唯一識別碼 (例如 'hero-slide-1', 'media-20261119-01')
  id TEXT PRIMARY KEY,
  
  -- 主分類 ('hero', 'room', 'facility', 'general')
  category TEXT NOT NULL,
  
  -- 次分類 (如 'room-1', 'room-2', 'ktv', 'mahjong', 'bbq', 'tea', 'kitchen')
  sub_category TEXT,
  
  -- 圖片中文名稱 / 描述
  title_zh TEXT NOT NULL,
  
  -- 圖片英文名稱 (支援雙語)
  title_en TEXT,
  
  -- 標籤 / Tag (如 '莊園夜色', '觀景露台')
  tag_zh TEXT,
  tag_en TEXT,
  
  -- Cloudflare R2 物件鍵 (如 'uploads/hero/20261119-01.webp') 或靜態路徑
  r2_key TEXT,
  
  -- 完整訪問 CDN URL 或本地路徑 (如 '/img/homebanner/homebanner-01.jpg')
  cdn_url TEXT NOT NULL,
  
  -- 縮圖 URL (可選)
  thumbnail_url TEXT,
  
  -- 圖片原始檔大小 (Bytes)
  file_size INTEGER DEFAULT 0,
  
  -- 圖片寬度與高度 (px)
  width INTEGER DEFAULT 1920,
  height INTEGER DEFAULT 1080,
  
  -- 排序權重 (數字越小排越前，首頁 Hero 輪播順序即以此為準)
  sort_order INTEGER DEFAULT 1,
  
  -- 啟用狀態: 1 為啟用顯示, 0 為隱藏暫停
  is_active INTEGER DEFAULT 1,
  
  -- 建立與更新時間
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立分類、啟用狀態與排序索引
CREATE INDEX IF NOT EXISTS idx_media_assets_cat ON media_assets(category, is_active, sort_order ASC);

-- ------------------------------------------------------------------------------
-- 初始首頁 Hero 輪播 11 張大圖種子資料注入
-- ------------------------------------------------------------------------------
INSERT OR IGNORE INTO media_assets (id, category, sub_category, title_zh, title_en, tag_zh, tag_en, cdn_url, sort_order, is_active) VALUES
  ('hero-slide-1', 'hero', 'banner', '星夜璀璨・豪宅山莊', 'Luminous Nightscape Estate', '莊園夜色', 'Villa Nightscape', '/img/homebanner/homebanner-01.jpg', 1, 1),
  ('hero-slide-2', 'hero', 'banner', '露台晨曦・漫步雲海仙境', 'Panoramic Viewing Deck & Morning Mist', '觀景露台雲海', 'Viewing Deck Vista', '/img/homebanner/homebanner-02.jpg', 2, 1),
  ('hero-slide-3', 'hero', 'banner', '群山環繞・自然田園風光', 'Scenic Mountain Countryside', '自然景致', 'Nature & Orchard', '/img/homebanner/homebanner-03.jpg', 3, 1),
  ('hero-slide-4', 'hero', 'banner', '山嵐漫漫・壯闊縹緲雲海', 'Sea of Clouds & Mountain Mist', '壯闊雲海', 'Sea of Clouds', '/img/homebanner/homebanner-04.jpg', 4, 1),
  ('hero-slide-5', 'hero', 'banner', '開闊綠意・專屬青翠草坪', 'Expansive Private Green Lawn', '戶外休閒草坪', 'Private Lawn', '/img/homebanner/homebanner-05.jpg', 5, 1),
  ('hero-slide-6', 'hero', 'banner', '晚霞如畫・落日彩霞暮色', 'Twilight Glow & Crimson Sunset', '落日彩霞', 'Sunset Twilight', '/img/homebanner/homebanner-06.jpg', 6, 1),
  ('hero-slide-7', 'hero', 'banner', '夜色微光・漫步翠綠草坡', 'Illuminated Gardens & Hillside Lawn', '夜間草坪步道', 'Night Garden Lawn', '/img/homebanner/homebanner-07.jpg', 7, 1),
  ('hero-slide-8', 'hero', 'banner', '隱逸山居・享受慢活時光', 'Mountain Sanctuary & Slow Living', '山莊全景', 'Estate Vista', '/img/homebanner/homebanner-08.jpg', 8, 1),
  ('hero-slide-9', 'hero', 'banner', '晨曦微露・遠眺層疊山嵐', 'Dawning Light & Layered Peaks', '晨曦山嶺', 'Morning Peaks', '/img/homebanner/homebanner-09.jpg', 9, 1),
  ('hero-slide-10', 'hero', 'banner', '雲霧繚繞・私享山林幽靜', 'Drifting Clouds & Woodland Solitude', '清幽山嵐', 'Misty Woodland', '/img/homebanner/homebanner-10.jpg', 10, 1),
  ('hero-slide-11', 'hero', 'banner', '露台星空・共度溫馨之夜', 'Starry Terrace & Cherished Moments', '星空露台聚會', 'Starry Terrace', '/img/homebanner/homebanner-11.jpg', 11, 1);

-- ------------------------------------------------------------------------------
-- 初始五大客房精選主圖種子資料注入
-- ------------------------------------------------------------------------------
INSERT OR IGNORE INTO media_assets (id, category, sub_category, title_zh, title_en, tag_zh, tag_en, cdn_url, sort_order, is_active) VALUES
  ('room-01-cover', 'room', 'room-1', '1F 綠意四人景觀套房 (封面主圖)', '1F Garden View Quad Suite Cover', '1F 四人房', '1F Quad', '/img/room-1/room-1-01.jpg', 1, 1),
  ('room-02-cover', 'room', 'room-2', '1F 山語隱逸雙人套房 (封面主圖)', '1F Serenity Double Suite Cover', '1F 雙人房', '1F Double', '/img/room-2/room-2-01.jpg', 2, 1),
  ('room-03-cover', 'room', 'room-3', '1F 風荷清幽四人套房 (封面主圖)', '1F Lotus Breeze Quad Suite Cover', '1F 四人房', '1F Quad', '/img/room-3/room-3-01.jpg', 3, 1),
  ('room-04-cover', 'room', 'room-4', '2F 星空露台四人套房 (封面主圖)', '2F Starlight Terrace Quad Suite Cover', '2F 四人房', '2F Quad', '/img/room-4/room-4-01.jpg', 4, 1),
  ('room-05-cover', 'room', 'room-5', '2F 晨曦觀景四人套房 (封面主圖)', '2F Dawn Mountain View Quad Suite Cover', '2F 四人房', '2F Quad', '/img/room-5/room-5-01.jpg', 5, 1);

-- ------------------------------------------------------------------------------
-- 初始公設休閒空間種子資料注入
-- ------------------------------------------------------------------------------
INSERT OR IGNORE INTO media_assets (id, category, sub_category, title_zh, title_en, tag_zh, tag_en, cdn_url, sort_order, is_active) VALUES
  ('fac-ktv-01', 'facility', 'living-ktv', 'Grand Lounge 奢華客廳與 KTV 劇院', 'Grand Lounge & KTV Entertainment', '客廳KTV', 'KTV Lounge', '/img/living-ktv/living-ktv-01.jpg', 1, 1),
  ('fac-mahjong-01', 'facility', 'mahjong', '頂級電動過山車麻將娛樂室', 'Automatic Mahjong Table Experience', '電動麻將', 'Mahjong', '/img/mahjong/mahjong-01.jpg', 2, 1),
  ('fac-kitchen-01', 'facility', 'kitchen', '中島開放式智能廚房與吧檯', 'Open Island Kitchen & Bar', '智能廚房', 'Kitchen', '/img/kitchen/kitchen-01.jpg', 3, 1),
  ('fac-bbq-01', 'facility', 'bbq', '戶外庭院專業美式 BBQ 烤肉區', 'Outdoor Courtyard Premium BBQ', '美式烤肉', 'BBQ Courtyard', '/img/bbq/bbq-01.jpg', 4, 1),
  ('fac-tea-01', 'facility', 'tea', '高山山景品茗賞景茶席', 'Scenic Mountain Tea Ceremony Pavilion', '品茗茶席', 'Tea Pavilion', '/img/tea/tea-01.jpg', 5, 1);
