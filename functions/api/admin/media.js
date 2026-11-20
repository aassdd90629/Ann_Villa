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

    // 檢查是否有初始種子
    const countRes = await db.prepare('SELECT COUNT(*) as cnt FROM media_assets').first();
    if (!countRes || countRes.cnt === 0) {
      await db.prepare(`
        INSERT INTO media_assets (id, category, sub_category, title_zh, title_en, tag_zh, tag_en, cdn_url, sort_order, is_active) VALUES
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
          ('room-02-cover', 'room', 'room-2', '1F 山語隱逸雙人套房 (封面主圖)', '1F Serenity Double Suite Cover', '1F 雙人房', '1F Double', '/img/room-2/room-2-01.webp', 2, 1),
          ('room-03-cover', 'room', 'room-3', '1F 風荷清幽四人套房 (封面主圖)', '1F Lotus Breeze Quad Suite Cover', '1F 四人房', '1F Quad', '/img/room-3/room-3-01.webp', 3, 1),
          ('room-04-cover', 'room', 'room-4', '2F 星空露台四人套房 (封面主圖)', '2F Starlight Terrace Quad Suite Cover', '2F 四人房', '2F Quad', '/img/room-4/room-4-01.webp', 4, 1),
          ('room-05-cover', 'room', 'room-5', '2F 晨曦觀景四人套房 (封面主圖)', '2F Dawn Mountain View Quad Suite Cover', '2F 四人房', '2F Quad', '/img/room-5/room-5-01.webp', 5, 1),
          ('fac-ktv-01', 'facility', 'living-ktv', 'Grand Lounge 奢華客廳與 KTV 劇院', 'Grand Lounge & KTV Entertainment', '客廳KTV', 'KTV Lounge', '/img/living-ktv/living-ktv-01.webp', 1, 1),
          ('fac-mahjong-01', 'facility', 'mahjong', '頂級電動過山車麻將娛樂室', 'Automatic Mahjong Table Experience', '電動麻將', 'Mahjong', '/img/mahjong/mahjong-01.webp', 2, 1),
          ('fac-kitchen-01', 'facility', 'kitchen', '中島開放式智能廚房與吧檯', 'Open Island Kitchen & Bar', '智能廚房', 'Kitchen', '/img/kitchen/kitchen-01.webp', 3, 1),
          ('fac-bbq-01', 'facility', 'bbq', '戶外庭院專業美式 BBQ 烤肉區', 'Outdoor Courtyard Premium BBQ', '美式烤肉', 'BBQ Courtyard', '/img/bbq/bbq-01.webp', 4, 1),
          ('fac-tea-01', 'facility', 'tea', '高山山景品茗賞景茶席', 'Scenic Mountain Tea Ceremony Pavilion', '品茗茶席', 'Tea Pavilion', '/img/tea/tea-01.webp', 5, 1)
      `).run();
    }
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

    // 3. 編輯圖片資訊 (標題、標籤、權重)
    if (action === 'update' && id) {
      const target = await env.DB.prepare('SELECT id, title_zh FROM media_assets WHERE id = ?').bind(id).first();
      if (!target) {
        return Response.json({ success: false, message: '找不到欲修改的圖片。' }, { status: 404, headers: CORS_HEADERS });
      }

      await env.DB.prepare(`
        UPDATE media_assets
        SET title_zh = ?, title_en = ?, tag_zh = ?, tag_en = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        titleZh ? titleZh.trim() : target.title_zh,
        titleEn ? titleEn.trim() : '',
        tagZh ? tagZh.trim() : '',
        tagEn ? tagEn.trim() : '',
        Number(sortOrder) || 1,
        id
      ).run();

      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('media', 'UPDATE_MEDIA_INFO', ?, ?, ?, ?)
      `).bind(
        id,
        `更新圖片資訊：「${titleZh || target.title_zh}」`,
        JSON.stringify({ titleZh, titleEn, tagZh, tagEn, sortOrder }),
        operator
      ).run();

      return Response.json({ success: true, message: '圖片資訊已成功更新！' }, { headers: CORS_HEADERS });
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
