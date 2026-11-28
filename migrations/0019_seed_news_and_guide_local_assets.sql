-- ==============================================================================
-- 檔案名稱: 0019_seed_news_and_guide_local_assets.sql
-- 專案名稱: 山語 Villa 官方網站
-- 資料庫引擎: Cloudflare D1 (Serverless SQLite)
-- 說明: 初始化最新消息公告與周邊導覽推薦之標準種子資料，
-- 嚴格遵循全域規範：所有展示與背景圖一律使用專案內本地 WebP 圖片路徑 (/img/...)，
-- 徹底禁用外部 URL (Unsplash 等)，確保離線與正式站載入穩定與隱私安全。
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. 初始化最新消息公告 (site_content, category = 'news')
-- ------------------------------------------------------------------------------
INSERT OR REPLACE INTO site_content (
  key, category, title_zh, title_en, content_zh, content_en, sort_order, is_active
) VALUES 
(
  'news-01',
  'news',
  '2026 春夏包棟檔期正式開放預訂與早鳥禮遇',
  '2026 Spring & Summer Bookings Open with Early Bird Privileges',
  '{"date":"2026-03-15","categoryZh":"最新公告","categoryEn":"Announcement","titleZh":"2026 春夏包棟檔期正式開放預訂與早鳥禮遇","titleEn":"2026 Spring & Summer Bookings Open with Early Bird Privileges","summaryZh":"即日起預訂 2026 年 5 月至 9 月包棟住宿，即贈送苗栗在地精選迎賓茶點組及產地冷泡茶禮盒。","summaryEn":"Book your exclusive summer retreat now and receive a complimentary artisan welcome tea set and handcrafted local gift box.","featured":true,"image":"/img/homebanner/homebanner-01.webp"}',
  '',
  1,
  1
),
(
  'news-02',
  'news',
  '全新引進「私廚星空無菜單饗宴」尊榮訂製服務',
  'Launching ''Private Master Chef Dining'' Experience Under the Stars',
  '{"date":"2026-02-28","categoryZh":"加值服務","categoryEn":"Exclusive Service","titleZh":"全新引進「私廚星空無菜單饗宴」尊榮訂製服務","titleEn":"Launching ''Private Master Chef Dining'' Experience Under the Stars","summaryZh":"山語攜手在地頂級名廚，為包棟貴賓提供量身打造之高山山海無菜單料理晚宴。","summaryEn":"Partnering with top regional chefs to deliver a bespoke dining journey showcasing premium local delicacies.","featured":false,"image":"/img/kitchen-bar/kitchen-bar-01.webp"}',
  '',
  2,
  1
),
(
  'news-03',
  'news',
  '山語 Villa 榮獲低碳綠色旅宿認證',
  'Shan Yu Villa Certified as Eco-Friendly Low Carbon Retreat',
  '{"date":"2026-01-10","categoryZh":"永續環保","categoryEn":"Sustainability","titleZh":"山語 Villa 榮獲低碳綠色旅宿認證","titleEn":"Shan Yu Villa Certified as Eco-Friendly Low Carbon Retreat","summaryZh":"全館採用高規格環保沐浴備品，響應不主動提供一次性備品，共同守護卓蘭翠綠山林生態。","summaryEn":"Embracing organic botanical amenities and zero-plastic policies to protect regional biodiversity.","featured":false,"image":"/img/cloud-sea/cloud-sea-01.webp"}',
  '',
  3,
  1
);

-- ------------------------------------------------------------------------------
-- 2. 確保周邊導覽膠囊分類 (guide_categories)
-- ------------------------------------------------------------------------------
INSERT OR REPLACE INTO guide_categories (
  id, name_zh, name_en, icon, tag_zh, tag_en, sort_order, is_active
) VALUES
  ('attraction', '周邊景點', 'Attractions', 'Compass', '私房景點推薦', 'Curated Scenic Spots', 1, 1),
  ('dining', '在地美食', 'Local Dining', 'UtensilsCrossed', '私房美食品嚐', 'Authentic Local Dining', 2, 1);

-- ------------------------------------------------------------------------------
-- 3. 周邊推薦與在地美食項目 (guide_items)
-- 全面採用專案本地 WebP 資源 (/img/...)
-- ------------------------------------------------------------------------------

