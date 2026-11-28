/**
 * functions/api/admin/facilities.js
 * 
 * 山語 Villa 後台園區公共設施全規格管理 API
 * 支援功能：
 * 1. GET: 讀取所有公共設施清單 (含草稿/暫停公設) 並依序號排列
 * 2. POST: 新增公設空間 (對齊前台規格：標籤、介紹、亮點/設備清單等)
 * 3. PATCH: 編輯公設空間規格或單獨切換狀態 (is_active)
 * 4. DELETE: 刪除公設空間
 * 
 * 包含強固的自我修復 (Self-Healing) 機制：自動檢測並建立 facilities 資料表與預設 6 大公設種子
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8'
};

const DEFAULT_FACILITIES = [
  {
    id: 'ktv-theater',
    titleZh: 'Grand Lounge 奢華客廳與 KTV 視聽劇院',
    titleEn: 'Grand Living Hall & Professional KTV System',
    descZh: '挑高寬敞的豪華大客廳，配備高階音響、大螢幕電視與最新點歌卡拉OK系統，支援多人對唱，讓您的歡聚之夜充滿歌聲與笑聲。',
    descEn: 'Soaring, spacious living hall equipped with professional acoustics, big-screen display, and the latest karaoke system with wireless microphones.',
    image: '/img/living-ktv/living-ktv-01.webp',
    featuresZh: [
      '海量最新雲端伴唱歌單',
      '雙支無線抗噪動圈麥克風',
      '高傳真立體環繞音響',
      '寬敞深座舒適真皮大沙發'
    ],
    featuresEn: [
      'Cloud-updated song catalog',
      'Dual anti-feedback wireless microphones',
      'Hi-Fi dynamic surround sound',
      'Spacious deep leather seating'
    ],
    gallery: [
      '/img/living-ktv/living-ktv-01.webp',
      '/img/living-ktv/living-ktv-03.webp',
      '/img/living-ktv/living-ktv-04.webp',
      '/img/living-ktv/living-ktv-02.webp',
      '/img/living-ktv/living-ktv-05.webp'
    ],
    sortOrder: 1,
    isActive: true
  },
  {
    id: 'smart-kitchen',
    titleZh: '中島開放式智能廚房與吧檯',
    titleEn: 'Smart Gourmet Kitchen & Mini Bar Lounge',
    descZh: '現代化開放式智能中島廚房與高腳 Mini Bar，大型雙門冰箱、微波爐、電鍋、熱水壺及餐具一應俱全，無論料理下廚或調飲皆隨心所欲。',
    descEn: 'Contemporary open-concept island kitchen and stylish high-top mini bar, equipped with large double-door refrigerator, appliances, and glassware.',
    image: '/img/kitchen-bar/kitchen-bar-06.webp',
    featuresZh: [
      '開放式智能料理中島與高腳吧台',
      '大型雙門家用冷藏冷凍冰箱',
      '微波爐、快煮壺、全套碗盤刀叉',
      '精緻高腳酒杯與品飲器皿'
    ],
    featuresEn: [
      'Smart cooking island & high bar',
      'Spacious double-door refrigerator',
      'Microwave, kettle, full cutlery sets',
      'Premium glassware & drink accessories'
    ],
    gallery: [
      '/img/kitchen-bar/kitchen-bar-06.webp',
      '/img/kitchen-bar/kitchen-bar-04.webp',
      '/img/kitchen-bar/kitchen-bar-02.webp',
      '/img/kitchen-bar/kitchen-bar-03.webp',
      '/img/kitchen-bar/kitchen-bar-05.webp'
    ],
    sortOrder: 2,
    isActive: true
  },
  {
    id: 'mahjong-room',
    titleZh: '頂級電動過山車麻將娛樂室',
    titleEn: 'Automatic Mahjong Table Experience',
    descZh: '專屬配置最新型全自動過山車靜音電動麻將桌，洗牌迅速順暢、零噪音打擾。舒適人體工學皮椅與明亮採光，是好友徹夜切磋的最佳娛樂。',
    descEn: 'Features the latest whisper-quiet automatic mahjong table with rapid shuffling and zero jams. Ergonomic executive chairs ensure comfortable gaming sessions.',
    image: '/img/living-ktv/living-ktv-04.webp',
    featuresZh: [
      '最新四口過山車全自動靜音洗牌機',
      '配備兩副頂級磁吸刻字專用麻將牌',
      '人體工學高承重透氣皮椅',
      '專屬飲料杯架與籌碼置物槽'
    ],
    featuresEn: [
      'Whisper-quiet auto-shuffling table mechanism',
      'Dual sets of weighted engraved tiles',
      'Ergonomic supportive executive seating',
      'Integrated cup holders and chip trays'
    ],
    gallery: [
      '/img/living-ktv/living-ktv-04.webp',
      '/img/living-ktv/living-ktv-02.webp',
      '/img/living-ktv/living-ktv-05.webp'
    ],
    sortOrder: 3,
    isActive: true
  },
  {
    id: 'outdoor-bbq',
    titleZh: '戶外庭院專業美式 BBQ 烤肉區',
    titleEn: 'Outdoor Courtyard Premium BBQ Area',
    descZh: '寬敞專屬的戶外庭園烤肉專區，備有大型美式不鏽鋼悶烤爐、專業烤肉網架與戶外野餐長桌，享受大自然芬多精與炭火美食的微醺聚餐時光。',
    descEn: 'Generous private courtyard featuring heavy-duty American BBQ grill, stainless food prep tables, and picnic bench seating beneath forest canopies.',
    image: '/img/outdoor-bbq-tea/outdoor-bbq-tea-09.webp',
    featuresZh: [
      '專業級大型美式厚鋼附蓋烤肉爐',
      '戶外獨立洗滌料理水槽與操作檯面',
      '庭園夜間照明營造溫馨聚會氣氛',
      '寬敞戶外休閒用餐長桌椅'
    ],
    featuresEn: [
      'Heavy-duty American barrel smoker grill',
      'Dedicated outdoor wash sink & food prep station',
      'Atmospheric ambient warm courtyard lighting',
      'Generous outdoor dining picnic tables'
    ],
    gallery: [
      '/img/outdoor-bbq-tea/outdoor-bbq-tea-09.webp',
      '/img/outdoor-bbq-tea/outdoor-bbq-tea-10.webp',
      '/img/outdoor-bbq-tea/outdoor-bbq-tea-08.webp'
    ],
    sortOrder: 4,
    isActive: true
  },
  {
    id: 'tea-ceremony',
    titleZh: '高山景觀品茗賞景茶席',
    titleEn: 'Scenic Mountain Tea Tasting Lounge',
    descZh: '特別規劃的景觀茶席空間，備有典雅精緻茶具與山泉水快煮設備。在雲霧繚繞中細細品嚐高山冷泡茶或東方美人茶，沉澱心靈享受隱逸慢時光。',
    descEn: 'A tranquil space dedicated to slow tea appreciation, complete with handcrafted ceramic tea ware, overlooking panoramic mountain mists.',
    image: '/img/outdoor-bbq-tea/outdoor-bbq-tea-03.webp',
    featuresZh: [
      '典雅手作陶藝高山品茗茶具組',
      '專屬山景茶席座位，採光清幽恬靜',
      '附贈苗栗在地特產精選高山冷泡茶葉',
      '適合三五好友午後靜心對談'
    ],
    featuresEn: [
      'Handcrafted ceramic tea set with pot and cups',
      'Sun-drenched scenic seating with forest views',
      'Complimentary local Miaoli specialty mountain tea',
      'Perfect for mindful conversations and serene afternoons'
    ],
    gallery: [
      '/img/outdoor-bbq-tea/outdoor-bbq-tea-03.webp',
      '/img/outdoor-bbq-tea/outdoor-bbq-tea-04.webp',
      '/img/outdoor-bbq-tea/outdoor-bbq-tea-06.webp',
      '/img/outdoor-bbq-tea/outdoor-bbq-tea-02.webp'
    ],
    sortOrder: 5,
    isActive: true
  },
  {
    id: 'viewing-deck',
    titleZh: '觀景木棧露台與璀璨星夜',
    titleEn: 'Panoramic Viewing Deck & Starlight Terrace',
    descZh: '寬敞的戶外木棧觀景露台，白天盡覽群山起伏與漫漫雲海，入夜後微光倒影輝映漫天星空，為您營造最浪漫沉靜的山居慢活時光。',
    descEn: 'Spacious timber viewing terrace offering panoramic vistas of rolling mountains and cloud sea by day, and star-studded skies by night.',
    image: '/img/homebanner/homebanner-02.webp',
    featuresZh: [
      '全景開闊無遮蔽山巒視野',
      '戶外高架景觀木棧平台',
      '無光害夜間觀星與倒影氛圍',
      '晨曦日出與夕陽彩霞暮色'
    ],
    featuresEn: [
      'Panoramic unobstructed mountain views',
      'Elevated timber viewing terrace',
      'Zero light pollution stargazing',
      'Sunrise mist & crimson sunset twilight'
    ],
    gallery: [
      '/img/homebanner/homebanner-02.webp',
      '/img/cloud-sea/cloud-sea-01.webp',
      '/img/scenery-night/scenery-night-02.webp',
      '/img/scenery-night/scenery-night-01.webp'
    ],
    sortOrder: 6,
    isActive: true
  }
];

/**
 * 自我修復：確保 facilities 資料表與預設種子存在
 */
