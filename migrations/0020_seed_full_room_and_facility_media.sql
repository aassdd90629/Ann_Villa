-- ==============================================================================
-- 檔案名稱: 0020_seed_full_room_and_facility_media.sql
-- 專案名稱: 山語 Villa 官方網站
-- 資料庫引擎: Cloudflare D1 (Serverless SQLite)
-- 說明: 補全五大客房寫真與園區公設休閒照之全量多角度實景寫真資產，
-- 讓後台媒體庫之五大房型與五大公設具備完整寫真圖集（每房型 4~5 張、每公設 3~6 張），
-- 支援管家全面維護、編輯換圖與切換「上架中 / 草稿」狀態。
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. 五大特色獨立客房寫真全量注入 (共 22 張實景相片)
-- ------------------------------------------------------------------------------

-- 1F 綠意四人景觀套房 (room-1)
INSERT OR REPLACE INTO media_assets (id, category, sub_category, title_zh, title_en, tag_zh, tag_en, cdn_url, sort_order, is_active) VALUES
  ('room-01-cover', 'room', 'room-1', '1F 綠意四人景觀套房 (封面主圖)', '1F Garden View Quad Suite Cover', '1F 四人房', '1F Quad', '/img/room-1/room-1-01.webp', 1, 1),
  ('room-01-photo-02', 'room', 'room-1', '1F 綠意四人套房 - 晨光大面窗景', '1F Garden View Quad Suite - Window Vista', '1F 四人房', '1F Quad', '/img/room-1/room-1-02.webp', 2, 1),
  ('room-01-photo-03', 'room', 'room-1', '1F 綠意四人套房 - 雙大床舒眠空間', '1F Garden View Quad Suite - Double Beds', '1F 四人房', '1F Quad', '/img/room-1/room-1-03.webp', 3, 1),
  ('room-01-photo-04', 'room', 'room-1', '1F 綠意四人套房 - 乾濕分離獨立衛浴', '1F Garden View Quad Suite - Ensuite Bath', '1F 四人房', '1F Quad', '/img/room-1/room-1-04.webp', 4, 1),
  ('room-01-photo-05', 'room', 'room-1', '1F 綠意四人套房 - 溫潤木質調休閒角', '1F Garden View Quad Suite - Lounge Corner', '1F 四人房', '1F Quad', '/img/room-1/room-1-05.webp', 5, 1);

-- 1F 山語隱逸雙人套房 (room-2)
INSERT OR REPLACE INTO media_assets (id, category, sub_category, title_zh, title_en, tag_zh, tag_en, cdn_url, sort_order, is_active) VALUES
  ('room-02-cover', 'room', 'room-2', '1F 山語隱逸雙人套房 (封面主圖)', '1F Serenity Double Suite Cover', '1F 雙人房', '1F Double', '/img/room-2/room-2-01.webp', 1, 1),
  ('room-02-photo-02', 'room', 'room-2', '1F 山語隱逸雙人套房 - 加大 Queen 舒眠名床', '1F Serenity Double Suite - Queen Bed', '1F 雙人房', '1F Double', '/img/room-2/room-2-02.webp', 2, 1),
  ('room-02-photo-03', 'room', 'room-2', '1F 山語隱逸雙人套房 - 私密沙發休憩茶几', '1F Serenity Double Suite - Sofa Lounge', '1F 雙人房', '1F Double', '/img/room-2/room-2-03.webp', 3, 1),
  ('room-02-photo-04', 'room', 'room-2', '1F 山語隱逸雙人套房 - 乾濕分離衛浴空間', '1F Serenity Double Suite - Ensuite Bath', '1F 雙人房', '1F Double', '/img/room-2/room-2-04.webp', 4, 1),
  ('room-02-photo-05', 'room', 'room-2', '1F 山語隱逸雙人套房 - 質樸石木肌理光影', '1F Serenity Double Suite - Natural Textures', '1F 雙人房', '1F Double', '/img/room-2/room-2-05.webp', 5, 1);

