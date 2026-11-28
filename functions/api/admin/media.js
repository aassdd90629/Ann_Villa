/**
 * functions/api/admin/media.js
 * 
 * 山語 Villa 後台媒體資產與圖片庫管理 API
 * 支援功能：
 * 1. 查詢全站分類媒體清單 (首頁 Hero 輪播 11 張、特色客房、公設寫真)
 * 2. 拖曳批次調整輪播順序 (reorder)
 * 3. 一鍵切換前台「啟用顯示 / 隱藏暫停」
 * 4. 編輯圖片標題、標籤與文字
 * 5. 永久刪除圖片資產 (同步刪除 R2 物件)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8'
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * 確保 media_assets 表結構與預設種子存在 (自我修復)
 */
async function ensureMediaAssetsTable(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS media_assets (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        sub_category TEXT,
        title_zh TEXT NOT NULL,
        title_en TEXT,
        tag_zh TEXT,
        tag_en TEXT,
        r2_key TEXT,
        cdn_url TEXT NOT NULL,
        thumbnail_url TEXT,
        file_size INTEGER DEFAULT 0,
        width INTEGER DEFAULT 1920,
        height INTEGER DEFAULT 1080,
        sort_order INTEGER DEFAULT 1,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_media_assets_cat ON media_assets(category, is_active, sort_order ASC)`).run();

    // 檢查是否有初始種子 (若不足 50 筆則自動補全客房與公設全量圖集)
    const countRes = await db.prepare('SELECT COUNT(*) as cnt FROM media_assets').first();
    if (!countRes || countRes.cnt < 50) {
      await db.prepare(`
        INSERT OR IGNORE INTO media_assets (id, category, sub_category, title_zh, title_en, tag_zh, tag_en, cdn_url, sort_order, is_active) VALUES
          ('hero-slide-1', 'hero', 'banner', '星夜璀璨・豪宅山莊', 'Luminous Nightscape Estate', '莊園夜色', 'Villa Nightscape', '/img/homebanner/homebanner-01.webp', 1, 1),
          ('hero-slide-2', 'hero', 'banner', '露台晨曦・漫步雲海仙境', 'Panoramic Viewing Deck & Morning Mist', '觀景露台雲海', 'Viewing Deck Vista', '/img/homebanner/homebanner-02.webp', 2, 1),
          ('hero-slide-3', 'hero', 'banner', '群山環繞・自然田園風光', 'Scenic Mountain Countryside', '自然景致', 'Nature & Orchard', '/img/homebanner/homebanner-03.webp', 3, 1),
          ('hero-slide-4', 'hero', 'banner', '山嵐漫漫・壯闊縹緲雲海', 'Sea of Clouds & Mountain Mist', '壯闊雲海', 'Sea of Clouds', '/img/homebanner/homebanner-04.webp', 4, 1),
          ('hero-slide-5', 'hero', 'banner', '開闊綠意・專屬青翠草坪', 'Expansive Private Green Lawn', '戶外休閒草坪', 'Private Lawn', '/img/homebanner/homebanner-05.webp', 5, 1),
          ('hero-slide-6', 'hero', 'banner', '晚霞如畫・落日彩霞暮色', 'Twilight Glow & Crimson Sunset', '落日彩霞', 'Sunset Twilight', '/img/homebanner/homebanner-06.webp', 6, 1),
          ('hero-slide-7', 'hero', 'banner', '夜色微光・漫步翠綠草坡', 'Illuminated Gardens & Hillside Lawn', '夜間草坪步道', 'Night Garden Lawn', '/img/homebanner/homebanner-07.webp', 7, 1),
          ('hero-slide-8', 'hero', 'banner', '隱逸山居・享受慢活時光', 'Mountain Sanctuary & Slow Living', '山莊全景', 'Estate Vista', '/img/homebanner/homebanner-08.webp', 8, 1),
          ('hero-slide-9', 'hero', 'banner', '晨曦微露・遠眺層疊山嵐', 'Dawning Light & Layered Peaks', '晨曦山嶺', 'Morning Peaks', '/img/homebanner/homebanner-09.webp', 9, 1),
          ('hero-slide-10', 'hero', 'banner', '雲霧繚繞・私享山林幽靜', 'Drifting Clouds & Woodland Solitude', '清幽山嵐', 'Misty Woodland', '/img/homebanner/homebanner-10.webp', 10, 1),
          ('hero-slide-11', 'hero', 'banner', '露台星空・共度溫馨之夜', 'Starry Terrace & Cherished Moments', '星空露台聚會', 'Starry Terrace', '/img/homebanner/homebanner-11.webp', 11, 1),
          ('room-01-cover', 'room', 'room-1', '1F 綠意四人景觀套房 (封面主圖)', '1F Garden View Quad Suite Cover', '1F 四人房', '1F Quad', '/img/room-1/room-1-01.webp', 1, 1),
          ('room-01-photo-02', 'room', 'room-1', '1F 綠意四人套房 - 晨光大面窗景', '1F Garden View Quad Suite - Window Vista', '1F 四人房', '1F Quad', '/img/room-1/room-1-02.webp', 2, 1),
          ('room-01-photo-03', 'room', 'room-1', '1F 綠意四人套房 - 雙大床舒眠空間', '1F Garden View Quad Suite - Double Beds', '1F 四人房', '1F Quad', '/img/room-1/room-1-03.webp', 3, 1),
          ('room-01-photo-04', 'room', 'room-1', '1F 綠意四人套房 - 乾濕分離獨立衛浴', '1F Garden View Quad Suite - Ensuite Bath', '1F 四人房', '1F Quad', '/img/room-1/room-1-04.webp', 4, 1),
          ('room-01-photo-05', 'room', 'room-1', '1F 綠意四人套房 - 溫潤木質調休閒角', '1F Garden View Quad Suite - Lounge Corner', '1F 四人房', '1F Quad', '/img/room-1/room-1-05.webp', 5, 1),
          ('room-02-cover', 'room', 'room-2', '1F 山語隱逸雙人套房 (封面主圖)', '1F Serenity Double Suite Cover', '1F 雙人房', '1F Double', '/img/room-2/room-2-01.webp', 1, 1),
          ('room-02-photo-02', 'room', 'room-2', '1F 山語隱逸雙人套房 - 加大 Queen 舒眠名床', '1F Serenity Double Suite - Queen Bed', '1F 雙人房', '1F Double', '/img/room-2/room-2-02.webp', 2, 1),
          ('room-02-photo-03', 'room', 'room-2', '1F 山語隱逸雙人套房 - 私密沙發休憩茶几', '1F Serenity Double Suite - Sofa Lounge', '1F 雙人房', '1F Double', '/img/room-2/room-2-03.webp', 3, 1),
          ('room-02-photo-04', 'room', 'room-2', '1F 山語隱逸雙人套房 - 乾濕分離衛浴空間', '1F Serenity Double Suite - Ensuite Bath', '1F 雙人房', '1F Double', '/img/room-2/room-2-04.webp', 4, 1),
          ('room-02-photo-05', 'room', 'room-2', '1F 山語隱逸雙人套房 - 質樸石木肌理光影', '1F Serenity Double Suite - Natural Textures', '1F 雙人房', '1F Double', '/img/room-2/room-2-05.webp', 5, 1),
          ('room-03-cover', 'room', 'room-3', '1F 風荷清幽四人套房 (封面主圖)', '1F Lotus Breeze Quad Suite Cover', '1F 四人房', '1F Quad', '/img/room-3/room-3-01.webp', 1, 1),
          ('room-03-photo-02', 'room', 'room-3', '1F 風荷清幽四人套房 - 兩張舒適雙人床', '1F Lotus Breeze Quad Suite - 2 Double Beds', '1F 四人房', '1F Quad', '/img/room-3/room-3-02.webp', 2, 1),
          ('room-03-photo-03', 'room', 'room-3', '1F 風荷清幽四人套房 - 開闊採光與原木家具', '1F Lotus Breeze Quad Suite - Natural Timber', '1F 四人房', '1F Quad', '/img/room-3/room-3-03.webp', 3, 1),
          ('room-03-photo-04', 'room', 'room-3', '1F 風荷清幽四人套房 - 獨立衛浴與精緻備品', '1F Lotus Breeze Quad Suite - Bathroom', '1F 四人房', '1F Quad', '/img/room-3/room-3-04.webp', 4, 1),
          ('room-04-cover', 'room', 'room-4', '2F 星空露台四人套房 (封面主圖)', '2F Starlight Terrace Quad Suite Cover', '2F 四人房', '2F Quad', '/img/room-4/room-4-01.webp', 1, 1),
          ('room-04-photo-02', 'room', 'room-4', '2F 星空露台四人套房 - 雙床配置與全景採光', '2F Starlight Terrace Quad Suite - Panoramic Light', '2F 四人房', '2F Quad', '/img/room-4/room-4-02.webp', 2, 1),
          ('room-04-photo-03', 'room', 'room-4', '2F 星空露台四人套房 - 專屬獨立觀星露台', '2F Starlight Terrace Quad Suite - Private Terrace', '2F 四人房', '2F Quad', '/img/room-4/room-4-03.webp', 3, 1),
          ('room-04-photo-04', 'room', 'room-4', '2F 星空露台四人套房 - 乾濕分離景觀衛浴', '2F Starlight Terrace Quad Suite - View Bathroom', '2F 四人房', '2F Quad', '/img/room-4/room-4-04.webp', 4, 1),
          ('room-05-cover', 'room', 'room-5', '2F 晨曦觀景四人套房 (封面主圖)', '2F Dawn Mountain View Quad Suite Cover', '2F 四人房', '2F Quad', '/img/room-5/room-5-01.webp', 1, 1),
          ('room-05-photo-02', 'room', 'room-5', '2F 晨曦觀景四人套房 - 晨曦山巒遼闊全景', '2F Dawn Mountain View Quad Suite - Mountain Vista', '2F 四人房', '2F Quad', '/img/room-5/room-5-02.webp', 2, 1),
          ('room-05-photo-03', 'room', 'room-5', '2F 晨曦觀景四人套房 - 舒適雙人床休憩空間', '2F Dawn Mountain View Quad Suite - Double Beds', '2F 四人房', '2F Quad', '/img/room-5/room-5-03.webp', 3, 1),
          ('room-05-photo-04', 'room', 'room-5', '2F 晨曦觀景四人套房 - 質感衛浴與沐浴備品', '2F Dawn Mountain View Quad Suite - Bathroom', '2F 四人房', '2F Quad', '/img/room-5/room-5-04.webp', 4, 1),
          ('fac-ktv-01', 'facility', 'living-ktv', 'Grand Lounge 奢華客廳與 KTV 劇院 (主景)', 'Grand Lounge & KTV Entertainment', '客廳KTV', 'KTV Lounge', '/img/living-ktv/living-ktv-01.webp', 1, 1),
          ('fac-ktv-02', 'facility', 'living-ktv', '頂級劇院音響與歡唱沙發座席', 'Premium Sound System & Lounge Sofas', '客廳KTV', 'KTV Lounge', '/img/living-ktv/living-ktv-02.webp', 2, 1),
          ('fac-ktv-03', 'facility', 'living-ktv', '巨幕投影劇院與奢華暖調氛圍', 'Large Screen Theater & Warm Ambience', '客廳KTV', 'KTV Lounge', '/img/living-ktv/living-ktv-03.webp', 3, 1),
          ('fac-ktv-04', 'facility', 'living-ktv', '多功能聚會空間與休憩座席', 'Multifunctional Gathering Lounge', '客廳KTV', 'KTV Lounge', '/img/living-ktv/living-ktv-04.webp', 4, 1),
          ('fac-ktv-05', 'facility', 'living-ktv', '夜間莊園溫馨聚會暖光造景', 'Warm Night Illumination & Gathering', '客廳KTV', 'KTV Lounge', '/img/living-ktv/living-ktv-05.webp', 5, 1),
          ('fac-mahjong-01', 'facility', 'mahjong', '頂級電動過山車麻將娛樂室 (主景)', 'Automatic Mahjong Table Experience', '電動麻將', 'Mahjong', '/img/living-ktv/living-ktv-04.webp', 1, 1),
          ('fac-mahjong-02', 'facility', 'mahjong', '麻將娛樂區舒適軟質沙發椅', 'Comfortable Mahjong Seating Area', '電動麻將', 'Mahjong', '/img/living-ktv/living-ktv-02.webp', 2, 1),
          ('fac-mahjong-03', 'facility', 'mahjong', '休閒通宵棋牌娛樂配備', 'All-Night Board Game & Mahjong Lounge', '電動麻將', 'Mahjong', '/img/living-ktv/living-ktv-05.webp', 3, 1),
          ('fac-kitchen-01', 'facility', 'kitchen', '中島開放式智能廚房與吧檯 (主景)', 'Open Island Kitchen & Bar', '智能廚房', 'Kitchen', '/img/kitchen-bar/kitchen-bar-06.webp', 1, 1),
          ('fac-kitchen-02', 'facility', 'kitchen', '私廚饗宴高腳調酒吧檯', 'Chef Dining & High Bar Stools', '智能廚房', 'Kitchen', '/img/kitchen-bar/kitchen-bar-01.webp', 2, 1),
          ('fac-kitchen-03', 'facility', 'kitchen', '齊全進口智能廚具與烹飪家電', 'Imported Smart Cookware & Appliances', '智能廚房', 'Kitchen', '/img/kitchen-bar/kitchen-bar-02.webp', 3, 1),
          ('fac-kitchen-04', 'facility', 'kitchen', '氣派聚餐長桌與溫馨用餐區', 'Banquet Dining Table & Family Seating', '智能廚房', 'Kitchen', '/img/kitchen-bar/kitchen-bar-03.webp', 4, 1),
          ('fac-kitchen-05', 'facility', 'kitchen', '專業義式咖啡機與飲品調配區', 'Espresso Machine & Beverage Bar', '智能廚房', 'Kitchen', '/img/kitchen-bar/kitchen-bar-04.webp', 5, 1),
          ('fac-kitchen-06', 'facility', 'kitchen', '寬敞備料中島與收納動線', 'Spacious Food Prep Island & Layout', '智能廚房', 'Kitchen', '/img/kitchen-bar/kitchen-bar-05.webp', 6, 1),
          ('fac-bbq-01', 'facility', 'bbq', '戶外庭院專業美式 BBQ 烤肉區 (主景)', 'Outdoor Courtyard Premium BBQ', '美式烤肉', 'BBQ Courtyard', '/img/outdoor-bbq-tea/outdoor-bbq-tea-09.webp', 1, 1),
          ('fac-bbq-02', 'facility', 'bbq', '星空庭院戶外烤肉長桌餐席', 'Starry Courtyard Outdoor Dining Table', '美式烤肉', 'BBQ Courtyard', '/img/outdoor-bbq-tea/outdoor-bbq-tea-10.webp', 2, 1),
          ('fac-bbq-03', 'facility', 'bbq', '夜間戶外青翠草坪露天聚會', 'Evening Hillside Lawn Gathering', '美式烤肉', 'BBQ Courtyard', '/img/outdoor-bbq-tea/outdoor-bbq-tea-08.webp', 3, 1),
          ('fac-bbq-04', 'facility', 'bbq', '戶外木棧平台休閒景觀座席', 'Timber Deck Outdoor Lounge Patio', '美式烤肉', 'BBQ Courtyard', '/img/outdoor-bbq-tea/outdoor-bbq-tea-11.webp', 4, 1),
          ('fac-tea-01', 'facility', 'tea', '高山山景品茗賞景茶席 (主景)', 'Scenic Mountain Tea Ceremony Pavilion', '品茗茶席', 'Tea Pavilion', '/img/outdoor-bbq-tea/outdoor-bbq-tea-03.webp', 1, 1),
          ('fac-tea-02', 'facility', 'tea', '半戶外茶座遠眺層疊山嵐仙境', 'Covered Viewing Tea Lounge & Peaks', '品茗茶席', 'Tea Pavilion', '/img/outdoor-bbq-tea/outdoor-bbq-tea-04.webp', 2, 1),
          ('fac-tea-03', 'facility', 'tea', '天然原木大茶桌與功夫茶具', 'Natural Timber Tea Table & Kung Fu Set', '品茗茶席', 'Tea Pavilion', '/img/outdoor-bbq-tea/outdoor-bbq-tea-06.webp', 3, 1),
          ('fac-tea-04', 'facility', 'tea', '翠綠林間微風伴隨品茗時刻', 'Breezy Mountain Forest Tea Sanctuary', '品茗茶席', 'Tea Pavilion', '/img/outdoor-bbq-tea/outdoor-bbq-tea-02.webp', 4, 1)
      `).run();
    }

    // 自動自我修復舊版公設無效圖片路徑
    await db.prepare(`
      UPDATE media_assets 
      SET cdn_url = '/img/living-ktv/living-ktv-04.webp', thumbnail_url = '/img/living-ktv/living-ktv-04.webp', updated_at = CURRENT_TIMESTAMP 
      WHERE id = 'fac-mahjong-01' AND cdn_url LIKE '%/img/mahjong/%'
    `).run();
    await db.prepare(`
      UPDATE media_assets 
      SET cdn_url = '/img/kitchen-bar/kitchen-bar-06.webp', thumbnail_url = '/img/kitchen-bar/kitchen-bar-06.webp', updated_at = CURRENT_TIMESTAMP 
      WHERE id = 'fac-kitchen-01' AND cdn_url LIKE '%/img/kitchen/%'
    `).run();
    await db.prepare(`
      UPDATE media_assets 
      SET cdn_url = '/img/outdoor-bbq-tea/outdoor-bbq-tea-09.webp', thumbnail_url = '/img/outdoor-bbq-tea/outdoor-bbq-tea-09.webp', updated_at = CURRENT_TIMESTAMP 
      WHERE id = 'fac-bbq-01' AND cdn_url LIKE '%/img/bbq/%'
    `).run();
    await db.prepare(`
      UPDATE media_assets 
      SET cdn_url = '/img/outdoor-bbq-tea/outdoor-bbq-tea-03.webp', thumbnail_url = '/img/outdoor-bbq-tea/outdoor-bbq-tea-03.webp', updated_at = CURRENT_TIMESTAMP 
      WHERE id = 'fac-tea-01' AND cdn_url LIKE '%/img/tea/%'
    `).run();
  } catch (err) {
    console.warn('[AdminMedia] ensureMediaAssetsTable warning:', err.message);
  }
}

function getOperatorTag(adminUser) {
  if (!adminUser) return 'admin';
  return `${adminUser.displayName || adminUser.username} (${adminUser.username || 'admin'})`;
}

/**
 * GET /api/admin/media
 * 取得全站媒體資料庫清單
 */
export async function onRequestGet(context) {
  const { env } = context;

  if (!env.DB) {
    return Response.json({ success: false, message: 'DB not bound' }, { status: 500, headers: CORS_HEADERS });
  }

  try {
    await ensureMediaAssetsTable(env.DB);

    const { results } = await env.DB.prepare(`
      SELECT id, category, sub_category, title_zh, title_en, tag_zh, tag_en, r2_key, cdn_url, thumbnail_url, file_size, width, height, sort_order, is_active, created_at, updated_at
      FROM media_assets
      ORDER BY category ASC, sort_order ASC, created_at ASC
    `).all();

    const hero = [];
    const room = [];
    const facility = [];

    for (const r of (results || [])) {
      const item = {
        id: r.id,
        category: r.category,
        subCategory: r.sub_category,
        titleZh: r.title_zh,
        titleEn: r.title_en || '',
        tagZh: r.tag_zh || '',
        tagEn: r.tag_en || '',
        r2Key: r.r2_key,
        cdnUrl: r.cdn_url,
        thumbnailUrl: r.thumbnail_url || r.cdn_url,
        fileSize: r.file_size,
        width: r.width,
        height: r.height,
        sortOrder: r.sort_order,
        isActive: Boolean(r.is_active),
        createdAt: r.created_at,
        updatedAt: r.updated_at
      };

      if (r.category === 'hero') hero.push(item);
      else if (r.category === 'room') room.push(item);
      else if (r.category === 'facility') facility.push(item);
    }

    const hasR2 = Boolean(env.MEDIA_BUCKET || env.R2_BUCKET);

    return Response.json({
      success: true,
      hasR2,
      counts: {
        hero: hero.length,
        room: room.length,
        facility: facility.length,
        total: (results || []).length
      },
      hero,
      room,
      facility
    }, { headers: CORS_HEADERS });

  } catch (err) {
    return Response.json(
      { success: false, message: '讀取媒體清單失敗: ' + err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * PATCH /api/admin/media
 * 批次排序、切換啟用/隱藏、或更新圖資文字
 */
export async function onRequestPatch(context) {
  const { request, env, data } = context;
  const currentAdmin = data.adminUser;

  if (!env.DB) {
    return Response.json({ success: false, message: 'DB not bound' }, { status: 500, headers: CORS_HEADERS });
  }

  try {
    await ensureMediaAssetsTable(env.DB);
    const body = await request.json();
    const { action, items, id, isActive, titleZh, titleEn, tagZh, tagEn, sortOrder } = body;
    const operator = getOperatorTag(currentAdmin);

    // 1. 拖曳批次調整順序 (reorder)
    if (action === 'reorder' && Array.isArray(items)) {
      for (const it of items) {
        if (it.id && typeof it.sortOrder === 'number') {
          await env.DB.prepare('UPDATE media_assets SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .bind(it.sortOrder, it.id).run();
        }
      }

      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('media', 'REORDER_MEDIA', 'batch', ?, ?, ?)
      `).bind(
        `調整圖片輪播與排列先後順序（共更新 ${items.length} 張圖片）`,
        JSON.stringify({ count: items.length }),
        operator
      ).run();

      return Response.json({ success: true, message: '圖片順序已成功更新！' }, { headers: CORS_HEADERS });
    }

    // 2. 切換單張圖片顯示 / 隱藏狀態
    if (action === 'toggle_active' && id) {
      const target = await env.DB.prepare('SELECT id, title_zh, is_active FROM media_assets WHERE id = ?').bind(id).first();
      if (!target) {
        return Response.json({ success: false, message: '找不到該張圖片。' }, { status: 404, headers: CORS_HEADERS });
      }

      const nextActive = isActive ? 1 : 0;
      await env.DB.prepare('UPDATE media_assets SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(nextActive, id).run();

      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('media', 'TOGGLE_MEDIA_STATUS', ?, ?, ?, ?)
      `).bind(
        id,
        `${nextActive === 1 ? '啟用顯示' : '隱藏暫停'}圖片「${target.title_zh}」`,
        JSON.stringify({ id, isActive: Boolean(nextActive) }),
        operator
      ).run();

      return Response.json({ success: true, message: `圖片已成功${nextActive === 1 ? '啟用' : '暫停顯示'}！` }, { headers: CORS_HEADERS });
    }

    // 3. 編輯圖片資訊 (標題、標籤、權重、發佈狀態、以及更換新圖片)
    if (action === 'update' && id) {
      const target = await env.DB.prepare('SELECT * FROM media_assets WHERE id = ?').bind(id).first();
      if (!target) {
        return Response.json({ success: false, message: '找不到欲修改的圖片。' }, { status: 404, headers: CORS_HEADERS });
      }

      let cdnUrl = target.cdn_url;
      let r2Key = target.r2_key;
      let width = target.width || 1920;
      let height = target.height || 1080;
      let fileSize = target.file_size || 0;

      const { newImage } = body;
      let imageChanged = false;

      if (newImage && newImage.base64) {
        imageChanged = true;
        const bucket = env.MEDIA_BUCKET || env.R2_BUCKET;
        if (bucket) {
          try {
            const rawBase64 = newImage.base64.includes(',') ? newImage.base64.split(',')[1] : newImage.base64;
            const binaryStr = atob(rawBase64);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
              bytes[i] = binaryStr.charCodeAt(i);
            }
            const safeFilename = (newImage.filename || 'image.webp').replace(/[^a-zA-Z0-9._-]/g, '_');
            const newR2Key = `uploads/${target.category || 'media'}/${Date.now()}-${safeFilename}`;

            await bucket.put(newR2Key, bytes, {
              httpMetadata: {
                contentType: newImage.mimeType || 'image/webp',
                cacheControl: 'public, max-age=31536000, immutable'
              }
            });

            // 成功上傳新圖後，嘗試刪除舊的 R2 物件 (若存在且鍵名不同)
            if (target.r2_key && target.r2_key !== newR2Key) {
              try {
                await bucket.delete(target.r2_key);
              } catch (delErr) {
                console.warn('[AdminMedia] Failed to delete old R2 object:', delErr.message);
              }
            }

            r2Key = newR2Key;
            cdnUrl = `/api/media/${newR2Key}`;
          } catch (r2Err) {
            console.warn('[AdminMedia R2 Update Warning]:', r2Err.message);
            cdnUrl = newImage.base64;
          }
        } else {
          cdnUrl = newImage.base64;
        }

        if (newImage.width) width = Number(newImage.width) || width;
        if (newImage.height) height = Number(newImage.height) || height;
        if (newImage.fileSize) fileSize = Number(newImage.fileSize) || fileSize;
      }

      const nextActive = (isActive !== undefined) ? (isActive ? 1 : 0) : target.is_active;

      await env.DB.prepare(`
        UPDATE media_assets
        SET title_zh = ?, title_en = ?, tag_zh = ?, tag_en = ?, sort_order = ?,
            cdn_url = ?, thumbnail_url = ?, r2_key = ?, width = ?, height = ?, file_size = ?,
            is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        titleZh ? titleZh.trim() : target.title_zh,
        titleEn !== undefined ? titleEn.trim() : (target.title_en || ''),
        tagZh !== undefined ? tagZh.trim() : (target.tag_zh || ''),
        tagEn !== undefined ? tagEn.trim() : (target.tag_en || ''),
        Number(sortOrder) || target.sort_order || 1,
        cdnUrl,
        cdnUrl,
        r2Key,
        width,
        height,
        fileSize,
        nextActive,
        id
      ).run();

      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('media', 'UPDATE_MEDIA_INFO', ?, ?, ?, ?)
      `).bind(
        id,
        `更新圖片資訊：「${titleZh || target.title_zh}」${imageChanged ? '（已更換圖片）' : ''}（狀態：${nextActive ? '上架' : '草稿'}）`,
        JSON.stringify({ titleZh, titleEn, tagZh, tagEn, sortOrder, imageChanged, isActive: Boolean(nextActive) }),
        operator
      ).run();

      return Response.json({
        success: true,
        message: imageChanged ? '圖片與資訊已成功更換並儲存！' : '圖片資訊已成功更新！',
        asset: {
          id,
          titleZh: titleZh ? titleZh.trim() : target.title_zh,
          cdnUrl,
          isActive: Boolean(nextActive)
        }
      }, { headers: CORS_HEADERS });
    }

    return Response.json({ success: false, message: '無效的操作指令。' }, { status: 400, headers: CORS_HEADERS });

  } catch (err) {
    return Response.json({ success: false, message: '更新失敗: ' + err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

/**
 * DELETE /api/admin/media
 * 永久刪除圖片資產 (若存在 R2 物件同步清除)
 */
export async function onRequestDelete(context) {
  const { request, env, data } = context;
  const currentAdmin = data.adminUser;

  if (!env.DB) {
    return Response.json({ success: false, message: 'DB not bound' }, { status: 500, headers: CORS_HEADERS });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return Response.json({ success: false, message: '缺少目標圖片 ID。' }, { status: 400, headers: CORS_HEADERS });
    }

    const target = await env.DB.prepare('SELECT id, title_zh, category, r2_key FROM media_assets WHERE id = ?').bind(id).first();
    if (!target) {
      return Response.json({ success: false, message: '找不到該筆圖片資料。' }, { status: 404, headers: CORS_HEADERS });
    }

    // 若有 R2 物件且有綁定 R2，同步從 R2 儲存空間刪除實體檔案
    const bucket = env.MEDIA_BUCKET || env.R2_BUCKET;
    if (bucket && target.r2_key) {
      try {
        await bucket.delete(target.r2_key);
      } catch (r2Err) {
        console.warn('[R2 Delete] warning:', r2Err.message);
      }
    }

    await env.DB.prepare('DELETE FROM media_assets WHERE id = ?').bind(id).run();

    const operator = getOperatorTag(currentAdmin);
    await env.DB.prepare(`
      INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
      VALUES ('media', 'DELETE_MEDIA', ?, ?, ?, ?)
    `).bind(
      id,
      `刪除圖片資產：「${target.title_zh}」(${target.category})`,
      JSON.stringify(target),
      operator
    ).run();

    return Response.json({ success: true, message: `已成功刪除圖片「${target.title_zh}」！` }, { headers: CORS_HEADERS });

  } catch (err) {
    return Response.json({ success: false, message: '刪除圖片失敗: ' + err.message }, { status: 500, headers: CORS_HEADERS });
  }
}
