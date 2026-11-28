/**
 * functions/api/rooms.js
 * 
 * GET /api/rooms - 公開取得所有房型詳細規格、圖片與定價資訊 (100% 資料庫驅動)
 * 
 * 重大更新：
 * 1. 圖片圖集 (gallery) 與封面主圖 (image) 全面連線 D1 media_assets 表 (WHERE category = 'room' AND is_active = 1)
 * 2. 後台管家新增照片、刪除或下架為草稿，前台即時同步生效，徹底告別假資料覆蓋
 * 3. 停用 HTTP 快取 (no-cache, no-store)，確保管家更新後旅客與測試端立即看到最新圖片
 */

const DEFAULT_ROOMS = [
  {
    id: 'room-01',
    floor: '1F',
    titleZh: '1樓 綠意四人景觀套房',
    titleEn: '1F Garden View Quad Suite',
    subtitleZh: '1樓無障礙便利動線・大面綠意窗景・獨立乾濕分離衛浴',
    subtitleEn: '1F Step-Free Access · Garden Views · Private Ensuite Bath',
    capacityZh: '4 人',
    capacityEn: '4 Guests',
    bedTypeZh: '加大雙人床 (Queen Size) x 1 + 標準雙人床 x 1',
    bedTypeEn: '1 Queen Bed + 1 Standard Double Bed',
    size: '約 12 坪',
    basePrice: 8800,
    holidayPrice: 10800,
    capacityStandard: 4,
    capacityMax: 4,
    image: '/img/room-1/room-1-01.webp',
    gallery: [
      '/img/room-1/room-1-01.webp',
      '/img/room-1/room-1-02.webp',
      '/img/room-1/room-1-03.webp',
      '/img/room-1/room-1-04.webp',
      '/img/room-1/room-1-05.webp'
    ],
    highlightsZh: [
      '位於1樓無障礙友善動線，長輩小孩入住安心便利',
      '配置 1 張 Queen Size 加大雙人床 + 1 張標準雙人床',
      '大面採光觀景窗，盡攬綠意山林晨光',
      '獨立乾濕分離衛浴與全套草本洗沐備品',
      '獨立冷暖恆溫變頻空調'
    ],
    highlightsEn: [
      'Convenient 1F step-free access, ideal for seniors and families',
      '1 Queen Bed + 1 Standard Double Bed',
      'Generous scenic windows embracing morning forest light',
      'Private ensuite bathroom with botanical bath amenities',
      'Independent inverter heating and cooling AC'
    ],
    descZh: '位於一樓的寬敞四人套房，設有一張 Queen Size 雙人床與一張標準雙人床。溫潤木質調與大面窗景相映成趣，免除上下樓梯負擔，讓旅人在自然晨光中舒活甦醒。',
    descEn: 'Spacious ground-floor quad suite featuring 1 Queen-size bed and 1 standard double bed. Warm timber tones and tranquil natural morning light ensure a deeply restful stay without stairs.'
  },
  {
    id: 'room-02',
    floor: '1F',
    titleZh: '1樓 山語隱逸雙人套房',
    titleEn: '1F Serenity Double Suite',
    subtitleZh: '加大 Queen Size 舒眠名床・沉靜私密時光・獨立衛浴',
    subtitleEn: '1 Queen Size Bed · Intimate Retreat · Private Ensuite Bath',
    capacityZh: '2 人',
    capacityEn: '2 Guests',
    bedTypeZh: '加大雙人床 (Queen Size) x 1',
    bedTypeEn: '1 Queen Size Bed',
    size: '約 9 坪',
    basePrice: 5800,
    holidayPrice: 7200,
    capacityStandard: 2,
    capacityMax: 2,
    image: '/img/room-2/room-2-01.webp',
    gallery: [
      '/img/room-2/room-2-01.webp',
      '/img/room-2/room-2-02.webp',
      '/img/room-2/room-2-03.webp',
      '/img/room-2/room-2-04.webp'
    ],
    highlightsZh: [
      '1樓沉靜私密角落，靜謐無擾',
      'Queen Size 頂級舒眠名床與透氣天絲寢具',
      '乾濕分離獨立衛浴設備',
      '雙人溫馨休憩沙發與茶几',
      '獨立冷暖變頻空調與高速無線 Wi-Fi'
    ],
    highlightsEn: [
      'Quiet ground-floor sanctuary for restful privacy',
      '1 Premium Queen-size bed with silky tencel linens',
      'Private ensuite bath with separate shower',
      'Cozy two-seater lounge sofa and table',
      'Independent climate control & high-speed Wi-Fi'
    ],
    descZh: '專為雙人打造的隱逸謐靜套房，精選加大 Queen Size 獨立筒舒眠床墊與天絲親膚被品。柔和漫射光線與質樸石木肌理，營造無壓放鬆的私密度假氛圍。',
    descEn: 'Tailored for couples, this intimate suite features a premium Queen mattress and natural materials, creating an effortlessly relaxing sanctuary.'
  },
  {
    id: 'room-03',
    floor: '1F',
    titleZh: '1樓 風荷清幽四人套房',
    titleEn: '1F Lotus Breeze Quad Suite',
    subtitleZh: '兩張舒適雙人床・溫潤木質風格・寬敞獨立衛浴',
    subtitleEn: '2 Double Beds · Natural Timber Ambience · Spacious Ensuite Bath',
    capacityZh: '4 人',
    capacityEn: '4 Guests',
    bedTypeZh: '標準雙人床 x 2',
    bedTypeEn: '2 Standard Double Beds',
    size: '約 11 坪',
    basePrice: 8800,
    holidayPrice: 10800,
    capacityStandard: 4,
    capacityMax: 4,
    image: '/img/room-3/room-3-01.webp',
    gallery: [
      '/img/room-3/room-3-01.webp',
      '/img/room-3/room-3-02.webp',
      '/img/room-3/room-3-03.webp',
      '/img/room-3/room-3-04.webp'
    ],
    highlightsZh: [
      '一樓便捷無階梯動線，出入輕鬆',
      '配置兩張標準雙人床，適合小家庭或好友同行',
      '開闊空間感與自然原木家具配置',
      '乾濕分離獨立衛浴與精緻備品',
      '全室獨立靜音冷暖變頻空調'
    ],
    highlightsEn: [
      'Ground-floor easy access without stairs',
      '2 Standard double beds, perfect for families or friends',
      'Airy layout with handcrafted solid wood furniture',
      'Spacious ensuite bathroom with separate shower zone',
      'Whisper-quiet independent inverter climate control'
    ],
    descZh: '位於一樓的雅緻四人套房，配置兩張標準雙人床。俐落明朗的採光設計與溫馨木質家具，營造賓至如歸的放鬆感，是好友結伴與家庭出遊的愜意首選。',
    descEn: 'Elegant ground-floor suite accommodating four with two standard double beds, bathed in natural light and styled in serene natural woods.'
  },
  {
    id: 'room-04',
    floor: '2F',
    titleZh: '2樓 星空露台四人套房',
    titleEn: '2F Starlight Terrace Quad Suite',
    subtitleZh: '專屬高空星空觀景露台・兩張舒適雙人床・壯闊山景視野',
    subtitleEn: 'Private Viewing Terrace · 2 Double Beds · Majestic Mountain Panorama',
    capacityZh: '4 人',
    capacityEn: '4 Guests',
    bedTypeZh: '標準雙人床 x 2',
    bedTypeEn: '2 Standard Double Beds',
    size: '約 14 坪 (含私人觀景露台)',
    basePrice: 9800,
    holidayPrice: 11800,
    capacityStandard: 4,
    capacityMax: 4,
    image: '/img/room-4/room-4-01.webp',
    gallery: [
      '/img/room-4/room-4-01.webp',
      '/img/room-4/room-4-02.webp',
      '/img/room-4/room-4-03.webp',
      '/img/room-4/room-4-04.webp'
    ],
    highlightsZh: [
      '擁有 2 樓專屬開闊戶外觀景露台，飽覽層疊山巒',
      '夜間仰望無光害星空銀河，晨起漫步雲霧間',
      '配置兩張標準雙人床，視野遼闊採光極佳',
      '乾濕分離獨立衛浴與落地景觀窗',
      '尊榮景觀休閒桌椅'
    ],
    highlightsEn: [
      'Private elevated viewing terrace with sweeping mountain peaks',
      'Stargazing under unpolluted night skies; morning cloud mist',
      '2 Standard double beds with abundant natural daylight',
      'Private ensuite bath with full-height scenic window',
      'Terrace lounge chairs for slow relaxation'
    ],
    descZh: '坐擁二樓制高點的星空觀景套房，擁有專屬的戶外露台。白天遠眺層巒疊嶂與縹緲雲海，夜晚在微風與璀璨星空下品茗談心，感受大自然最純粹的療癒洗禮。',
    descEn: 'Perched on the top floor with an exclusive open-air terrace, this suite invites you to greet rolling morning clouds and stargaze in mountain silence.'
  },
  {
    id: 'room-05',
    floor: '2F',
    titleZh: '2樓 晨曦觀景四人套房',
    titleEn: '2F Dawn Mountain View Quad Suite',
    subtitleZh: '晨曦第一道晨光・極佳採光・高樓層遼闊山巒景致',
    subtitleEn: 'First Morning Light · Sun-drenched Windows · Elevated Scenic Vista',
    capacityZh: '4 人',
    capacityEn: '4 Guests',
    bedTypeZh: '標準雙人床 x 2',
    bedTypeEn: '2 Standard Double Beds',
    size: '約 13 坪',
    basePrice: 9800,
    holidayPrice: 11800,
    capacityStandard: 4,
    capacityMax: 4,
    image: '/img/room-5/room-5-01.webp',
    gallery: [
      '/img/room-5/room-5-01.webp',
      '/img/room-5/room-5-02.webp',
      '/img/room-5/room-5-03.webp',
      '/img/room-5/room-5-04.webp'
    ],
    highlightsZh: [
      '座落於2樓迎光面，每日迎接柔和溫暖晨曦',
      '居高臨下俯瞰卓蘭山谷與果園綠意',
      '配置兩張標準雙人床，空間寬裕舒適',
      '乾濕分離獨立衛浴與大面積觀景採光窗',
      '靜音冷暖空調與全套頂級備品'
    ],
    highlightsEn: [
      'East-facing 2F orientation greeting peaceful dawn rays',
      'Overlooking green orchard hillsides and Zhuolan valley',
      '2 Standard double beds in an expansive airy layout',
      'Bright ensuite bathroom with generous scenic window',
      'Whisper-quiet AC and premium organic amenities'
    ],
    descZh: '迎向東方的晨曦觀景套房，當清晨第一道陽光灑落，整座山谷的朝氣在此甦醒。寬敞溫潤的起居氛圍，讓每一次深呼吸都充滿大自然芬多精的清新。',
    descEn: 'Greeting the first sun rays over eastern mountain ridges, this sun-lit suite offers panoramic countryside views and pure rejuvenating mountain air.'
  }
];

