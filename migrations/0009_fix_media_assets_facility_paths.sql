-- ==============================================================================
-- 檔案名稱: 0009_fix_media_assets_facility_paths.sql
-- 專案名稱: 山語 Villa 官方網站
-- 資料庫引擎: Cloudflare D1 (Serverless SQLite)
-- 說明: 修復媒體資產庫 (media_assets) 中公共設施麻將娛樂室、智能廚房、BBQ烤肉區與
-- 品茗茶席之圖片路徑，修正至專案內實際存在的實景 WebP 圖庫：
-- 1. 麻將娛樂室 -> /img/living-ktv/living-ktv-04.webp
-- 2. 智能廚房吧檯 -> /img/kitchen-bar/kitchen-bar-06.webp
-- 3. BBQ 烤肉區 -> /img/outdoor-bbq-tea/outdoor-bbq-tea-09.webp
-- 4. 品茗賞景茶席 -> /img/outdoor-bbq-tea/outdoor-bbq-tea-03.webp
-- ==============================================================================

UPDATE media_assets 
SET cdn_url = '/img/living-ktv/living-ktv-04.webp',
    thumbnail_url = '/img/living-ktv/living-ktv-04.webp',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'fac-mahjong-01' OR (category = 'facility' AND sub_category = 'mahjong' AND cdn_url LIKE '%/img/mahjong/%');

UPDATE media_assets 
SET cdn_url = '/img/kitchen-bar/kitchen-bar-06.webp',
    thumbnail_url = '/img/kitchen-bar/kitchen-bar-06.webp',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'fac-kitchen-01' OR (category = 'facility' AND sub_category = 'kitchen' AND cdn_url LIKE '%/img/kitchen/%');

UPDATE media_assets 
SET cdn_url = '/img/outdoor-bbq-tea/outdoor-bbq-tea-09.webp',
    thumbnail_url = '/img/outdoor-bbq-tea/outdoor-bbq-tea-09.webp',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'fac-bbq-01' OR (category = 'facility' AND sub_category = 'bbq' AND cdn_url LIKE '%/img/bbq/%');

UPDATE media_assets 
SET cdn_url = '/img/outdoor-bbq-tea/outdoor-bbq-tea-03.webp',
    thumbnail_url = '/img/outdoor-bbq-tea/outdoor-bbq-tea-03.webp',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'fac-tea-01' OR (category = 'facility' AND sub_category = 'tea' AND cdn_url LIKE '%/img/tea/%');
