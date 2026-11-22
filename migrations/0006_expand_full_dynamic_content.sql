-- ==============================================================================
-- 檔案名稱: 0006_expand_full_dynamic_content.sql
-- 專案名稱: 山語 Villa 官方網站
-- 資料庫引擎: Cloudflare D1 (Serverless SQLite)
-- 說明: 全資料庫動態化升級 (Phase 1)，徹底解除對本地靜態 JSON 的依賴。
-- 擴充房型詳細規格、建立公共設施與景點美食資料表、將全站政策與品牌資訊收錄於 D1。
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. 擴充房型表 (rooms)
-- 新增樓層、英文名稱、雙語標題與副標題、床型、坪數、圖片與圖集 JSON、亮點特色 JSON
-- ------------------------------------------------------------------------------
ALTER TABLE rooms ADD COLUMN floor TEXT DEFAULT '1F';
ALTER TABLE rooms ADD COLUMN title_en TEXT;
ALTER TABLE rooms ADD COLUMN subtitle_en TEXT;
ALTER TABLE rooms ADD COLUMN capacity_zh TEXT;
ALTER TABLE rooms ADD COLUMN capacity_en TEXT;
ALTER TABLE rooms ADD COLUMN bed_type_zh TEXT;
ALTER TABLE rooms ADD COLUMN bed_type_en TEXT;
ALTER TABLE rooms ADD COLUMN size_info TEXT;
ALTER TABLE rooms ADD COLUMN image TEXT;
ALTER TABLE rooms ADD COLUMN gallery_json TEXT;
ALTER TABLE rooms ADD COLUMN highlights_zh_json TEXT;
ALTER TABLE rooms ADD COLUMN highlights_en_json TEXT;
ALTER TABLE rooms ADD COLUMN desc_zh TEXT;
ALTER TABLE rooms ADD COLUMN desc_en TEXT;