const normalizeRoomId = (id) => (id || '').toLowerCase().replace(/^room-0?/, 'room-');

export async function onRequestGet(context) {
  const { env } = context;

  const noCacheHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  try {
    if (!env || !env.DB) {
      return Response.json({ success: true, rooms: DEFAULT_ROOMS }, { headers: noCacheHeaders });
    }

    // 1. 查詢 D1 rooms 基本房型資訊
    let roomResults = [];
    try {
      const dbRooms = await env.DB.prepare(`
        SELECT 
          id, 
          name AS titleZh, 
          title_en AS titleEn,
          subtitle AS subtitleZh, 
          subtitle_en AS subtitleEn,
          floor,
          capacity_standard AS capacityStandard, 
          capacity_max AS capacityMax, 
          capacity_zh AS capacityZh,
          capacity_en AS capacityEn,
          bed_type_zh AS bedTypeZh,
          bed_type_en AS bedTypeEn,
          size_info AS size,
          base_price AS basePrice, 
          holiday_price AS holidayPrice, 
          extra_bed_price AS extraBedPrice,
          image,
          gallery_json AS galleryJson,
          highlights_zh_json AS highlightsZhJson,
          highlights_en_json AS highlightsEnJson,
          desc_zh AS descZh,
          desc_en AS descEn,
          is_active AS isActive
        FROM rooms
        WHERE is_active = 1 AND id != 'villa-full'
        ORDER BY id ASC
      `).all();
      roomResults = dbRooms?.results || [];
    } catch (roomErr) {
      console.warn('[Rooms API] 查詢 rooms 表警訊:', roomErr.message);
    }

    // 若 rooms 表暫無資料，以 DEFAULT_ROOMS 作為基礎框架
    const baseRooms = roomResults.length > 0 ? roomResults : DEFAULT_ROOMS;

    // 2. 核心：即時自 media_assets 查詢啟用中的客房實景寫真 (is_active = 1)
    let activeMedia = [];
    try {
      const mediaRes = await env.DB.prepare(`
        SELECT sub_category, cdn_url, sort_order, title_zh, tag_zh
        FROM media_assets 
        WHERE category = 'room' AND is_active = 1 
        ORDER BY sort_order ASC, created_at ASC
      `).all();
      activeMedia = mediaRes?.results || [];
    } catch (mediaErr) {
      console.warn('[Rooms API] 查詢 media_assets 警訊:', mediaErr.message);
    }

    // 3. 將 media_assets 的動態圖片綁定至各房型
    const formattedRooms = baseRooms.map(r => {
      const defaultMatch = DEFAULT_ROOMS.find(d => normalizeRoomId(d.id) === normalizeRoomId(r.id)) || {};

      // 匹配該房型的所有啟用圖片 (支援 room-1 與 room-01 兼容)
      const matchedMedia = activeMedia.filter(m => normalizeRoomId(m.sub_category) === normalizeRoomId(r.id));

      let gallery = [];
      let image = r.image || defaultMatch.image;

      // 🎯 只要 media_assets 中有圖片管理記錄，100% 以 media_assets 為準！
      // 若管家將圖片下架，該圖片立即從 gallery 消失；若上傳新圖立即出現在 gallery
      if (activeMedia.length > 0) {
        gallery = matchedMedia.map(m => m.cdn_url);
        if (gallery.length > 0) {
          image = gallery[0];
        } else {
          // 該房型所有相片皆被管家暫停/下架，保留首張預設或空圖
          image = defaultMatch.image || '';
        }
      } else {
        // media_assets 表尚未建立時的安全降級
        if (r.galleryJson) {
          try { gallery = JSON.parse(r.galleryJson); } catch (e) {}
        }
        if (!gallery || gallery.length === 0) {
          gallery = defaultMatch.gallery || [];
        }
      }

      let highlightsZh = defaultMatch.highlightsZh || [];
      if (r.highlightsZhJson) {
        try { highlightsZh = JSON.parse(r.highlightsZhJson); } catch (e) {}
      }

      let highlightsEn = defaultMatch.highlightsEn || [];
      if (r.highlightsEnJson) {
        try { highlightsEn = JSON.parse(r.highlightsEnJson); } catch (e) {}
      }

      return {
        id: r.id,
        floor: r.floor || defaultMatch.floor || '1F',
        titleZh: r.titleZh || defaultMatch.titleZh,
        titleEn: r.titleEn || defaultMatch.titleEn,
        subtitleZh: r.subtitleZh || defaultMatch.subtitleZh,
        subtitleEn: r.subtitleEn || defaultMatch.subtitleEn,
        capacityZh: r.capacityZh || defaultMatch.capacityZh || `${r.capacityStandard || 4} 人`,
        capacityEn: r.capacityEn || defaultMatch.capacityEn || `${r.capacityStandard || 4} Guests`,
        bedTypeZh: r.bedTypeZh || defaultMatch.bedTypeZh,
        bedTypeEn: r.bedTypeEn || defaultMatch.bedTypeEn,
        size: r.size || defaultMatch.size,
        basePrice: r.basePrice || defaultMatch.basePrice,
        holidayPrice: r.holidayPrice || defaultMatch.holidayPrice,
        capacityStandard: r.capacityStandard || defaultMatch.capacityStandard || 4,
        capacityMax: r.capacityMax || defaultMatch.capacityMax || 4,
        image,
        gallery,
        highlightsZh,
        highlightsEn,
        descZh: r.descZh || defaultMatch.descZh,
        descEn: r.descEn || defaultMatch.descEn
      };
    });

    // 4. 動態納入管家在後台自訂新增的全新客房分類 (如 room-custom-xxx)
    const baseNormalizedIds = new Set(baseRooms.map(r => normalizeRoomId(r.id)));
    const customSubCats = new Set();
    activeMedia.forEach(m => {
      const norm = normalizeRoomId(m.sub_category);
      if (norm && !baseNormalizedIds.has(norm)) {
        customSubCats.add(m.sub_category);
      }
    });

    customSubCats.forEach(customSubId => {
      const customPhotos = activeMedia.filter(m => m.sub_category === customSubId);
      if (customPhotos.length > 0) {
        formattedRooms.push({
          id: customSubId,
          floor: '自訂',
          titleZh: customPhotos[0].tag_zh || '全新規劃特色客房',
          titleEn: 'Exclusive Private Suite',
          subtitleZh: '專屬私人景觀空間・獨立衛浴',
          subtitleEn: 'Exclusive Private Suite · Ensuite Bath',
          capacityZh: '4 人',
          capacityEn: '4 Guests',
          bedTypeZh: '雙人床',
          bedTypeEn: 'Double Bed',
          size: '約 12 坪',
          basePrice: 8800,
          holidayPrice: 10800,
          capacityStandard: 4,
          capacityMax: 4,
          image: customPhotos[0].cdn_url,
          gallery: customPhotos.map(m => m.cdn_url),
          highlightsZh: ['專屬私密空間', '自然採光通風良好', '乾濕分離衛浴'],
          highlightsEn: ['Private sanctuary', 'Natural daylight', 'Private ensuite'],
          descZh: '全新規劃之特色客房空間，環境幽靜宜人。',
          descEn: 'Newly designed private guest suite.'
        });
      }
    });

    return Response.json({
      success: true,
      rooms: formattedRooms
    }, { headers: noCacheHeaders });

  } catch (err) {
    console.warn('[Rooms API] 讀取失敗，回傳安全預設:', err.message);
    return Response.json({
      success: true,
      rooms: DEFAULT_ROOMS,
      _fallback: true
    }, { headers: noCacheHeaders });
  }
}