-- 1F 風荷清幽四人套房 (room-3)
INSERT OR REPLACE INTO media_assets (id, category, sub_category, title_zh, title_en, tag_zh, tag_en, cdn_url, sort_order, is_active) VALUES
  ('room-03-cover', 'room', 'room-3', '1F 風荷清幽四人套房 (封面主圖)', '1F Lotus Breeze Quad Suite Cover', '1F 四人房', '1F Quad', '/img/room-3/room-3-01.webp', 1, 1),
  ('room-03-photo-02', 'room', 'room-3', '1F 風荷清幽四人套房 - 兩張舒適雙人床', '1F Lotus Breeze Quad Suite - 2 Double Beds', '1F 四人房', '1F Quad', '/img/room-3/room-3-02.webp', 2, 1),
  ('room-03-photo-03', 'room', 'room-3', '1F 風荷清幽四人套房 - 開闊採光與原木家具', '1F Lotus Breeze Quad Suite - Natural Timber', '1F 四人房', '1F Quad', '/img/room-3/room-3-03.webp', 3, 1),
  ('room-03-photo-04', 'room', 'room-3', '1F 風荷清幽四人套房 - 獨立衛浴與精緻備品', '1F Lotus Breeze Quad Suite - Bathroom', '1F 四人房', '1F Quad', '/img/room-3/room-3-04.webp', 4, 1);

-- 2F 星空露台四人套房 (room-4)
INSERT OR REPLACE INTO media_assets (id, category, sub_category, title_zh, title_en, tag_zh, tag_en, cdn_url, sort_order, is_active) VALUES
  ('room-04-cover', 'room', 'room-4', '2F 星空露台四人套房 (封面主圖)', '2F Starlight Terrace Quad Suite Cover', '2F 四人房', '2F Quad', '/img/room-4/room-4-01.webp', 1, 1),
  ('room-04-photo-02', 'room', 'room-4', '2F 星空露台四人套房 - 雙床配置與全景採光', '2F Starlight Terrace Quad Suite - Panoramic Light', '2F 四人房', '2F Quad', '/img/room-4/room-4-02.webp', 2, 1),
  ('room-04-photo-03', 'room', 'room-4', '2F 星空露台四人套房 - 專屬獨立觀星露台', '2F Starlight Terrace Quad Suite - Private Terrace', '2F 四人房', '2F Quad', '/img/room-4/room-4-03.webp', 3, 1),
  ('room-04-photo-04', 'room', 'room-4', '2F 星空露台四人套房 - 乾濕分離景觀衛浴', '2F Starlight Terrace Quad Suite - View Bathroom', '2F 四人房', '2F Quad', '/img/room-4/room-4-04.webp', 4, 1);

-- 2F 晨曦觀景四人套房 (room-5)
INSERT OR REPLACE INTO media_assets (id, category, sub_category, title_zh, title_en, tag_zh, tag_en, cdn_url, sort_order, is_active) VALUES
  ('room-05-cover', 'room', 'room-5', '2F 晨曦觀景四人套房 (封面主圖)', '2F Dawn Mountain View Quad Suite Cover', '2F 四人房', '2F Quad', '/img/room-5/room-5-01.webp', 1, 1),
  ('room-05-photo-02', 'room', 'room-5', '2F 晨曦觀景四人套房 - 晨曦山巒遼闊全景', '2F Dawn Mountain View Quad Suite - Mountain Vista', '2F 四人房', '2F Quad', '/img/room-5/room-5-02.webp', 2, 1),
  ('room-05-photo-03', 'room', 'room-5', '2F 晨曦觀景四人套房 - 舒適雙人床休憩空間', '2F Dawn Mountain View Quad Suite - Double Beds', '2F 四人房', '2F Quad', '/img/room-5/room-5-03.webp', 3, 1),
  ('room-05-photo-04', 'room', 'room-5', '2F 晨曦觀景四人套房 - 質感衛浴與沐浴備品', '2F Dawn Mountain View Quad Suite - Bathroom', '2F 四人房', '2F Quad', '/img/room-5/room-5-04.webp', 4, 1);

