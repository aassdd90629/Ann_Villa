/**
 * functions/api/admin/guide.js
 * 
 * 山語 Villa 周邊景點與膠囊分類後台管理 API
 * 支援管家自主管理：
 * 1. 膠囊分類 (guide_categories) 的新增、編輯、啟用/停用、刪除與排序
 * 2. 景點/美食推薦項目 (guide_items) 的新增、編輯、上架/下架、刪除與分類歸屬
 * 
 * 遵守規範：
 * - 參數化綁定 env.DB.prepare(...).bind(...)
 * - 異動操作寫入 admin_audit_logs 留痕
 * - 錯誤防禦處理（嚴禁向前端洩漏底層內部例外）
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

function getOperatorTag(adminUser) {
  if (!adminUser) return 'admin';
  return `${adminUser.displayName || adminUser.username} (${adminUser.username || 'admin'})`;
}

async function ensureGuideTables(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS guide_categories (
        id TEXT PRIMARY KEY,
        name_zh TEXT NOT NULL,
        name_en TEXT,
        icon TEXT DEFAULT 'Compass',
        tag_zh TEXT,
        tag_en TEXT,
        sort_order INTEGER DEFAULT 1,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_guide_categories_sort ON guide_categories(is_active, sort_order ASC)`).run();

    const countRes = await db.prepare('SELECT COUNT(*) as cnt FROM guide_categories').first();
    if (!countRes || countRes.cnt === 0) {
      await db.prepare(`
        INSERT OR IGNORE INTO guide_categories (id, name_zh, name_en, icon, tag_zh, tag_en, sort_order, is_active) VALUES
          ('attraction', '周邊景點', 'Attractions', 'Compass', '私房景點推薦', 'Curated Scenic Spots', 1, 1),
          ('dining', '在地美食', 'Local Dining', 'UtensilsCrossed', '私房美食品嚐', 'Authentic Local Dining', 2, 1)
      `).run();
    }
  } catch (e) {
    console.warn('[AdminGuide] ensureGuideTables warning:', e.message);
  }
}

/**
 * GET /api/admin/guide
 * 讀取所有膠囊分類與所有景點項目
 */
export async function onRequestGet(context) {
  const { env } = context;

  if (!env || !env.DB) {
    return Response.json({ success: false, message: '資料庫尚未綁定。' }, { status: 500, headers: CORS_HEADERS });
  }

  try {
    await ensureGuideTables(env.DB);

    // 1. 取得分類列表
    const { results: categories } = await env.DB.prepare(`
      SELECT 
        id, 
        name_zh as nameZh, 
        name_en as nameEn, 
        icon, 
        tag_zh as tagZh, 
        tag_en as tagEn, 
        sort_order as sortOrder, 
        is_active as isActive,
        updated_at as updatedAt
      FROM guide_categories
      ORDER BY sort_order ASC, created_at ASC
    `).all();

    // 2. 取得所有景點/在地項目
    const { results: items } = await env.DB.prepare(`
      SELECT 
        id, 
        type, 
        name_zh as nameZh, 
        name_en as nameEn, 
        location_zh as locationZh, 
        location_en as locationEn, 
        tag_zh as tagZh, 
        tag_en as tagEn, 
        desc_zh as descZh, 
        desc_en as descEn, 
        notice_zh as noticeZh, 
        notice_en as noticeEn, 
        image, 
        parking, 
        sort_order as sortOrder, 
        is_active as isActive,
        updated_at as updatedAt
      FROM guide_items
      WHERE type != 'transportation'
      ORDER BY sort_order ASC, created_at DESC
    `).all();

    const formattedCategories = (categories || []).map(cat => ({
      ...cat,
      isActive: Boolean(cat.isActive),
      count: (items || []).filter(it => it.type === cat.id).length
    }));

    const formattedItems = (items || []).map(it => ({
      ...it,
      parking: Boolean(it.parking),
      isActive: Boolean(it.isActive)
    }));

    return Response.json({
      success: true,
      categories: formattedCategories,
      items: formattedItems
    }, { headers: CORS_HEADERS });

  } catch (err) {
    console.error('[AdminGuide GET] 讀取導覽資料失敗:', err);
    return Response.json({ success: false, message: '讀取周邊導覽資料失敗，請稍後再試。' }, { status: 500, headers: CORS_HEADERS });
  }
}

