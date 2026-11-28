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
      return Response.json({ success: false, message: '資料庫未綁定' }, { status: 500, headers: CORS_HEADERS });
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
      rooms: roomsList
    }, { headers: CORS_HEADERS });

  } catch (err) {
    console.error('[Admin Rooms API] GET 錯誤:', err);
    return Response.json({
      success: false,
      rooms: [],
      error: '載入客房資料失敗'
    }, { status: 500, headers: CORS_HEADERS });
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
