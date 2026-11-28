-- ==============================================================================
-- 檔案名稱: 0021_seed_viewing_deck_facility_media.sql
-- 專案名稱: 山語 Villa 官方網站
-- 資料庫引擎: Cloudflare D1 (Serverless SQLite)
-- 說明: 補全第 6 大公共設施「觀景木棧露台與璀璨星夜 (viewing-deck)」之實景寫真資產至 media_assets，
-- 使後台媒體庫之六大公設均能正確顯示實景相簿，並支援管家編輯、替換與狀態控管。
-- ==============================================================================

INSERT OR REPLACE INTO media_assets (id, category, sub_category, title_zh, title_en, tag_zh, tag_en, cdn_url, sort_order, is_active) VALUES
  ('fac-deck-01', 'facility', 'viewing-deck', '觀景木棧露台與璀璨星夜 (主景)', 'Panoramic Viewing Deck & Starlight Terrace', '觀景露台', 'Viewing Deck', '/img/homebanner/homebanner-02.webp', 1, 1),
  ('fac-deck-02', 'facility', 'viewing-deck', '露台漫步雲海・壯闊仙境視野', 'Strolling Cloud Sea & Expansive Vista', '漫步雲海', 'Cloud Sea Vista', '/img/cloud-sea/cloud-sea-01.webp', 2, 1),
  ('fac-deck-03', 'facility', 'viewing-deck', '璀璨星空夜景・浪漫微光倒影', 'Starry Sky & Ambient Night Reflections', '璀璨星夜', 'Starry Night', '/img/scenery-night/scenery-night-02.webp', 3, 1),
  ('fac-deck-04', 'facility', 'viewing-deck', '山林夜幕低垂・清幽觀星時刻', 'Mountain Twilight & Stargazing Hours', '清幽觀星', 'Stargazing', '/img/scenery-night/scenery-night-01.webp', 4, 1);