/**
 * POST /api/admin/guide
 * 新增膠囊分類 或 新增景點項目
 */
export async function onRequestPost(context) {
  const { request, env, data } = context;
  const currentAdmin = data.adminUser;

  if (!env || !env.DB) {
    return Response.json({ success: false, message: '資料庫尚未綁定。' }, { status: 500, headers: CORS_HEADERS });
  }

  try {
    await ensureGuideTables(env.DB);
    const body = await request.json();
    const { action, category, item } = body;
    const operator = getOperatorTag(currentAdmin);

    // 1. 新增膠囊分類
    if (action === 'create_category' && category) {
      if (!category.nameZh || !category.nameZh.trim()) {
        return Response.json({ success: false, message: '請填寫分類名稱 (繁中)。' }, { status: 400, headers: CORS_HEADERS });
      }

      // 若未提供 id 則自動以 slug 或時間戳生成
      let catId = (category.id || '').trim().toLowerCase();
      if (!catId) {
        catId = 'cat-' + Date.now();
      }

      // 檢查 ID 是否已存在
      const exist = await env.DB.prepare('SELECT id FROM guide_categories WHERE id = ?').bind(catId).first();
      if (exist) {
        return Response.json({ success: false, message: `分類代碼「${catId}」已存在，請使用不同代碼。` }, { status: 400, headers: CORS_HEADERS });
      }

      const sortOrder = Number(category.sortOrder) || 1;
      const isActive = category.isActive !== false ? 1 : 0;
      const icon = category.icon || 'Compass';

      await env.DB.prepare(`
        INSERT INTO guide_categories (id, name_zh, name_en, icon, tag_zh, tag_en, sort_order, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        catId,
        category.nameZh.trim(),
        category.nameEn ? category.nameEn.trim() : '',
        icon,
        category.tagZh ? category.tagZh.trim() : '',
        category.tagEn ? category.tagEn.trim() : '',
        sortOrder,
        isActive
      ).run();

      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('guide', 'CREATE_CATEGORY', ?, ?, ?, ?)
      `).bind(
        catId,
        `新增周邊導覽膠囊分類：「${category.nameZh.trim()}」(${catId})`,
        JSON.stringify(category),
        operator
      ).run();

      return Response.json({ success: true, message: `成功新增膠囊分類「${category.nameZh.trim()}」！`, id: catId }, { headers: CORS_HEADERS });
    }

    // 2. 新增景點或在地推薦項目
    if (action === 'create_item' && item) {
      if (!item.nameZh || !item.nameZh.trim()) {
        return Response.json({ success: false, message: '請填寫景點或美食名稱 (繁中)。' }, { status: 400, headers: CORS_HEADERS });
      }
      if (!item.type) {
        return Response.json({ success: false, message: '請選擇所屬膠囊分類。' }, { status: 400, headers: CORS_HEADERS });
      }

      const itemId = 'guide-' + Date.now();
      const sortOrder = Number(item.sortOrder) || 1;
      const isActive = item.isActive !== false ? 1 : 0;
      const parking = item.parking ? 1 : 0;

      await env.DB.prepare(`
        INSERT INTO guide_items (
          id, type, name_zh, name_en, location_zh, location_en, 
          tag_zh, tag_en, desc_zh, desc_en, notice_zh, notice_en, 
          image, parking, sort_order, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        itemId,
        item.type.trim(),
        item.nameZh.trim(),
        item.nameEn ? item.nameEn.trim() : '',
        item.locationZh ? item.locationZh.trim() : '',
        item.locationEn ? item.locationEn.trim() : '',
        item.tagZh ? item.tagZh.trim() : '',
        item.tagEn ? item.tagEn.trim() : '',
        item.descZh ? item.descZh.trim() : '',
        item.descEn ? item.descEn.trim() : '',
        item.noticeZh ? item.noticeZh.trim() : '',
        item.noticeEn ? item.noticeEn.trim() : '',
        item.image ? item.image.trim() : '',
        parking,
        sortOrder,
        isActive
      ).run();

      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('guide', 'CREATE_ITEM', ?, ?, ?, ?)
      `).bind(
        itemId,
        `新增周邊推薦項目：「${item.nameZh.trim()}」（所屬分類：${item.type}）`,
        JSON.stringify(item),
        operator
      ).run();

      return Response.json({ success: true, message: `成功新增項目「${item.nameZh.trim()}」！`, id: itemId }, { headers: CORS_HEADERS });
    }

    return Response.json({ success: false, message: '無效的操作或缺少必要參數。' }, { status: 400, headers: CORS_HEADERS });

  } catch (err) {
    console.error('[AdminGuide POST] 新增操作失敗:', err);
    return Response.json({ success: false, message: '新增失敗，請檢查資料或稍後再試。' }, { status: 500, headers: CORS_HEADERS });
  }
}