-- 在地美食 (dining)
INSERT OR REPLACE INTO guide_items (
  id, type, name_zh, name_en, location_zh, location_en, tag_zh, tag_en,
  desc_zh, desc_en, notice_zh, notice_en, image, parking, sort_order, is_active
) VALUES 
(
  'fucai-yuan',
  'dining',
  '苗栗大湖福菜園客家菜餐廳',
  'Miaoli Dahu Fucaiyuan Hakka Restaurant',
  '苗栗縣大湖鄉',
  'Dahu Township, Miaoli',
  '合菜預約制・CP值極高',
  'Set Table Pre-booking · High Value',
  '道地客家風味餐廳。一桌型的菜要預先預定才有，特別推薦 6,800 元桌菜，份量澎湃、CP 值極高（如果要訂兩桌以上需預付 2,000 元訂金）；亦有 1,500 ~ 3,000 元合菜可供選擇。',
  'Authentic Hakka banquet restaurant. Pre-booking required for table set menus. The NT$ 6,800 set menu offers incredible value (NT$ 2,000 deposit required for 2+ tables); 1,500-3,000 options also available.',
  '一桌型菜需事先預訂；訂兩桌以上需先預付 2,000 元訂金',
  'Pre-booking required; NT$ 2,000 deposit for 2+ tables',
  '/img/kitchen-bar/kitchen-bar-02.webp',
  1, 1, 1
),
(
  'yun-ye-ju',
  'dining',
  '苗栗縣大湖鄉 雲也居休閒農場',
  'Dahu Yun Ye Ju Leisure Farm',
  '苗栗縣大湖鄉',
  'Dahu Township, Miaoli',
  '招牌定食・雲海景致',
  'Signature Set Meals · Mountain Vista',
  '坐落於薑麻園山脈之上的景觀農場餐廳，主打精緻美味的特色定食與客家家常料理，飽覽晨昏壯闊雲霧。座位熱門，強烈建議事先電話預約。',
  'Scenic farm restaurant on the Jiangmayuan ridge, famous for flavorful farm-to-table set meals and sweeping cloud views. Advance phone reservation is highly recommended.',
  '主打精緻定食，最好事先電話預約',
  'Specializes in set meals; advance phone booking advised',
  '/img/outdoor-bbq-tea/outdoor-bbq-tea-01.webp',
  1, 2, 1
),
(
  'zhuolan-goose-dan',
  'dining',
  '苗栗縣卓蘭鎮 鵝肉擔',
  'Zhuolan Goose Dan Restaurant',
  '苗栗縣卓蘭鎮',
  'Zhuolan Township, Miaoli',
  '鮮嫩多汁・在地超人氣老店',
  'Juicy Tender Goose · Local Favorite',
  '卓蘭鎮上遠近馳名的老字號排隊美食！鵝肉鮮嫩多汁肉質甘甜，搭配特製沾醬與客家傳統粄條，深受在地人與外地饕客推崇喜愛。',
  'Legendary local eatery in downtown Zhuolan famous for tender, succulent goose meat paired with signature herbal dip and Hakka flat rice noodles.',
  '假日排隊人潮眾多，建議提早前往或先電話洽詢',
  'Peak weekend queues; early arrival recommended',
  '/img/kitchen-bar/kitchen-bar-04.webp',
  1, 3, 1
),
(
  'chuan-ji-breeze',
  'dining',
  '苗栗縣大湖鄉 穿龍豆腐坊',
  'Chuanlong Tofu Workshop',
  '苗栗縣大湖鄉',
  'Dahu Township, Miaoli',
  '古法鹽鹵・有機天然豆香',
  'Traditional Nigari Tofu · Organic Soy',
  '座落於老圳水畔的特色豆腐手作工坊，堅持以本土非基改有機黃豆與傳統天然鹽鹵手工凝固，豆漿與豆花口感濃醇香綿，是不可錯過的純樸好滋味。',
  'Artisan tofu workshop perched over an old stone canal, handcrafted using local non-GMO beans and natural seawater nigari. Renowned for velvety soy milk.',
  '每週二公休，每日新鮮限量供應賣完為止',
  'Closed Tuesdays; daily batches sold until sold out',
  '/img/kitchen-bar/kitchen-bar-05.webp',
  1, 4, 1
),
(
  'vilavilla-dining',
  'dining',
  '苗栗卓蘭 魔法莊園 Vilavilla 景觀餐廳',
  'Vilavilla Fantasy Garden Restaurant',
  '苗栗縣卓蘭鎮',
  'Zhuolan Township, Miaoli',
  '精緻排餐・花園景觀',
  'Gourmet Steaks · Fairy Garden Views',
  '隱身於綠意森林中的歐風庭園莊園，提供精緻義大利麵、主廚特選排餐與手作花果下午茶，環境夢幻優雅，極具異國情調。',
  'European fairytale garden estate offering artisanal pastas, steaks, and botanical afternoon tea amidst manicured floral woods.',
  '入園需購買門票（可折抵餐飲消費）',
  'Admission ticket required; partially redeemable for dining',
  '/img/outdoor-bbq-tea/outdoor-bbq-tea-04.webp',
  1, 5, 1
);