-- 注入 / 更新 5 間獨立客房完整規格
INSERT OR REPLACE INTO rooms (
  id, name, title_en, subtitle, subtitle_en, floor, 
  capacity_standard, capacity_max, capacity_zh, capacity_en,
  bed_type_zh, bed_type_en, size_info, base_price, holiday_price,
  image, gallery_json, highlights_zh_json, highlights_en_json,
  desc_zh, desc_en, is_active
) VALUES 
(
  'room-01',
  '1樓 綠意四人景觀套房',
  '1F Garden View Quad Suite',
  '1樓無障礙便利動線・大面綠意窗景・獨立乾濕分離衛浴',
  '1F Step-Free Access · Garden Views · Private Ensuite Bath',
  '1F',
  4, 4, '4 人', '4 Guests',
  '加大雙人床 (Queen Size) x 1 + 標準雙人床 x 1',
  '1 Queen Bed + 1 Standard Double Bed',
  '約 12 坪',
  8800, 10800,
  '/img/room-1/room-1-01.webp',
  '["/img/room-1/room-1-01.webp","/img/room-1/room-1-02.webp","/img/room-1/room-1-03.webp","/img/room-1/room-1-04.webp","/img/room-1/room-1-05.webp"]',
  '["位於1樓無障礙友善動線，長輩小孩入住安心便利","配置 1 張 Queen Size 加大雙人床 + 1 張標準雙人床","大面採光觀景窗，盡攬綠意山林晨光","獨立乾濕分離衛浴與全套草本洗沐備品","獨立冷暖恆溫變頻空調"]',
  '["Convenient 1F step-free access, ideal for seniors and families","1 Queen Bed + 1 Standard Double Bed","Generous scenic windows embracing morning forest light","Private ensuite bathroom with botanical bath amenities","Independent inverter heating and cooling AC"]',
  '位於一樓的寬敞四人套房，設有一張 Queen Size 雙人床與一張標準雙人床。溫潤木質調與大面窗景相映成趣，免除上下樓梯負擔，讓旅人在自然晨光中舒活甦醒。',
  'Spacious ground-floor quad suite featuring 1 Queen-size bed and 1 standard double bed. Warm timber tones and tranquil natural morning light ensure a deeply restful stay without stairs.',
  1
),
(
  'room-02',
  '1樓 山語隱逸雙人套房',
  '1F Serenity Double Suite',
  '加大 Queen Size 舒眠名床・沉靜私密時光・獨立衛浴',
  '1 Queen Size Bed · Intimate Retreat · Private Ensuite Bath',
  '1F',
  2, 2, '2 人', '2 Guests',
  '加大雙人床 (Queen Size) x 1',
  '1 Queen Size Bed',
  '約 9 坪',
  5800, 7200,
  '/img/room-2/room-2-01.webp',
  '["/img/room-2/room-2-01.webp","/img/room-2/room-2-02.webp","/img/room-2/room-2-03.webp","/img/room-2/room-2-04.webp"]',
  '["1樓沉靜私密角落，靜謐無擾","Queen Size 頂級舒眠名床與透氣天絲寢具","乾濕分離獨立衛浴設備","雙人溫馨休憩沙發與茶几","獨立冷暖變頻空調與高速無線 Wi-Fi"]',
  '["Quiet ground-floor sanctuary for restful privacy","1 Premium Queen-size bed with silky tencel linens","Private ensuite bath with separate shower","Cozy two-seater lounge sofa and table","Independent climate control & high-speed Wi-Fi"]',
  '專為雙人打造的隱逸謐靜套房，精選加大 Queen Size 獨立筒舒眠床墊與天絲親膚被品。柔和漫射光線與質樸石木肌理，營造無壓放鬆的私密度假氛圍。',
  'Tailored for couples, this intimate suite features a premium Queen mattress and natural materials, creating an effortlessly relaxing sanctuary.',
  1
),
(
  'room-03',
  '1樓 風荷清幽四人套房',
  '1F Lotus Breeze Quad Suite',
  '兩張舒適雙人床・溫潤木質風格・寬敞獨立衛浴',
  '2 Double Beds · Natural Timber Ambience · Spacious Ensuite Bath',
  '1F',
  4, 4, '4 人', '4 Guests',
  '標準雙人床 x 2',
  '2 Standard Double Beds',
  '約 11 坪',
  8800, 10800,
  '/img/room-3/room-3-01.webp',
  '["/img/room-3/room-3-01.webp","/img/room-3/room-3-02.webp","/img/room-3/room-3-03.webp","/img/room-3/room-3-04.webp"]',
  '["一樓便捷無階梯動線，出入輕鬆","配置兩張標準雙人床，適合小家庭或好友同行","開闊空間感與自然原木家具配置","乾濕分離獨立衛浴與精緻備品","全室獨立靜音冷暖變頻空調"]',
  '["Ground-floor easy access without stairs","2 Standard double beds, perfect for families or friends","Airy layout with handcrafted solid wood furniture","Spacious ensuite bathroom with separate shower zone","Whisper-quiet independent inverter climate control"]',
  '位於一樓的雅緻四人套房，配置兩張標準雙人床。俐落明朗的採光設計與溫馨木質家具，營造賓至如歸的放鬆感，是好友結伴與家庭出遊的愜意首選。',
  'Elegant ground-floor suite accommodating four with two standard double beds, bathed in natural light and styled in serene natural woods.',
  1
),
(
  'room-04',
  '2樓 星空露台四人套房',
  '2F Starlight Terrace Quad Suite',
  '專屬高空星空觀景露台・兩張舒適雙人床・壯闊山景視野',
  'Private Viewing Terrace · 2 Double Beds · Majestic Mountain Panorama',
  '2F',
  4, 4, '4 人', '4 Guests',
  '標準雙人床 x 2',
  '2 Standard Double Beds',
  '約 14 坪 (含私人觀景露台)',
  9800, 11800,
  '/img/room-4/room-4-01.webp',
  '["/img/room-4/room-4-01.webp","/img/room-4/room-4-02.webp","/img/room-4/room-4-03.webp","/img/room-4/room-4-04.webp","/img/room-4/room-4-05.webp"]',
  '["擁有 2 樓專屬開闊戶外觀景露台，飽覽層疊山巒","夜間仰望無光害星空銀河，晨起漫步雲霧間","配置兩張標準雙人床，視野遼闊採光極佳","乾濕分離獨立衛浴與落地景觀窗","尊榮景觀休閒桌椅"]',
  '["Private elevated viewing terrace with sweeping mountain peaks","Stargazing under unpolluted night skies; morning cloud mist","2 Standard double beds with abundant natural daylight","Private ensuite bath with full-height scenic window","Terrace lounge chairs for slow relaxation"]',
  '坐擁二樓制高點的星空觀景套房，擁有專屬的戶外露台。白天遠眺層巒疊嶂與縹緲雲海，夜晚在微風與璀璨星空下品茗談心，感受大自然最純粹的療癒洗禮。',
  'Perched on the top floor with an exclusive open-air terrace, this suite invites you to greet rolling morning clouds and stargaze in mountain silence.',
  1
),
(
  'room-05',
  '2樓 晨曦觀景四人套房',
  '2F Dawn Mountain View Quad Suite',
  '晨曦第一道晨光・極佳採光・高樓層遼闊山巒景致',
  'First Morning Light · Sun-drenched Windows · Elevated Scenic Vista',
  '2F',
  4, 4, '4 人', '4 Guests',
  '標準雙人床 x 2',
  '2 Standard Double Beds',
  '約 13 坪',
  9800, 11800,
  '/img/room-5/room-5-01.webp',
  '["/img/room-5/room-5-01.webp","/img/room-5/room-5-02.webp","/img/room-5/room-5-03.webp","/img/room-5/room-5-04.webp"]',
  '["座落於2樓迎光面，每日迎接柔和溫暖晨曦","居高臨下俯瞰卓蘭山谷與果園綠意","配置兩張標準雙人床，空間寬裕舒適","乾濕分離獨立衛浴與大面積觀景採光窗","靜音冷暖空調與全套頂級備品"]',
  '["East-facing 2F orientation greeting peaceful dawn rays","Overlooking green orchard hillsides and Zhuolan valley","2 Standard double beds in an expansive airy layout","Bright ensuite bathroom with generous scenic window","Whisper-quiet AC and premium organic amenities"]',
  '迎向東方的晨曦觀景套房，當清晨第一道陽光灑落，整座山谷的朝氣在此甦醒。寬敞溫潤的起居氛圍，讓每一次深呼吸都充滿大自然芬多精的清新。',
  'Greeting the first sun rays over eastern mountain ridges, this sun-lit suite offers panoramic countryside views and pure rejuvenating mountain air.',
  1
);