/**
 * PATCH /api/admin/guide
 * 編輯分類、編輯項目、或切換啟用/停用
 */
export async function onRequestPatch(context) {
  const { request, env, data } = context;
  const currentAdmin = data.adminUser;

  if (!env || !env.DB) {
    return Response.json({ success: false, message: '資料庫尚未綁定。' }, { status: 500, headers: CORS_HEADERS });
  }

  try {
    await ensureGuideTables(env.DB);
    const body = await request.json();
    const { action, category, item, id, isActive } = body;
    const operator = getOperatorTag(currentAdmin);

    // 1. 切換分類狀態
    if (action === 'toggle_active_category' && id) {
      const nextActive = isActive ? 1 : 0;
      await env.DB.prepare('UPDATE guide_categories SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(nextActive, id).run();
      
      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('guide', 'TOGGLE_CAT_STATUS', ?, ?, ?, ?)
      `).bind(
        id,
        `${nextActive === 1 ? '啟用' : '停用'}膠囊分類「${id}」`,
        JSON.stringify({ id, isActive: Boolean(nextActive) }),
        operator
      ).run();

      return Response.json({ success: true, message: `分類狀態已更新為${nextActive === 1 ? '啟用' : '停用'}！` }, { headers: CORS_HEADERS });
    }

    // 2. 切換項目狀態
    if (action === 'toggle_active_item' && id) {
      const nextActive = isActive ? 1 : 0;
      await env.DB.prepare('UPDATE guide_items SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(nextActive, id).run();

      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('guide', 'TOGGLE_ITEM_STATUS', ?, ?, ?, ?)
      `).bind(
        id,
        `${nextActive === 1 ? '上架' : '下架'}推薦項目「${id}」`,
        JSON.stringify({ id, isActive: Boolean(nextActive) }),
        operator
      ).run();

      return Response.json({ success: true, message: `項目狀態已更新為${nextActive === 1 ? '上架' : '下架'}！` }, { headers: CORS_HEADERS });
    }

    // 3. 編輯膠囊分類
    if (action === 'update_category' && category && category.id) {
      await env.DB.prepare(`
        UPDATE guide_categories
        SET name_zh = ?, name_en = ?, icon = ?, tag_zh = ?, tag_en = ?, sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        category.nameZh.trim(),
        category.nameEn ? category.nameEn.trim() : '',
        category.icon || 'Compass',
        category.tagZh ? category.tagZh.trim() : '',
        category.tagEn ? category.tagEn.trim() : '',
        Number(category.sortOrder) || 1,
        category.isActive ? 1 : 0,
        category.id
      ).run();

      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('guide', 'UPDATE_CATEGORY', ?, ?, ?, ?)
      `).bind(
        category.id,
        `更新膠囊分類：「${category.nameZh.trim()}」`,
        JSON.stringify(category),
        operator
      ).run();

      return Response.json({ success: true, message: '膠囊分類更新成功！' }, { headers: CORS_HEADERS });
    }

    // 4. 編輯推薦項目
    if (action === 'update_item' && item && item.id) {
      await env.DB.prepare(`
        UPDATE guide_items
        SET type = ?, name_zh = ?, name_en = ?, location_zh = ?, location_en = ?,
            tag_zh = ?, tag_en = ?, desc_zh = ?, desc_en = ?, notice_zh = ?, notice_en = ?,
            image = ?, parking = ?, sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        item.type.trim(),
        item.nameZh.trim(),
        item.nameEn ? item.nameEn.trim() : '',
        item.locationZh ? item.locationZh.trim() : '',
        item.locationEn ? item.locationEn.trim() : '',
        item.tagZh ? item.tagZh.trim() : '',
        item.tagEn ? item.tagEn.trim() : '',
        item.descZh ? item.descZh.trim() : '',
        item.descEn ? item.descEn.trim() : '',
        item.noticeZh ? item.noticeZh.trim() : '',
        item.noticeEn ? item.noticeEn.trim() : '',
        item.image ? item.image.trim() : '',
        item.parking ? 1 : 0,
        Number(item.sortOrder) || 1,
        item.isActive ? 1 : 0,
        item.id
      ).run();

      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('guide', 'UPDATE_ITEM', ?, ?, ?, ?)
      `).bind(
        item.id,
        `更新推薦項目：「${item.nameZh.trim()}」`,
        JSON.stringify(item),
        operator
      ).run();

      return Response.json({ success: true, message: '推薦項目更新成功！' }, { headers: CORS_HEADERS });
    }

    return Response.json({ success: false, message: '無效的操作指令。' }, { status: 400, headers: CORS_HEADERS });

  } catch (err) {
    console.error('[AdminGuide PATCH] 更新操作失敗:', err);
    return Response.json({ success: false, message: '更新失敗，請稍後再試。' }, { status: 500, headers: CORS_HEADERS });
  }
}

