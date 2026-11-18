/**
 * GET /api/admin/logs - 查詢後台全方位稽核與操作日誌
 * POST /api/admin/logs - 寫入新稽核日誌
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8'
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * 確保 admin_audit_logs 表存在 (自我修復機制)
 */
async function ensureAuditTable(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        action TEXT NOT NULL,
        target_id TEXT,
        summary TEXT NOT NULL,
        details_json TEXT,
        operator TEXT DEFAULT 'admin',
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_audit_category ON admin_audit_logs(category, created_at DESC)`).run();

    // 檢查是否有初始種子
    const check = await db.prepare('SELECT COUNT(*) as cnt FROM admin_audit_logs').first();
    if (!check || check.cnt === 0) {
      await db.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator, created_at)
        VALUES 
          ('pricing', 'UPDATE_PRICING', 'pricing_settings', '更新全區包棟平日階梯定價：10人以下2萬/14人2.5萬/18人3萬，一般假日3.5萬', '{"weekdayTier1":20000,"weekdayTier2":25000,"weekdayTier3":30000,"weekend":35000}', 'admin', datetime('now', '-2 hours')),
          ('pricing', 'IMPORT_GOV_HOLIDAYS', '2027', '一鍵匯入 2027 年度政府公告連續假期（共 9 組，包含假日前一天起算與春節不含早餐規範）', '{"year":2027,"count":9}', 'admin', datetime('now', '-1 hours')),
          ('calendar', 'MANUAL_LOCK', 'range-20270116-20270117', '管家手動自訂關房：2027-01-16 ~ 2027-01-17 全區維護保養', '{"startDate":"2027-01-16","endDate":"2027-01-17","reason":"全區保養維護"}', 'admin', datetime('now', '-5 hours')),
          ('booking', 'CONFIRM_DEPOSIT', 'SY-20261114-8821', '核銷直訂單 50% 定金入帳：NT$ 10,000，狀態變更為【已付定金】', '{"bookingNumber":"SY-20261114-8821","depositAmount":10000,"status":"DEPOSIT_PAID"}', 'admin', datetime('now', '-1 days')),
          ('security', 'ADMIN_LOGIN', 'admin', '管家帳號成功登入後台管理系統', '{"authMethod":"password"}', 'admin', datetime('now', '-30 minutes'))
      `).run();
    }
  } catch (err) {
    console.warn('[AuditLogs] ensureAuditTable warning:', err.message);
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({
      success: true,
      logs: [],
      total: 0,
      page: 1,
      totalPages: 1
    }), { headers: CORS_HEADERS });
  }

  try {
    await ensureAuditTable(env.DB);

    const url = new URL(request.url);
    const category = url.searchParams.get('category') || 'all';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '15', 10)));
    const offset = (page - 1) * limit;

    let countQuery = 'SELECT COUNT(*) as total FROM admin_audit_logs';
    let dataQuery = `
      SELECT id, category, action, target_id, summary, details_json, operator, ip_address, created_at
      FROM admin_audit_logs
    `;
    let bindings = [];

    if (category && category !== 'all') {
      countQuery += ' WHERE category = ?';
      dataQuery += ' WHERE category = ?';
      bindings.push(category);
    }

    dataQuery += ' ORDER BY id DESC LIMIT ? OFFSET ?';

    // 取得總筆數
    const countStmt = bindings.length > 0
      ? env.DB.prepare(countQuery).bind(...bindings)
      : env.DB.prepare(countQuery);
    const countResult = await countStmt.first();
    const total = countResult ? countResult.total : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // 取得日誌清單
    const dataBindings = [...bindings, limit, offset];
    const dataStmt = env.DB.prepare(dataQuery).bind(...dataBindings);
    const { results } = await dataStmt.all();

    // 格式化 details_json
    const formattedLogs = (results || []).map(row => {
      let parsedDetails = null;
      if (row.details_json) {
        try { parsedDetails = JSON.parse(row.details_json); } catch (_) { parsedDetails = row.details_json; }
      }
      return {
        id: row.id,
        category: row.category,
        action: row.action,
        targetId: row.target_id,
        summary: row.summary,
        details: parsedDetails,
        operator: row.operator,
        ipAddress: row.ip_address,
        createdAt: row.created_at
      };
    });

    return new Response(JSON.stringify({
      success: true,
      logs: formattedLogs,
      total,
      page,
      limit,
      totalPages
    }), { headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message,
      logs: []
    }), { status: 500, headers: CORS_HEADERS });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, message: 'DB not bound' }), { status: 500, headers: CORS_HEADERS });
  }

  try {
    await ensureAuditTable(env.DB);
    const body = await request.json();

    const category = body.category || 'general';
    const action = body.action || 'CUSTOM_ACTION';
    const targetId = body.targetId || null;
    const summary = body.summary || '未註明操作簡述';
    const detailsJson = body.details ? JSON.stringify(body.details) : null;
    const operator = body.operator || 'admin';
    const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || null;

    await env.DB.prepare(`
      INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(category, action, targetId, summary, detailsJson, operator, clientIp).run();

    return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}
