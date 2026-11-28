/**
 * functions/api/admin/rooms.js
 * 
 * 山語 Villa 後台客房空間全規格管理 API
 * 支援功能：
 * 1. GET: 讀取所有客房空間完整規格 (含草稿/暫停房型) 並統計關聯相片數
 * 2. POST: 新增客房空間 (完整對齊前台規格：標籤、床型、人數、坪數、介紹、亮點等)
 * 3. PATCH: 編輯客房空間規格或單獨切換狀態 (is_active)
 * 4. DELETE: 刪除客房空間
 * 
 * 包含強固的自我修復 (Self-Healing) 機制：自動檢測 rooms 擴充欄位、動態升級表結構與補齊預設房型
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8'
};

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
    extraBedPrice: 1500,
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
    descEn: 'Spacious ground-floor quad suite featuring 1 Queen-size bed and 1 standard double bed. Warm timber tones and tranquil natural morning light ensure a deeply restful stay without stairs.',
    isActive: true
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
    extraBedPrice: 1500,
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
    descEn: 'Tailored for couples, this intimate suite features a premium Queen mattress and natural materials, creating an effortlessly relaxing sanctuary.',
    isActive: true
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
    extraBedPrice: 1500,
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
    descEn: 'Elegant ground-floor suite accommodating four with two standard double beds, bathed in natural light and styled in serene natural woods.',
    isActive: true
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
    extraBedPrice: 1500,
    capacityStandard: 4,
    capacityMax: 4,
    image: '/img/room-4/room-4-01.webp',
    gallery: [
      '/img/room-4/room-4-01.webp',
      '/img/room-4/room-4-02.webp',
      '/img/room-4/room-4-03.webp',
      '/img/room-4/room-4-04.webp',
      '/img/room-4/room-4-05.webp'
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
    descEn: 'Perched on the top floor with an exclusive open-air terrace, this suite invites you to greet rolling morning clouds and stargaze in mountain silence.',
    isActive: true
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
    extraBedPrice: 1500,
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
    descEn: 'Greeting the first sun rays over eastern mountain ridges, this sun-lit suite offers panoramic countryside views and pure rejuvenating mountain air.',
    isActive: true
  }
];

/**
 * 自我修復：確保 rooms 表結構與擴充欄位完整存在
 */