/**
 * DELETE /api/admin/guide
 * 刪除分類 或 刪除景點項目
 */
export async function onRequestDelete(context) {
  const { request, env, data } = context;
  const currentAdmin = data.adminUser;

  if (!env || !env.DB) {
    return Response.json({ success: false, message: '資料庫尚未綁定。' }, { status: 500, headers: CORS_HEADERS });
  }

  try {
    const url = new URL(request.url);
    const target = url.searchParams.get('target'); // 'category' or 'item'
    const id = url.searchParams.get('id');
    const operator = getOperatorTag(currentAdmin);

    if (!id) {
      return Response.json({ success: false, message: '缺少目標 ID。' }, { status: 400, headers: CORS_HEADERS });
    }

    // 刪除膠囊分類
    if (target === 'category') {
      // 檢查分類下是否仍有項目
      const itemCount = await env.DB.prepare('SELECT COUNT(*) as cnt FROM guide_items WHERE type = ?').bind(id).first();
      if (itemCount && itemCount.cnt > 0) {
        return Response.json({
          success: false,
          message: `無法刪除此分類：目前尚有 ${itemCount.cnt} 個景點/美食項目歸屬於此分類，請先將項目轉移或刪除。`
        }, { status: 400, headers: CORS_HEADERS });
      }

      const cat = await env.DB.prepare('SELECT name_zh FROM guide_categories WHERE id = ?').bind(id).first();
      await env.DB.prepare('DELETE FROM guide_categories WHERE id = ?').bind(id).run();

      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('guide', 'DELETE_CATEGORY', ?, ?, ?, ?)
      `).bind(
        id,
        `刪除膠囊分類：「${cat?.name_zh || id}」`,
        JSON.stringify({ id, nameZh: cat?.name_zh }),
        operator
      ).run();

      return Response.json({ success: true, message: `已成功刪除分類「${cat?.name_zh || id}」！` }, { headers: CORS_HEADERS });
    }

    // 刪除景點項目
    if (target === 'item') {
      const it = await env.DB.prepare('SELECT name_zh, type FROM guide_items WHERE id = ?').bind(id).first();
      await env.DB.prepare('DELETE FROM guide_items WHERE id = ?').bind(id).run();

      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('guide', 'DELETE_ITEM', ?, ?, ?, ?)
      `).bind(
        id,
        `刪除周邊推薦項目：「${it?.name_zh || id}」`,
        JSON.stringify({ id, nameZh: it?.name_zh }),
        operator
      ).run();

      return Response.json({ success: true, message: `已成功刪除項目「${it?.name_zh || id}」！` }, { headers: CORS_HEADERS });
    }

    return Response.json({ success: false, message: '未知的刪除目標類型。' }, { status: 400, headers: CORS_HEADERS });

  } catch (err) {
    console.error('[AdminGuide DELETE] 刪除操作失敗:', err);
    return Response.json({ success: false, message: '刪除操作失敗，請稍後再試。' }, { status: 500, headers: CORS_HEADERS });
  }
}