-- ------------------------------------------------------------------------------
-- 2. 園區公共設施休閒照全量注入 (共 22 張實景相片)
-- ------------------------------------------------------------------------------

-- Grand Lounge 奢華客廳與 KTV 劇院 (living-ktv)
INSERT OR REPLACE INTO media_assets (id, category, sub_category, title_zh, title_en, tag_zh, tag_en, cdn_url, sort_order, is_active) VALUES
  ('fac-ktv-01', 'facility', 'living-ktv', 'Grand Lounge 奢華客廳與 KTV 劇院 (主景)', 'Grand Lounge & KTV Entertainment', '客廳KTV', 'KTV Lounge', '/img/living-ktv/living-ktv-01.webp', 1, 1),
  ('fac-ktv-02', 'facility', 'living-ktv', '頂級劇院音響與歡唱沙發座席', 'Premium Sound System & Lounge Sofas', '客廳KTV', 'KTV Lounge', '/img/living-ktv/living-ktv-02.webp', 2, 1),
  ('fac-ktv-03', 'facility', 'living-ktv', '巨幕投影劇院與奢華暖調氛圍', 'Large Screen Theater & Warm Ambience', '客廳KTV', 'KTV Lounge', '/img/living-ktv/living-ktv-03.webp', 3, 1),
  ('fac-ktv-04', 'facility', 'living-ktv', '多功能聚會空間與休憩座席', 'Multifunctional Gathering Lounge', '客廳KTV', 'KTV Lounge', '/img/living-ktv/living-ktv-04.webp', 4, 1),
  ('fac-ktv-05', 'facility', 'living-ktv', '夜間莊園溫馨聚會暖光造景', 'Warm Night Illumination & Gathering', '客廳KTV', 'KTV Lounge', '/img/living-ktv/living-ktv-05.webp', 5, 1);

-- 頂級電動過山車麻將娛樂室 (mahjong)
INSERT OR REPLACE INTO media_assets (id, category, sub_category, title_zh, title_en, tag_zh, tag_en, cdn_url, sort_order, is_active) VALUES
  ('fac-mahjong-01', 'facility', 'mahjong', '頂級電動過山車麻將娛樂室 (主景)', 'Automatic Mahjong Table Experience', '電動麻將', 'Mahjong', '/img/living-ktv/living-ktv-04.webp', 1, 1),
  ('fac-mahjong-02', 'facility', 'mahjong', '麻將娛樂區舒適軟質沙發椅', 'Comfortable Mahjong Seating Area', '電動麻將', 'Mahjong', '/img/living-ktv/living-ktv-02.webp', 2, 1),
  ('fac-mahjong-03', 'facility', 'mahjong', '休閒通宵棋牌娛樂配備', 'All-Night Board Game & Mahjong Lounge', '電動麻將', 'Mahjong', '/img/living-ktv/living-ktv-05.webp', 3, 1);

