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
      return Response.json({ success: false, message: '資料庫未綁定' }, { status: 500, headers: CORS_HEADERS });
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
      facilities: facilitiesList
    }, { headers: CORS_HEADERS });

  } catch (err) {
    console.error('[Admin Facilities API] GET 錯誤:', err);
    return Response.json({
      success: false,
      facilities: [],
      error: '載入公設資料失敗'
    }, { status: 500, headers: CORS_HEADERS });
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