-- 精選私房景點 (attraction)
INSERT OR REPLACE INTO guide_items (
  id, type, name_zh, name_en, location_zh, location_en, tag_zh, tag_en,
  desc_zh, desc_en, notice_zh, notice_en, image, parking, sort_order, is_active
) VALUES 
(
  'grand-canyon',
  'attraction',
  '卓蘭大峽谷（大安溪峽谷）',
  'Zhuolan Grand Canyon (Da-an River Canyon)',
  '苗栗縣卓蘭鎮景山里',
  'Jingshan Vil., Zhuolan Township',
  '自然奇景・地質景觀',
  'Natural Wonder · Geological Landscape',
  '因 921 地震與雨水沖刷而自然形成的地質奇觀，氣勢磅礴的大安溪兩側裸露出層次分明的砂頁岩層，鬼斧神工宛如縮小版的大峽谷。',
  'A striking geological formation carved by the Da-an River after the 921 earthquake. Grand layered sedimentary rocks resemble a miniature grand canyon.',
  '雨季及颱風過後溪水湍急請勿靠近水邊，注意防曬與步道行走安全',
  'Exercise caution along riverbanks; wear sunscreen and sturdy walking shoes',
  '/img/scenery-night/scenery-night-02.webp',
  1, 1, 1
),
(
  'jiangmayuan-trail',
  'attraction',
  '大湖薑麻園休閒農業區・聖衡宮步道',
  'Dahu Jiangmayuan Trail & Shengheng Temple',
  '苗栗縣大湖鄉栗林村',
  'Lilin Vil., Dahu Township',
  '高山雲海・雲霧仙境步道',
  'Sea of Clouds · Misty Ridge Trails',
  '海拔約 800 公尺的薑麻園是全台著名的賞雲海聖地。漫步於聖衡宮觀景台與出關步道，秋冬春季極易遇見翻騰奔流的波瀾雲海與金黃夕陽。',
  'Perched at 800m elevation, Jiangmayuan is world-class for cloud seas. Stroll the Chuguan Trail to witness breathtaking golden sunsets.',
  '清晨與傍晚為觀賞雲海最佳黃金時段，山區氣溫偏低請備薄外套',
  'Dawn and dusk are optimal for cloud seas; bring a light warm jacket',
  '/img/cloud-sea/cloud-sea-02.webp',
  1, 2, 1
),
(
  'liyutan-reservoir',
  'attraction',
  '鯉魚潭水庫風景區・鋸齒堰',
  'Liyutan Reservoir Scenic Area & Serrated Weir',
  '苗栗縣三義鄉與卓蘭鎮交界',
  'Border of Sanyi & Zhuolan',
  '全台唯一鋸齒堰・水庫湖景',
  'Unique Serrated Spillway · Serene Lake',
  '全台灣唯一的鋸齒狀自然溢洪堰，湖面波光粼粼被翠綠青山環繞，沿途設有平緩好走的觀景步道與綠草如茵的野餐休憩區。',
  'Taiwan''s only serrated natural overflow spillway. Glistening emerald waters framed by mountain peaks provide scenic walking trails and picnic spots.',
  '免門票入園，設有大型免費停車場與洗手間',
  'Free admission; spacious parking lot and restrooms available',
  '/img/shengxing-station.webp',
  1, 3, 1
),
(
  'dahu-strawberry-orchards',
  'attraction',
  '大湖草莓觀光果園群',
  'Dahu Strawberry Tourist Orchards',
  '苗栗縣大湖鄉台 3 線沿線',
  'Provincial Hwy 3, Dahu Township',
  '產季採果・親子同樂',
  'Seasonal Picking · Family Friendly',
  '每年 11 月至翌年 4 月為大湖草莓盛產季，沿著台 3 線兩側有眾多高架或地植無毒有機草莓園，享受親手現採香甜草莓的滿滿樂趣。',
  'From November through April, the world-famous Dahu strawberry harvest fills the valley. Pick fresh fragrant strawberries in sunlit orchards.',
  '各果園收費標準採秤斤計費，建議下田前先詢問當日價格',
  'Priced by weight; ask individual orchards for current daily rates',
  '/img/outdoor-bbq-tea/outdoor-bbq-tea-03.webp',
  1, 4, 1
),
(
  'flower-home',
  'attraction',
  '花露休閒農場 Flower Home',
  'Flower Home Leisure Farm',
  '苗栗縣卓蘭鎮西坪里',
  'Xiping Vil., Zhuolan Township',
  '繡球花季・波波草・香草精油',
  'Hydrangeas · Kochia Fields · Essential Oils',
  '以繽紛花卉與精油芳療聞名全台的休閒農場，四季皆有主題花季盛開（繡球花、波波草、薰衣草），園區優美宛如莫內花園。',
  'Acclaimed botanical garden farm renowned for seasonal flower blooms (hydrangeas, lavender, kochia), essential oil spa, and romantic garden paths.',
  '入園門票可部分折抵園內各項消費與下午茶',
  'Admission tickets redeemable against farm retail and tea café',
  '/img/homebanner/homebanner-07.webp',
  1, 5, 1
);