-- ------------------------------------------------------------------------------
-- 2. 公共設施與體驗空間表 (facilities)
-- 儲存 KTV 劇院、智能廚房、電動麻將、美式 BBQ 烤肉區、高山品茗茶席等
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS facilities (
  id TEXT PRIMARY KEY,
  title_zh TEXT NOT NULL,
  title_en TEXT,
  desc_zh TEXT NOT NULL,
  desc_en TEXT,
  image TEXT NOT NULL,
  features_zh_json TEXT,
  features_en_json TEXT,
  gallery_json TEXT,
  sort_order INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_facilities_sort ON facilities(is_active, sort_order ASC);

INSERT OR REPLACE INTO facilities (
  id, title_zh, title_en, desc_zh, desc_en, image,
  features_zh_json, features_en_json, gallery_json, sort_order, is_active
) VALUES 
(
  'ktv-theater',
  '大客廳與專業卡拉OK歡唱系統',
  'Grand Living Hall & Professional KTV System',
  '挑高寬敞的豪華大客廳，配備高階音響、大螢幕電視與最新點歌卡拉OK系統，支援多人對唱，讓您的歡聚之夜充滿歌聲與笑聲。',
  'Soaring, spacious living hall equipped with professional acoustics, big-screen display, and the latest karaoke system with wireless microphones.',
  '/img/living-ktv/living-ktv-01.webp',
  '["海量最新雲端伴唱歌單","雙支無線抗噪動圈麥克風","高傳真立體環繞音響","寬敞深座舒適真皮大沙發"]',
  '["Cloud-updated song catalog","Dual anti-feedback wireless microphones","Hi-Fi dynamic surround sound","Spacious deep leather seating"]',
  '["/img/living-ktv/living-ktv-01.webp","/img/living-ktv/living-ktv-03.webp","/img/living-ktv/living-ktv-04.webp","/img/living-ktv/living-ktv-02.webp","/img/living-ktv/living-ktv-05.webp"]',
  1, 1
),
(
  'smart-kitchen',
  '頂級智能廚房與時尚 Mini Bar',
  'Smart Gourmet Kitchen & Mini Bar Lounge',
  '現代化開放式智能中島廚房與高腳 Mini Bar，大型雙門冰箱、微波爐、電鍋、熱水壺及餐具一應俱全，無論料理下廚或調飲皆隨心所欲。',
  'Contemporary open-concept island kitchen and stylish high-top mini bar, equipped with large double-door refrigerator, appliances, and glassware.',
  '/img/kitchen-bar/kitchen-bar-06.webp',
  '["開放式智能料理中島與高腳吧台","大型雙門家用冷藏冷凍冰箱","微波爐、快煮壺、全套碗盤刀叉","精緻高腳酒杯與品飲器皿"]',
  '["Smart cooking island & high bar","Spacious double-door refrigerator","Microwave, kettle, full cutlery sets","Premium glassware & drink accessories"]',
  '["/img/kitchen-bar/kitchen-bar-06.webp","/img/kitchen-bar/kitchen-bar-04.webp","/img/kitchen-bar/kitchen-bar-02.webp","/img/kitchen-bar/kitchen-bar-03.webp","/img/kitchen-bar/kitchen-bar-05.webp"]',
  2, 1
),
(
  'mahjong-room',
  '頂級電動過山車麻將娛樂室',
  'Automatic Mahjong Table Experience',
  '專屬配置最新型全自動過山車靜音電動麻將桌，洗牌迅速順暢、零噪音打擾。舒適人體工學皮椅與明亮採光，是好友徹夜切磋的最佳娛樂。',
  'Features the latest whisper-quiet automatic mahjong table with rapid shuffling and zero jams. Ergonomic executive chairs ensure comfortable gaming sessions.',
  '/img/mahjong/mahjong-01.webp',
  '["最新四口過山車全自動靜音洗牌機","配備兩副頂級磁吸刻字專用麻將牌","人體工學高承重透氣皮椅","專屬飲料杯架與籌碼置物槽"]',
  '["Whisper-quiet auto-shuffling table mechanism","Dual sets of weighted engraved tiles","Ergonomic supportive executive seating","Integrated cup holders and chip trays"]',
  '["/img/mahjong/mahjong-01.webp","/img/mahjong/mahjong-02.webp","/img/mahjong/mahjong-03.webp","/img/mahjong/mahjong-04.webp"]',
  3, 1
),
(
  'outdoor-bbq',
  '戶外庭院專業美式 BBQ 烤肉區',
  'Outdoor Courtyard Premium BBQ Area',
  '寬敞專屬的戶外庭園烤肉專區，備有大型美式不鏽鋼悶烤爐、專業烤肉網架與戶外野餐長桌，享受大自然芬多精與炭火美食的微醺聚餐時光。',
  'Generous private courtyard featuring heavy-duty American BBQ grill, stainless food prep tables, and picnic bench seating beneath forest canopies.',
  '/img/bbq/bbq-01.webp',
  '["專業級大型美式厚鋼附蓋烤肉爐","戶外獨立洗滌料理水槽與操作檯面","庭園夜間照明營造溫馨聚會氣氛","寬敞戶外休閒用餐長桌椅"]',
  '["Heavy-duty American barrel smoker grill","Dedicated outdoor wash sink & food prep station","Atmospheric ambient warm courtyard lighting","Generous outdoor dining picnic tables"]',
  '["/img/bbq/bbq-01.webp","/img/bbq/bbq-02.webp","/img/bbq/bbq-03.webp","/img/bbq/bbq-04.webp"]',
  4, 1
),
(
  'tea-ceremony',
  '高山景觀品茗賞景茶席',
  'Scenic Mountain Tea Tasting Lounge',
  '特別規劃的景觀茶席空間，備有典雅精緻茶具與山泉水快煮設備。在雲霧繚繞中細細品嚐高山冷泡茶或東方美人茶，沉澱心靈享受隱逸慢時光。',
  'A tranquil space dedicated to slow tea appreciation, complete with handcrafted ceramic tea ware, overlooking panoramic mountain mists.',
  '/img/tea/tea-01.webp',
  '["典雅手作陶藝高山品茗茶具組","專屬山景茶席座位，採光清幽恬靜","附贈苗栗在地特產精選高山冷泡茶葉","適合三五好友午後靜心對談"]',
  '["Handcrafted ceramic tea set with pot and cups","Sun-drenched scenic seating with forest views","Complimentary local Miaoli specialty mountain tea","Perfect for mindful conversations and serene afternoons"]',
  '["/img/tea/tea-01.webp","/img/tea/tea-02.webp","/img/tea/tea-03.webp","/img/tea/tea-04.webp"]',
  5, 1
);

-- ------------------------------------------------------------------------------
-- 3. 周邊景點與私房美食表 (guide_items)
-- 包含交通指南、私房景點、在地美食推薦
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS guide_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'transportation', 'attraction', 'dining'
  name_zh TEXT NOT NULL,
  name_en TEXT,
  location_zh TEXT,
  location_en TEXT,
  tag_zh TEXT,
  tag_en TEXT,
  desc_zh TEXT,
  desc_en TEXT,
  notice_zh TEXT,
  notice_en TEXT,
  image TEXT,
  parking INTEGER DEFAULT 0,
  data_json TEXT,
  sort_order INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guide_items_type ON guide_items(type, is_active, sort_order ASC);

-- 交通指南
INSERT OR REPLACE INTO guide_items (
  id, type, name_zh, name_en, desc_zh, desc_en, data_json, sort_order, is_active
) VALUES 
(
  'trans-guide',
  'transportation',
  '山語 Villa 交通指南',
  'Shan Yu Villa Transportation Guide',
  '自駕與大眾運輸抵達路線',
  'Driving routes and public transportation guide',
  '{"byCarZh":["國道 1 號（三義交流道下）：接台 13 線往卓蘭方向 -> 轉苗 52 線（經鯉魚潭水庫風景區）接台 3 線 -> 抵達卓蘭景山里，循山語 Villa 指標即可抵達。","國道 4 號（豐原/東勢端下）：沿台 3 線往石岡、東勢、卓蘭方向前行 -> 進入苗栗卓蘭景山里 -> 依指標上行即可抵達。","導航定位建議：Google 地圖搜尋「苗栗縣卓蘭鎮景山里8鄰127-10號」或「山語 Villa」，沿途均為平整雙向柏油道路，行車順暢安全。"],"byCarEn":["Via National Freeway 1 (Sanyi Interchange): Take Provincial Hwy 13 toward Zhuolan -> Connect to Miaoli Route 52 (via Liyutan Reservoir) to Hwy 3 -> Follow Shan Yu Villa signs.","Via National Freeway 4 (Fengyuan/Dongshi End): Follow Provincial Hwy 3 toward Shigang, Dongshi, and Zhuolan -> Enter Jingshan Village, Zhuolan Township.","GPS Navigation: Search for ''Shan Yu Villa'' or ''No. 127-10, Neighborhood 8, Jingshan Vil., Zhuolan Township, Miaoli''. Roads are paved and safe for all standard passenger vehicles."],"byPublicZh":"搭乘高鐵至「苗栗站」或「台中站」，轉乘計程車或自駕租車前往苗栗卓蘭山語 Villa；亦可提前向管家諮詢推薦在地專車接駁服務。","byPublicEn":"Take Taiwan High Speed Rail to Miaoli or Taichung Station, then transfer via taxi or rental car to Zhuolan, Miaoli. Concierge driver coordination is available upon prior request."}',
  1, 1
);

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
  'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=1000&q=80',
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
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80',
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
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80',
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
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80',
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
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80',
  1, 5, 1
);