-- 中島開放式智能廚房與吧檯 (kitchen)
INSERT OR REPLACE INTO media_assets (id, category, sub_category, title_zh, title_en, tag_zh, tag_en, cdn_url, sort_order, is_active) VALUES
  ('fac-kitchen-01', 'facility', 'kitchen', '中島開放式智能廚房與吧檯 (主景)', 'Open Island Kitchen & Bar', '智能廚房', 'Kitchen', '/img/kitchen-bar/kitchen-bar-06.webp', 1, 1),
  ('fac-kitchen-02', 'facility', 'kitchen', '私廚饗宴高腳調酒吧檯', 'Chef Dining & High Bar Stools', '智能廚房', 'Kitchen', '/img/kitchen-bar/kitchen-bar-01.webp', 2, 1),
  ('fac-kitchen-03', 'facility', 'kitchen', '齊全進口智能廚具與烹飪家電', 'Imported Smart Cookware & Appliances', '智能廚房', 'Kitchen', '/img/kitchen-bar/kitchen-bar-02.webp', 3, 1),
  ('fac-kitchen-04', 'facility', 'kitchen', '氣派聚餐長桌與溫馨用餐區', 'Banquet Dining Table & Family Seating', '智能廚房', 'Kitchen', '/img/kitchen-bar/kitchen-bar-03.webp', 4, 1),
  ('fac-kitchen-05', 'facility', 'kitchen', '專業義式咖啡機與飲品調配區', 'Espresso Machine & Beverage Bar', '智能廚房', 'Kitchen', '/img/kitchen-bar/kitchen-bar-04.webp', 5, 1),
  ('fac-kitchen-06', 'facility', 'kitchen', '寬敞備料中島與收納動線', 'Spacious Food Prep Island & Layout', '智能廚房', 'Kitchen', '/img/kitchen-bar/kitchen-bar-05.webp', 6, 1);

-- 戶外庭院專業美式 BBQ 烤肉區 (bbq)
INSERT OR REPLACE INTO media_assets (id, category, sub_category, title_zh, title_en, tag_zh, tag_en, cdn_url, sort_order, is_active) VALUES
  ('fac-bbq-01', 'facility', 'bbq', '戶外庭院專業美式 BBQ 烤肉區 (主景)', 'Outdoor Courtyard Premium BBQ', '美式烤肉', 'BBQ Courtyard', '/img/outdoor-bbq-tea/outdoor-bbq-tea-09.webp', 1, 1),
  ('fac-bbq-02', 'facility', 'bbq', '星空庭院戶外烤肉長桌餐席', 'Starry Courtyard Outdoor Dining Table', '美式烤肉', 'BBQ Courtyard', '/img/outdoor-bbq-tea/outdoor-bbq-tea-10.webp', 2, 1),
  ('fac-bbq-03', 'facility', 'bbq', '夜間戶外青翠草坪露天聚會', 'Evening Hillside Lawn Gathering', '美式烤肉', 'BBQ Courtyard', '/img/outdoor-bbq-tea/outdoor-bbq-tea-08.webp', 3, 1),
  ('fac-bbq-04', 'facility', 'bbq', '戶外木棧平台休閒景觀座席', 'Timber Deck Outdoor Lounge Patio', '美式烤肉', 'BBQ Courtyard', '/img/outdoor-bbq-tea/outdoor-bbq-tea-11.webp', 4, 1);

-- 高山山景品茗賞景茶席 (tea)
INSERT OR REPLACE INTO media_assets (id, category, sub_category, title_zh, title_en, tag_zh, tag_en, cdn_url, sort_order, is_active) VALUES
  ('fac-tea-01', 'facility', 'tea', '高山山景品茗賞景茶席 (主景)', 'Scenic Mountain Tea Ceremony Pavilion', '品茗茶席', 'Tea Pavilion', '/img/outdoor-bbq-tea/outdoor-bbq-tea-03.webp', 1, 1),
  ('fac-tea-02', 'facility', 'tea', '半戶外茶座遠眺層疊山嵐仙境', 'Covered Viewing Tea Lounge & Peaks', '品茗茶席', 'Tea Pavilion', '/img/outdoor-bbq-tea/outdoor-bbq-tea-04.webp', 2, 1),
  ('fac-tea-03', 'facility', 'tea', '天然原木大茶桌與功夫茶具', 'Natural Timber Tea Table & Kung Fu Set', '品茗茶席', 'Tea Pavilion', '/img/outdoor-bbq-tea/outdoor-bbq-tea-06.webp', 3, 1),
  ('fac-tea-04', 'facility', 'tea', '翠綠林間微風伴隨品茗時刻', 'Breezy Mountain Forest Tea Sanctuary', '品茗茶席', 'Tea Pavilion', '/img/outdoor-bbq-tea/outdoor-bbq-tea-02.webp', 4, 1);