async function ensureRoomsTable(db) {
  if (!db) return;
  try {
    // 檢查現有欄位
    const columnsInfo = await db.prepare("PRAGMA table_info(rooms)").all();
    const existingCols = new Set((columnsInfo?.results || []).map(c => c.name));

    const requiredCols = [
      { name: 'floor', type: "TEXT DEFAULT '1F'" },
      { name: 'title_en', type: 'TEXT' },
      { name: 'subtitle_en', type: 'TEXT' },
      { name: 'capacity_zh', type: 'TEXT' },
      { name: 'capacity_en', type: 'TEXT' },
      { name: 'bed_type_zh', type: 'TEXT' },
      { name: 'bed_type_en', type: 'TEXT' },
      { name: 'size_info', type: 'TEXT' },
      { name: 'image', type: 'TEXT' },
      { name: 'gallery_json', type: 'TEXT' },
      { name: 'highlights_zh_json', type: 'TEXT' },
      { name: 'highlights_en_json', type: 'TEXT' },
      { name: 'desc_zh', type: 'TEXT' },
      { name: 'desc_en', type: 'TEXT' }
    ];

    for (const col of requiredCols) {
      if (!existingCols.has(col.name)) {
        await db.prepare(`ALTER TABLE rooms ADD COLUMN ${col.name} ${col.type}`).run();
      }
    }

    // 檢查是否有足夠的 5 間房間資料
    const countRes = await db.prepare("SELECT COUNT(*) as cnt FROM rooms WHERE id != 'villa-full'").first();
    if (!countRes || countRes.cnt < 5) {
      for (const r of DEFAULT_ROOMS) {
        await db.prepare(`
          INSERT OR REPLACE INTO rooms (
            id, name, title_en, subtitle, subtitle_en, floor,
            capacity_standard, capacity_max, capacity_zh, capacity_en,
            bed_type_zh, bed_type_en, size_info, base_price, holiday_price,
            extra_bed_price, image, gallery_json, highlights_zh_json, highlights_en_json,
            desc_zh, desc_en, is_active
          ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?
          )
        `).bind(
          r.id,
          r.titleZh,
          r.titleEn,
          r.subtitleZh,
          r.subtitleEn,
          r.floor,
          r.capacityStandard,
          r.capacityMax,
          r.capacityZh,
          r.capacityEn,
          r.bedTypeZh,
          r.bedTypeEn,
          r.size,
          r.basePrice,
          r.holidayPrice,
          r.extraBedPrice || 1500,
          r.image,
          JSON.stringify(r.gallery),
          JSON.stringify(r.highlightsZh),
          JSON.stringify(r.highlightsEn),
          r.descZh,
          r.descEn,
          r.isActive ? 1 : 0
        ).run();
      }
    }
  } catch (err) {
    console.warn('[Admin Rooms API] ensureRoomsTable 警訊:', err.message);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  const { env } = context;

  try {
    if (!env || !env.DB) {
      return Response.json({ success: true, rooms: DEFAULT_ROOMS }, { headers: CORS_HEADERS });
    }

    await ensureRoomsTable(env.DB);

    // 1. 查詢所有客房 (排除 villa-full 或包棟特殊標籤，按 id 正序)
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
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM rooms
      WHERE id != 'villa-full'
      ORDER BY id ASC
    `).all();

    const roomsList = (dbRooms?.results || []).map(r => {
      let highlightsZh = [];
      let highlightsEn = [];
      try {
        if (r.highlightsZhJson) highlightsZh = JSON.parse(r.highlightsZhJson);
      } catch {
        highlightsZh = [];
      }
      try {
        if (r.highlightsEnJson) highlightsEn = JSON.parse(r.highlightsEnJson);
      } catch {
        highlightsEn = [];
      }

      return {
        ...r,
        titleZh: r.titleZh || r.name || '',
        floor: r.floor || '1F',
        isActive: Boolean(r.isActive),
        highlightsZh,
        highlightsEn
      };
    });

    return Response.json({
      success: true,
      rooms: roomsList.length > 0 ? roomsList : DEFAULT_ROOMS
    }, { headers: CORS_HEADERS });

  } catch (err) {
    console.error('[Admin Rooms API] GET 錯誤:', err);
    // 安全 fallback
    return Response.json({
      success: true,
      rooms: DEFAULT_ROOMS
    }, { headers: CORS_HEADERS });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env || !env.DB) {
      return Response.json({ success: false, message: '資料庫未連線' }, { status: 500, headers: CORS_HEADERS });
    }

    await ensureRoomsTable(env.DB);

    const payload = await request.json();
    let {
      id,
      titleZh,
      titleEn = '',
      subtitleZh = '',
      subtitleEn = '',
      floor = '1F',
      capacityZh = '4 人',
      capacityEn = '4 Guests',
      capacityStandard = 4,
      capacityMax = 4,
      bedTypeZh = '',
      bedTypeEn = '',
      size = '',
      basePrice = 8800,
      holidayPrice = 10800,
      extraBedPrice = 1500,
      descZh = '',
      descEn = '',
      highlightsZh = [],
      highlightsEn = [],
      isActive = true
    } = payload;

    if (!titleZh || !titleZh.trim()) {
      return Response.json({ success: false, message: '房型名稱 (繁中) 為必填欄位。' }, { status: 400, headers: CORS_HEADERS });
    }

    // 若未指定 id，自動依流水號產生 room-XX
    if (!id || !id.trim()) {
      const existing = await env.DB.prepare("SELECT id FROM rooms WHERE id LIKE 'room-%' ORDER BY id DESC LIMIT 1").first();
      let nextNum = 1;
      if (existing && existing.id) {
        const match = existing.id.match(/room-(\d+)/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }
      id = `room-${String(nextNum).padStart(2, '0')}`;
    } else {
      id = id.trim().toLowerCase();
    }

    // 檢查 ID 重複
    const dupCheck = await env.DB.prepare('SELECT id FROM rooms WHERE id = ?').bind(id).first();
    if (dupCheck) {
      return Response.json({ success: false, message: `客房代碼 ${id} 已存在，請使用其他代碼。` }, { status: 400, headers: CORS_HEADERS });
    }

    const highlightsZhJson = JSON.stringify(Array.isArray(highlightsZh) ? highlightsZh : []);
    const highlightsEnJson = JSON.stringify(Array.isArray(highlightsEn) ? highlightsEn : []);

    await env.DB.prepare(`
      INSERT INTO rooms (
        id, name, title_en, subtitle, subtitle_en, floor,
        capacity_standard, capacity_max, capacity_zh, capacity_en,
        bed_type_zh, bed_type_en, size_info, base_price, holiday_price,
        extra_bed_price, highlights_zh_json, highlights_en_json,
        desc_zh, desc_en, is_active, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, CURRENT_TIMESTAMP
      )
    `).bind(
      id,
      titleZh.trim(),
      titleEn.trim(),
      subtitleZh.trim(),
      subtitleEn.trim(),
      floor.trim(),
      Number(capacityStandard) || 4,
      Number(capacityMax) || 4,
      capacityZh.trim(),
      capacityEn.trim(),
      bedTypeZh.trim(),
      bedTypeEn.trim(),
      size.trim(),
      Number(basePrice) || 0,
      Number(holidayPrice) || 0,
      Number(extraBedPrice) || 1500,
      highlightsZhJson,
      highlightsEnJson,
      descZh.trim(),
      descEn.trim(),
      isActive ? 1 : 0
    ).run();

    return Response.json({
      success: true,
      message: `客房「${titleZh}」新增成功！`,
      roomId: id
    }, { headers: CORS_HEADERS });

  } catch (err) {
    console.error('[Admin Rooms API] POST 錯誤:', err);
    return Response.json({ success: false, message: '新增客房失敗，請檢查資料格式或稍後再試。' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function onRequestPatch(context) {
  const { request, env } = context;

  try {
    if (!env || !env.DB) {
      return Response.json({ success: false, message: '資料庫未連線' }, { status: 500, headers: CORS_HEADERS });
    }

    await ensureRoomsTable(env.DB);

    const payload = await request.json();
    const { id, action } = payload;

    if (!id) {
      return Response.json({ success: false, message: '未指定客房代碼 (id)' }, { status: 400, headers: CORS_HEADERS });
    }

    // 單純切換啟用狀態
    if (action === 'toggle_active') {
      const nextActive = payload.isActive ? 1 : 0;
      await env.DB.prepare('UPDATE rooms SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(nextActive, id).run();

      return Response.json({ success: true, message: `客房狀態已更新為：${nextActive ? '啟用' : '暫停開放'}` }, { headers: CORS_HEADERS });
    }

    // 完整資訊編輯
    const {
      titleZh,
      titleEn = '',
      subtitleZh = '',
      subtitleEn = '',
      floor = '1F',
      capacityZh = '4 人',
      capacityEn = '4 Guests',
      capacityStandard = 4,
      capacityMax = 4,
      bedTypeZh = '',
      bedTypeEn = '',
      size = '',
      basePrice = 8800,
      holidayPrice = 10800,
      extraBedPrice = 1500,
      descZh = '',
      descEn = '',
      highlightsZh = [],
      highlightsEn = [],
      isActive = true
    } = payload;

    if (!titleZh || !titleZh.trim()) {
      return Response.json({ success: false, message: '房型名稱為必填欄位。' }, { status: 400, headers: CORS_HEADERS });
    }

    const highlightsZhJson = JSON.stringify(Array.isArray(highlightsZh) ? highlightsZh : []);
    const highlightsEnJson = JSON.stringify(Array.isArray(highlightsEn) ? highlightsEn : []);

    await env.DB.prepare(`
      UPDATE rooms SET
        name = ?,
        title_en = ?,
        subtitle = ?,
        subtitle_en = ?,
        floor = ?,
        capacity_standard = ?,
        capacity_max = ?,
        capacity_zh = ?,
        capacity_en = ?,
        bed_type_zh = ?,
        bed_type_en = ?,
        size_info = ?,
        base_price = ?,
        holiday_price = ?,
        extra_bed_price = ?,
        highlights_zh_json = ?,
        highlights_en_json = ?,
        desc_zh = ?,
        desc_en = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      titleZh.trim(),
      titleEn.trim(),
      subtitleZh.trim(),
      subtitleEn.trim(),
      floor.trim(),
      Number(capacityStandard) || 4,
      Number(capacityMax) || 4,
      capacityZh.trim(),
      capacityEn.trim(),
      bedTypeZh.trim(),
      bedTypeEn.trim(),
      size.trim(),
      Number(basePrice) || 0,
      Number(holidayPrice) || 0,
      Number(extraBedPrice) || 1500,
      highlightsZhJson,
      highlightsEnJson,
      descZh.trim(),
      descEn.trim(),
      isActive ? 1 : 0,
      id
    ).run();

    return Response.json({
      success: true,
      message: `客房「${titleZh}」規格已更新成功！`
    }, { headers: CORS_HEADERS });

  } catch (err) {
    console.error('[Admin Rooms API] PATCH 錯誤:', err);
    return Response.json({ success: false, message: '更新客房失敗，請稍後再試。' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;

  try {
    if (!env || !env.DB) {
      return Response.json({ success: false, message: '資料庫未連線' }, { status: 500, headers: CORS_HEADERS });
    }

    await ensureRoomsTable(env.DB);

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return Response.json({ success: false, message: '未指定要刪除的客房代碼。' }, { status: 400, headers: CORS_HEADERS });
    }

    // 查詢關聯照片數量
    const photoCount = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM media_assets 
      WHERE category = 'room' AND (sub_category = ? OR sub_category = ?)
    `).bind(id, id.replace(/^room-0?/, 'room-')).first();

    if (photoCount && photoCount.count > 0) {
      return Response.json({
        success: false,
        message: `此客房底下尚有 ${photoCount.count} 張實景照片，請先刪除或移轉照片後再行刪除空間分類。`
      }, { status: 400, headers: CORS_HEADERS });
    }

    await env.DB.prepare('DELETE FROM rooms WHERE id = ?').bind(id).run();

    return Response.json({
      success: true,
      message: `客房空間 (${id}) 已成功刪除！`
    }, { headers: CORS_HEADERS });

  } catch (err) {
    console.error('[Admin Rooms API] DELETE 錯誤:', err);
    return Response.json({ success: false, message: '刪除客房失敗，請稍後再試。' }, { status: 500, headers: CORS_HEADERS });
  }
}