-- 精選私房景點 (attractions)
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
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
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
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80',
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
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
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
  'https://images.unsplash.com/photo-1518635017498-87f514b751ba?auto=format&fit=crop&w=1000&q=80',
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
  'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1000&q=80',
  1, 5, 1
);

-- ------------------------------------------------------------------------------
-- 4. 擴充全站動態內容 (site_content)
-- 補充全站品牌規格、社群連結、官網直訂權益、入住守則與退訂政策
-- ------------------------------------------------------------------------------
INSERT OR REPLACE INTO site_content (key, category, title_zh, title_en, content_zh, content_en, sort_order, is_active) VALUES
  ('brand_name', 'basic_info', '品牌中文名稱', 'Brand Name En', '山語 Villa 豪宅山莊包棟別墅', 'Shan Yu Villa Luxury Estate', 11, 1),
  ('short_name', 'basic_info', '品牌簡稱', 'Short Name', '山語 Villa', 'Shan Yu Villa', 12, 1),
  ('slogan', 'basic_info', '核心標語', 'Brand Slogan', '山嵐隱逸・慢活時光', 'Oriental Serenity & Mountain Sanctuary', 13, 1),
  ('intro', 'basic_info', '品牌簡介文案', 'Brand Introduction', '全新完工山語 Villa 豪宅山莊坐落於山林之間，擁有寬敞舒適的空間與開闊山景視野。適合家庭旅遊、朋友聚會及想遠離城市喧囂、享受山林悠閒慢生活的旅人。', 'Brand-new Shan Yu Villa luxury estate is nestled amid tranquil mountain forests with expansive panoramic views. Perfect for families, friends, and travelers seeking slow mountain living.', 14, 1),
  ('address', 'basic_info', '莊園地址', 'Estate Address', '369苗栗縣卓蘭鎮景山里8鄰127-10號', 'No. 127-10, Neighborhood 8, Jingshan Vil., Zhuolan Township, Miaoli County 369, Taiwan', 15, 1),
  ('google_map_url', 'basic_info', 'Google Maps 連結', 'Google Maps URL', 'https://maps.app.goo.gl/VhxGV5h3uJwU14mG9', 'https://maps.app.goo.gl/VhxGV5h3uJwU14mG9', 16, 1),
  ('instagram', 'basic_info', 'Instagram 帳號', 'Instagram Handle', 'villa_forfun001', 'villa_forfun001', 17, 1),
  ('instagram_url', 'basic_info', 'Instagram 專頁連結', 'Instagram Profile URL', 'https://www.instagram.com/villa_forfun001/', 'https://www.instagram.com/villa_forfun001/', 18, 1),
  ('airbnb_url', 'basic_info', 'Airbnb 認證連結', 'Airbnb Listing URL', 'https://www.airbnb.com.tw/rooms/1785941296784004528?source_impression_id=p3_1792732762_P3vdCM0bn-RsnLPh', 'https://www.airbnb.com.tw/rooms/1785941296784004528?source_impression_id=p3_1792732762_P3vdCM0bn-RsnLPh', 19, 1),
  ('license_number', 'basic_info', '合法民宿證號', 'License Number', '苗栗縣合法民宿登記', 'Miaoli Legal B&B Certificate', 20, 1),
  ('room_count', 'basic_info', '客房總數', 'Total Rooms', '5', '5', 21, 1),
  
  -- 訂房管道權益 (channels)
  ('channels_direct_perks', 'channels', '官網直訂專屬禮遇 (繁中)', 'Direct Booking Perks (En)', 
   '["官網直訂免收平台手續費，享有最即時彈性檔期協調","享有全棟 5 間房完整私密包棟使用權","免費使用電動麻將桌、KTV歡唱、庭園烤肉爐與智能廚房","全天候 24 小時專屬管家貼心諮詢支援"]',
   '["Direct booking with zero third-party commission and flexible scheduling","Exclusive private access to all 5 guest suites across two floors","Complimentary access to auto-mahjong, KTV, BBQ grill & smart kitchen","24-Hour dedicated concierge & butler support"]',
   1, 1),
   
  ('channels_ota_list', 'channels', 'OTA 合作平台清單', 'OTA Platforms',
   '[{"id":"airbnb","name":"Airbnb","badgeZh":"超讚房東嚴選房源","badgeEn":"Superhost Selection","taglineZh":"山語 Villa 官方 Airbnb 認證預約頁面","taglineEn":"Official Airbnb Listing for Shan Yu Villa","url":"https://www.airbnb.com.tw/rooms/1785941296784004528?source_impression_id=p3_1792732762_P3vdCM0bn-RsnLPh","status":"active"}]',
   '[{"id":"airbnb","name":"Airbnb","badgeZh":"超讚房東嚴選房源","badgeEn":"Superhost Selection","taglineZh":"山語 Villa 官方 Airbnb 認證預約頁面","taglineEn":"Official Airbnb Listing for Shan Yu Villa","url":"https://www.airbnb.com.tw/rooms/1785941296784004528?source_impression_id=p3_1792732762_P3vdCM0bn-RsnLPh","status":"active"}]',
   2, 1),

  -- 入住須知 (policies)
  ('policies_checkin_rules', 'policies', '入住守則須知', 'Check-in Rules',
   '["入住時間：當日下午 15:00 以後。如超過 18:00 以後入住，請於訂房時備註或是打電話告知，逾時恕不保留客房亦不退費。","退房時間：隔日上午 11:00 以前。退房時務必交還房門鑰匙；離開房間時請先關冷氣、電源。恕不延長退房，延長一小時另酌收 NT$ 2,000 元費用。","現場押金：入住當天現場需收取押金 NT$ 3,000 元，退房時經檢查無損壞、環境整理乾淨歸位，將全額退還，敬請放心。","寵物規範：全館請勿攜帶寵物入內，不便之處敬請見諒。","嚴禁爆竹：園區內全面禁止施放煙火、放鞭炮及仙女棒，以維護山林與公共安全。","人數限制：入住當天請依約定人數入住，整棟樓最多容納 18 個人，現場無法提供加床服務。","全面禁菸：本民宿嚴格適用菸害防制法，室內（包含公共空間、走廊與所有房間）全面禁止吸菸（包含傳統紙菸與電子菸）。","違法行為：屋內嚴禁轟趴、吸毒、嚼檳榔、酗酒、聚賭等任何違法性行為，若經發現一律報警處理並取消住宿且不予退費。","續住備品：續住之房客，民宿不主動進房更換毛巾或浴巾，如需更換備品請主動告知管家。","節能安全：請勿在客房內使用非民宿提供之瓦斯爐或電磁爐等危險物品，並請隨手關燈及節約用水。","保管貴重：個人貴重物品請自行妥善保管，如有遺失恕不負責，敬請見諒。","物品賠償：請愛惜並勿破壞屋內傢俱與設施，退房時若經發現損壞或遺失，需照價賠償。","慢生活理念：山語 Villa 豪宅山莊是個適合慢生活的清幽民宿，期盼各位貴賓能好好放鬆享受山裡的林靜和美好，並歡迎您常回來看我們。"]',
   '["Check-in begins at 15:00. For arrivals after 18:00, please notify us in advance. Failure to notify may result in reservation cancellation without refund.","Check-out is by 11:00 AM. Please return all keys and turn off AC/power upon departure. Late checkout is subject to an additional fee of NT$ 2,000 per hour.","Security Deposit: A refundable deposit of NT$ 3,000 is collected upon arrival and will be fully returned upon checkout inspection and tidy return.","Pets Policy: Strictly no pets allowed on the premises. Thank you for your understanding.","Fireworks Policy: Fireworks, firecrackers, and sparklers are strictly prohibited on property to ensure safety.","Guest Capacity: Strict maximum capacity of 18 guests. No extra bed service is available.","Non-Smoking: All indoor areas (including guest rooms and shared spaces) are strictly non-smoking (including e-cigarettes / vapes).","Illegal Activities: Drug use, illegal gatherings, betel nuts, excessive drinking, or gambling are strictly prohibited and will be reported to the police immediately.","Multi-Night Stays: For eco-friendly hospitality, we do not automatically replace towels during consecutive nights. Please notify our butler if replacement is needed.","Safety & Energy: Portable gas stoves or high-power induction cookers are not permitted inside guest rooms. Please turn off appliances when leaving.","Valuables: Please keep personal valuables secure at all times. Shan Yu Villa is not liable for lost items.","Property Damage: Please care for our furniture and fixtures. Any damage or loss will be charged at replacement cost.","Slow Living: Shan Yu Villa is designed for tranquility and slow living. Relax, breathe in the fresh mountain air, and enjoy your stay."]',
   1, 1),

  ('policies_refund_rules', 'policies', '退訂與退費政策', 'Refund Policy',
   '{"titleZh":"山語Villa豪宅山莊退費規定","titleEn":"Shan Yu Villa Cancellation & Refund Policy","itemsZh":["入住前15天取消，訂金可全額退款。","入住前8-14天內取消，訂金可退還一半。","入住前7 天內取消，訂金則不退還。"],"itemsEn":["Cancellations made 15 days or more prior to check-in: 100% full deposit refund.","Cancellations made 8–14 days prior to check-in: 50% deposit refund.","Cancellations made within 7 days prior to check-in: Deposit is non-refundable."]}',
   '',
   2, 1),

  ('policies_extraguests_rules', 'policies', '容納人數與床位規範', 'Capacity & Bedding Policy',
   '{"titleZh":"容納人數與床位規範","titleEn":"Capacity & Bedding Policy","contentZh":"整棟樓總共 5 間房間，最多容納 18 位貴賓，全館床位已達舒適上限，恕無法提供加床或超額入住服務。請於預訂時確實填寫入住總人數。","contentEn":"Shan Yu Villa features 5 bedrooms accommodating up to 18 guests maximum. Extra beds are not available. Please confirm exact guest counts upon reservation."}',
   '',
   3, 1);