async function ensureFacilitiesTable(db) {
  if (!db) return;
  try {
    await db.prepare(`
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
      )
    `).run();

    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_facilities_sort ON facilities(is_active, sort_order ASC)`).run();

    // 檢查有無資料，無資料則補入預設設施
    const countRes = await db.prepare('SELECT COUNT(*) as cnt FROM facilities').first();
    if (!countRes || countRes.cnt === 0) {
      for (const f of DEFAULT_FACILITIES) {
        await db.prepare(`
          INSERT OR REPLACE INTO facilities (
            id, title_zh, title_en, desc_zh, desc_en, image,
            features_zh_json, features_en_json, gallery_json, sort_order, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          f.id,
          f.titleZh,
          f.titleEn,
          f.descZh,
          f.descEn,
          f.image,
          JSON.stringify(f.featuresZh),
          JSON.stringify(f.featuresEn),
          JSON.stringify(f.gallery),
          f.sortOrder,
          f.isActive ? 1 : 0
        ).run();
      }
    }
  } catch (err) {
    console.warn('[Admin Facilities API] ensureFacilitiesTable 警訊:', err.message);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  const { env } = context;

  try {
    if (!env || !env.DB) {
      return Response.json({ success: true, facilities: DEFAULT_FACILITIES }, { headers: CORS_HEADERS });
    }

    await ensureFacilitiesTable(env.DB);

    const dbFacs = await env.DB.prepare(`
      SELECT 
        id, 
        title_zh AS titleZh, 
        title_en AS titleEn,
        desc_zh AS descZh, 
        desc_en AS descEn,
        image,
        features_zh_json AS featuresZhJson,
        features_en_json AS featuresEnJson,
        gallery_json AS galleryJson,
        sort_order AS sortOrder,
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM facilities
      ORDER BY sort_order ASC, id ASC
    `).all();

    const facilitiesList = (dbFacs?.results || []).map(f => {
      let featuresZh = [];
      let featuresEn = [];
      try {
        if (f.featuresZhJson) featuresZh = JSON.parse(f.featuresZhJson);
      } catch {
        featuresZh = [];
      }
      try {
        if (f.featuresEnJson) featuresEn = JSON.parse(f.featuresEnJson);
      } catch {
        featuresEn = [];
      }

      return {
        ...f,
        isActive: Boolean(f.isActive),
        featuresZh,
        featuresEn
      };
    });

    return Response.json({
      success: true,
      facilities: facilitiesList.length > 0 ? facilitiesList : DEFAULT_FACILITIES
    }, { headers: CORS_HEADERS });

  } catch (err) {
    console.error('[Admin Facilities API] GET 錯誤:', err);
    // 安全 fallback
    return Response.json({
      success: true,
      facilities: DEFAULT_FACILITIES
    }, { headers: CORS_HEADERS });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env || !env.DB) {
      return Response.json({ success: false, message: '資料庫未連線' }, { status: 500, headers: CORS_HEADERS });
    }

    await ensureFacilitiesTable(env.DB);

    const payload = await request.json();
    let {
      id,
      titleZh,
      titleEn = '',
      descZh = '',
      descEn = '',
      featuresZh = [],
      featuresEn = [],
      sortOrder = 1,
      isActive = true
    } = payload;

    if (!titleZh || !titleZh.trim()) {
      return Response.json({ success: false, message: '公設名稱 (繁中) 為必填欄位。' }, { status: 400, headers: CORS_HEADERS });
    }

    // 若未指定 id，自動以 fac-時間戳記或流水號產生
    if (!id || !id.trim()) {
      const slug = titleEn
        ? titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : '';
      id = slug ? `fac-${slug}` : `fac-${Date.now().toString(36)}`;
    } else {
      id = id.trim().toLowerCase();
    }

    // 檢查 ID 重複
    const dupCheck = await env.DB.prepare('SELECT id FROM facilities WHERE id = ?').bind(id).first();
    if (dupCheck) {
      return Response.json({ success: false, message: `公設代碼 ${id} 已存在，請使用其他代碼。` }, { status: 400, headers: CORS_HEADERS });
    }

    const featuresZhJson = JSON.stringify(Array.isArray(featuresZh) ? featuresZh : []);
    const featuresEnJson = JSON.stringify(Array.isArray(featuresEn) ? featuresEn : []);

    await env.DB.prepare(`
      INSERT INTO facilities (
        id, title_zh, title_en, desc_zh, desc_en,
        image, features_zh_json, features_en_json,
        sort_order, is_active, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        '', ?, ?,
        ?, ?, CURRENT_TIMESTAMP
      )
    `).bind(
      id,
      titleZh.trim(),
      titleEn.trim(),
      descZh.trim(),
      descEn.trim(),
      featuresZhJson,
      featuresEnJson,
      Number(sortOrder) || 1,
      isActive ? 1 : 0
    ).run();

    return Response.json({
      success: true,
      message: `公共設施「${titleZh}」新增成功！`,
      facilityId: id
    }, { headers: CORS_HEADERS });

  } catch (err) {
    console.error('[Admin Facilities API] POST 錯誤:', err);
    return Response.json({ success: false, message: '新增公設失敗，請檢查資料格式或稍後再試。' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function onRequestPatch(context) {
  const { request, env } = context;

  try {
    if (!env || !env.DB) {
      return Response.json({ success: false, message: '資料庫未連線' }, { status: 500, headers: CORS_HEADERS });
    }

    await ensureFacilitiesTable(env.DB);

    const payload = await request.json();
    const { id, action } = payload;

    if (!id) {
      return Response.json({ success: false, message: '未指定公設代碼 (id)' }, { status: 400, headers: CORS_HEADERS });
    }

    // 單純切換啟用狀態
    if (action === 'toggle_active') {
      const nextActive = payload.isActive ? 1 : 0;
      await env.DB.prepare('UPDATE facilities SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(nextActive, id).run();

      return Response.json({ success: true, message: `公設狀態已更新為：${nextActive ? '開放' : '暫停開放'}` }, { headers: CORS_HEADERS });
    }

    // 完整資訊編輯
    const {
      titleZh,
      titleEn = '',
      descZh = '',
      descEn = '',
      featuresZh = [],
      featuresEn = [],
      sortOrder = 1,
      isActive = true
    } = payload;

    if (!titleZh || !titleZh.trim()) {
      return Response.json({ success: false, message: '公設名稱為必填欄位。' }, { status: 400, headers: CORS_HEADERS });
    }

    const featuresZhJson = JSON.stringify(Array.isArray(featuresZh) ? featuresZh : []);
    const featuresEnJson = JSON.stringify(Array.isArray(featuresEn) ? featuresEn : []);

    await env.DB.prepare(`
      UPDATE facilities SET
        title_zh = ?,
        title_en = ?,
        desc_zh = ?,
        desc_en = ?,
        features_zh_json = ?,
        features_en_json = ?,
        sort_order = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      titleZh.trim(),
      titleEn.trim(),
      descZh.trim(),
      descEn.trim(),
      featuresZhJson,
      featuresEnJson,
      Number(sortOrder) || 1,
      isActive ? 1 : 0,
      id
    ).run();

    return Response.json({
      success: true,
      message: `公共設施「${titleZh}」規格已更新成功！`
    }, { headers: CORS_HEADERS });

  } catch (err) {
    console.error('[Admin Facilities API] PATCH 錯誤:', err);
    return Response.json({ success: false, message: '更新公設失敗，請稍後再試。' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;

  try {
    if (!env || !env.DB) {
      return Response.json({ success: false, message: '資料庫未連線' }, { status: 500, headers: CORS_HEADERS });
    }

    await ensureFacilitiesTable(env.DB);

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return Response.json({ success: false, message: '未指定要刪除的公設代碼。' }, { status: 400, headers: CORS_HEADERS });
    }

    // 檢查關聯照片
    const photoCount = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM media_assets 
      WHERE category = 'facility' AND sub_category = ?
    `).bind(id).first();

    if (photoCount && photoCount.count > 0) {
      return Response.json({
        success: false,
        message: `此設施底下尚有 ${photoCount.count} 張實景照片，請先刪除或移轉照片後再行刪除空間分類。`
      }, { status: 400, headers: CORS_HEADERS });
    }

    await env.DB.prepare('DELETE FROM facilities WHERE id = ?').bind(id).run();

    return Response.json({
      success: true,
      message: `公共設施空間 (${id}) 已成功刪除！`
    }, { headers: CORS_HEADERS });

  } catch (err) {
    console.error('[Admin Facilities API] DELETE 錯誤:', err);
    return Response.json({ success: false, message: '刪除公設失敗，請稍後再試。' }, { status: 500, headers: CORS_HEADERS });
  }
}
