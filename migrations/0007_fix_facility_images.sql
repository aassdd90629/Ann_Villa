-- ==============================================================================
-- 檔案名稱: 0007_fix_facility_images.sql
-- 專案名稱: 山語 Villa 官方網站
-- 資料庫引擎: Cloudflare D1 (Serverless SQLite)
-- 說明: 修復公共設施 (facilities) 資料表中麻將室、戶外BBQ烤肉與品茗茶席之圖片路徑，
-- 對應至專案內實際存在的高畫質實景 WebP 圖庫 (/img/outdoor-bbq-tea 與 /img/living-ktv)。
-- ==============================================================================

-- 1. 更新麻將娛樂室圖片
INSERT OR REPLACE INTO facilities (
  id, title_zh, title_en, desc_zh, desc_en, image,
  features_zh_json, features_en_json, gallery_json, sort_order, is_active
) VALUES (
  'mahjong-room',
  '頂級電動過山車麻將娛樂室',
  'Automatic Mahjong Table Experience',
  '專屬配置最新型全自動過山車靜音電動麻將桌，洗牌迅速順暢、零噪音打擾。舒適人體工學皮椅與明亮採光，是好友徹夜切磋的最佳娛樂。',
  'Features the latest whisper-quiet automatic mahjong table with rapid shuffling and zero jams. Ergonomic executive chairs ensure comfortable gaming sessions.',
  '/img/living-ktv/living-ktv-04.webp',
  '["最新四口過山車全自動靜音洗牌機","配備兩副頂級磁吸刻字專用麻將牌","人體工學高承重透氣皮椅","專屬飲料杯架與籌碼置物槽"]',
  '["Whisper-quiet auto-shuffling table mechanism","Dual sets of weighted engraved tiles","Ergonomic supportive executive seating","Integrated cup holders and chip trays"]',
  '["/img/living-ktv/living-ktv-04.webp","/img/living-ktv/living-ktv-02.webp","/img/living-ktv/living-ktv-05.webp"]',
  3, 1
);

-- 2. 更新戶外庭園美式烤肉 BBQ 區圖片
INSERT OR REPLACE INTO facilities (
  id, title_zh, title_en, desc_zh, desc_en, image,
  features_zh_json, features_en_json, gallery_json, sort_order, is_active
) VALUES (
  'outdoor-bbq',
  '戶外庭院專業美式 BBQ 烤肉區',
  'Outdoor Courtyard Premium BBQ Area',
  '寬敞專屬的戶外庭園烤肉專區，備有大型美式不鏽鋼悶烤爐、專業烤肉網架與戶外野餐長桌，享受大自然芬多精與炭火美食的微醺聚餐時光。',
  'Generous private courtyard featuring heavy-duty American BBQ grill, stainless food prep tables, and picnic bench seating beneath forest canopies.',
  '/img/outdoor-bbq-tea/outdoor-bbq-tea-09.webp',
  '["專業級大型美式厚鋼附蓋烤肉爐","戶外獨立洗滌料理水槽與操作檯面","庭園夜間照明營造溫馨聚會氣氛","寬敞戶外休閒用餐長桌椅"]',
  '["Heavy-duty American barrel smoker grill","Dedicated outdoor wash sink & food prep station","Atmospheric ambient warm courtyard lighting","Generous outdoor dining picnic tables"]',
  '["/img/outdoor-bbq-tea/outdoor-bbq-tea-09.webp","/img/outdoor-bbq-tea/outdoor-bbq-tea-10.webp","/img/outdoor-bbq-tea/outdoor-bbq-tea-08.webp"]',
  4, 1
);

-- 3. 更新高山景觀品茗賞景茶席圖片
INSERT OR REPLACE INTO facilities (
  id, title_zh, title_en, desc_zh, desc_en, image,
  features_zh_json, features_en_json, gallery_json, sort_order, is_active
) VALUES (
  'tea-ceremony',
  '高山景觀品茗賞景茶席',
  'Scenic Mountain Tea Tasting Lounge',
  '特別規劃的景觀茶席空間，備有典雅精緻茶具與山泉水快煮設備。在雲霧繚繞中細細品嚐高山冷泡茶或東方美人茶，沉澱心靈享受隱逸慢時光。',
  'A tranquil space dedicated to slow tea appreciation, complete with handcrafted ceramic tea ware, overlooking panoramic mountain mists.',
  '/img/outdoor-bbq-tea/outdoor-bbq-tea-03.webp',
  '["典雅手作陶藝高山品茗茶具組","專屬山景茶席座位，採光清幽恬靜","附贈苗栗在地特產精選高山冷泡茶葉","適合三五好友午後靜心對談"]',
  '["Handcrafted ceramic tea set with pot and cups","Sun-drenched scenic seating with forest views","Complimentary local Miaoli specialty mountain tea","Perfect for mindful conversations and serene afternoons"]',
  '["/img/outdoor-bbq-tea/outdoor-bbq-tea-03.webp","/img/outdoor-bbq-tea/outdoor-bbq-tea-04.webp","/img/outdoor-bbq-tea/outdoor-bbq-tea-06.webp","/img/outdoor-bbq-tea/outdoor-bbq-tea-02.webp"]',
  5, 1
);

-- 4. 補充第 6 大設施：觀景木棧露台與璀璨星夜
INSERT OR REPLACE INTO facilities (
  id, title_zh, title_en, desc_zh, desc_en, image,
  features_zh_json, features_en_json, gallery_json, sort_order, is_active
) VALUES (
  'viewing-deck',
  '觀景木棧露台與璀璨星夜',
  'Panoramic Viewing Deck & Starlight Terrace',
  '寬敞的戶外木棧觀景露台，白天盡覽群山起伏與漫漫雲海，入夜後微光倒影輝映漫天星空，為您營造最浪漫沉靜的山居慢活時光。',
  'Spacious timber viewing terrace offering panoramic vistas of rolling mountains and cloud sea by day, and star-studded skies by night.',
  '/img/homebanner/homebanner-02.webp',
  '["全景開闊無遮蔽山巒視野","戶外高架景觀木棧平台","無光害夜間觀星與倒影氛圍","晨曦日出與夕陽彩霞暮色"]',
  '["Panoramic unobstructed mountain views","Elevated timber viewing terrace","Zero light pollution stargazing","Sunrise mist & crimson sunset twilight"]',
  '["/img/homebanner/homebanner-02.webp","/img/cloud-sea/cloud-sea-01.webp","/img/scenery-night/scenery-night-02.webp","/img/scenery-night/scenery-night-01.webp"]',
  6, 1
);
