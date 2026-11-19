/**
 * functions/api/admin/users.js
 * 
 * 山語 Villa 後台人員帳號與 RBAC 角色權限管理 API
 * 遵守後端規範：
 * - 參數化綁定 env.DB.prepare(...).bind(...) 防 SQL 注入
 * - 嚴禁外洩明文密碼與 salt，僅回傳公開安全欄位
 * - 嚴格限制僅限「超級管理員 (SUPERADMIN)」訪問與操作
 * - 所有異動操作自動留痕寫入 admin_audit_logs 審計日誌
 */

import { hashPassword } from './_jwt.js';

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
 * 產生安全隨機鹽值 (16 bytes 16進制字串)
 */
function generateSalt(bytesLength = 16) {
  const bytes = new Uint8Array(bytesLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 確保 admin_users 表結構存在 (自我修復與種子預載)
 */
async function ensureAdminUsersTable(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        display_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'CONCIERGE',
        is_active INTEGER DEFAULT 1,
        last_login_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username)`).run();

    // 檢查是否有初始超級管理員種子
    const countRes = await db.prepare('SELECT COUNT(*) as cnt FROM admin_users').first();
    if (!countRes || countRes.cnt === 0) {
      await db.prepare(`
        INSERT INTO admin_users (
          id, username, password_hash, salt, display_name, role, is_active
        ) VALUES (
          'admin-shanyu-01',
          'admin',
          '29f659084369aadb3eb0602e939c7d227fc03ef824058b57630964242e677836',
          'shanyu_villa_salt_2026',
          '山語專屬管家',
          'SUPERADMIN',
          1
        )
      `).run();
    }
  } catch (err) {
    console.warn('[AdminUsers] ensureAdminUsersTable warning:', err.message);
  }
}

/**
 * 寫入審計操作日誌輔助函式
 */
async function logSecurityAudit(db, { action, targetId, summary, details = null, operator, ipAddress = null }) {
  try {
    await db.prepare(`
      INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator, ip_address)
      VALUES ('security', ?, ?, ?, ?, ?, ?)
    `).bind(
      action,
      targetId || '',
      summary,
      details ? JSON.stringify(details) : null,
      operator || 'admin',
      ipAddress || null
    ).run();
  } catch (err) {
    console.warn('[AdminUsers] logSecurityAudit warning:', err.message);
  }
}

/**
 * 取得操作者標籤 (顯示名稱 + 帳號)
 */
function getOperatorTag(adminUser) {
  if (!adminUser) return 'admin';
  return `${adminUser.displayName || adminUser.username} (${adminUser.username || 'admin'})`;
}

/**
 * GET /api/admin/users
 * 查詢所有管家人員列表（僅限 SUPERADMIN）
 */
export async function onRequestGet(context) {
  const { env, data } = context;
  const currentAdmin = data.adminUser;

  if (!env.DB) {
    return Response.json({ success: false, message: '資料庫尚未綁定 (DB not bound)' }, { status: 500, headers: CORS_HEADERS });
  }

  // 權限檢查：僅限 SUPERADMIN
  if (!currentAdmin || currentAdmin.role !== 'SUPERADMIN') {
    return Response.json(
      { success: false, message: '權限不足：僅限「超級管理員 (SUPERADMIN)」查閱人員管理列表。' },
      { status: 403, headers: CORS_HEADERS }
    );
  }

  try {
    await ensureAdminUsersTable(env.DB);

    const query = `
      SELECT 
        id,
        username,
        display_name,
        role,
        is_active,
        last_login_at,
        created_at,
        updated_at
      FROM admin_users
      ORDER BY 
        CASE role 
          WHEN 'SUPERADMIN' THEN 1 
          WHEN 'HOST' THEN 2 
          WHEN 'CONCIERGE' THEN 2 
          ELSE 3 
        END ASC,
        created_at ASC
    `;

    const { results } = await env.DB.prepare(query).all();

    const formattedUsers = (results || []).map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      role: u.role === 'HOST' ? 'CONCIERGE' : u.role, // 向前相容 HOST 映射為 CONCIERGE
      isActive: Boolean(u.is_active),
      lastLoginAt: u.last_login_at,
      createdAt: u.created_at,
      updatedAt: u.updated_at
    }));

    return Response.json({
      success: true,
      users: formattedUsers,
      currentUserRole: currentAdmin.role,
      currentUserId: currentAdmin.id
    }, { headers: CORS_HEADERS });

  } catch (err) {
    return Response.json(
      { success: false, message: '讀取人員列表失敗: ' + err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * POST /api/admin/users
 * 新增管家人員帳號（僅限 SUPERADMIN）
 */
export async function onRequestPost(context) {
  const { request, env, data } = context;
  const currentAdmin = data.adminUser;

  if (!env.DB) {
    return Response.json({ success: false, message: '資料庫尚未綁定 (DB not bound)' }, { status: 500, headers: CORS_HEADERS });
  }

  // 權限檢查：僅限 SUPERADMIN
  if (!currentAdmin || currentAdmin.role !== 'SUPERADMIN') {
    return Response.json(
      { success: false, message: '權限不足：僅限「超級管理員 (SUPERADMIN)」新增管家帳號。' },
      { status: 403, headers: CORS_HEADERS }
    );
  }

  try {
    await ensureAdminUsersTable(env.DB);

    const body = await request.json();
    const { username, displayName, password, role = 'CONCIERGE' } = body;

    // 1. 欄位驗證
    if (!username || !username.trim()) {
      return Response.json({ success: false, message: '請輸入管家登入帳號。' }, { status: 400, headers: CORS_HEADERS });
    }
    if (!displayName || !displayName.trim()) {
      return Response.json({ success: false, message: '請輸入管家稱謂或姓名。' }, { status: 400, headers: CORS_HEADERS });
    }
    if (!password || password.length < 6) {
      return Response.json({ success: false, message: '初始密碼長度不得少於 6 個字元。' }, { status: 400, headers: CORS_HEADERS });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();

    // 檢查帳號格式 (僅允許小寫英數與底線)
    if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
      return Response.json(
        { success: false, message: '帳號格式不合規：僅允許 3~30 個英數字或底線。' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 角色檢核
    const validRoles = ['SUPERADMIN', 'CONCIERGE', 'VIEWER'];
    const assignedRole = validRoles.includes(role) ? role : 'CONCIERGE';

    // 2. 檢核帳號是否已存在
    const existing = await env.DB.prepare('SELECT id FROM admin_users WHERE username = ?').bind(cleanUsername).first();
    if (existing) {
      return Response.json(
        { success: false, message: `帳號「${cleanUsername}」已存在，請更換其他登入帳號。` },
        { status: 409, headers: CORS_HEADERS }
      );
    }

    // 3. 密碼加密
    const salt = generateSalt(16);
    const passwordHash = await hashPassword(password, salt);
    const newUserId = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

    // 4. 寫入資料庫
    await env.DB.prepare(`
      INSERT INTO admin_users (
        id, username, password_hash, salt, display_name, role, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      newUserId,
      cleanUsername,
      passwordHash,
      salt,
      cleanDisplayName,
      assignedRole
    ).run();

    // 5. 寫入安全日誌
    const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    const roleZhMap = { SUPERADMIN: '超級管理員', CONCIERGE: '駐館管家', VIEWER: '唯讀人員' };
    await logSecurityAudit(env.DB, {
      action: 'CREATE_USER',
      targetId: newUserId,
      summary: `新增管家帳號「${cleanDisplayName}」(${cleanUsername})，指派角色為【${roleZhMap[assignedRole]}】`,
      details: { username: cleanUsername, displayName: cleanDisplayName, role: assignedRole },
      operator: getOperatorTag(currentAdmin),
      ipAddress: clientIp
    });

    return Response.json({
      success: true,
      message: `已成功建立管家帳號「${cleanDisplayName}」`,
      user: {
        id: newUserId,
        username: cleanUsername,
        displayName: cleanDisplayName,
        role: assignedRole,
        isActive: true
      }
    }, { headers: CORS_HEADERS });

  } catch (err) {
    return Response.json(
      { success: false, message: '新增管家帳號失敗: ' + err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * PATCH /api/admin/users
 * 編輯管家資訊、重設密碼或切換啟用狀態（僅限 SUPERADMIN）
 */
export async function onRequestPatch(context) {
  const { request, env, data } = context;
  const currentAdmin = data.adminUser;

  if (!env.DB) {
    return Response.json({ success: false, message: '資料庫尚未綁定 (DB not bound)' }, { status: 500, headers: CORS_HEADERS });
  }

  // 權限檢查：僅限 SUPERADMIN
  if (!currentAdmin || currentAdmin.role !== 'SUPERADMIN') {
    return Response.json(
      { success: false, message: '權限不足：僅限「超級管理員 (SUPERADMIN)」修改管家權限或密碼。' },
      { status: 403, headers: CORS_HEADERS }
    );
  }

  try {
    const body = await request.json();
    const { id, displayName, role, isActive, password } = body;

    if (!id) {
      return Response.json({ success: false, message: '缺少目標人員 ID。' }, { status: 400, headers: CORS_HEADERS });
    }

    // 查詢目標使用者
    const targetUser = await env.DB.prepare(
      'SELECT id, username, display_name, role, is_active FROM admin_users WHERE id = ?'
    ).bind(id).first();

    if (!targetUser) {
      return Response.json({ success: false, message: '找不到該筆管家人員資料。' }, { status: 404, headers: CORS_HEADERS });
    }

    const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    const operator = getOperatorTag(currentAdmin);

    // 1. 重設密碼操作
    if (typeof password === 'string') {
      if (password.length < 6) {
        return Response.json({ success: false, message: '新密碼長度不得少於 6 個字元。' }, { status: 400, headers: CORS_HEADERS });
      }

      const newSalt = generateSalt(16);
      const newPasswordHash = await hashPassword(password, newSalt);

      await env.DB.prepare(`
        UPDATE admin_users 
        SET password_hash = ?, salt = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(newPasswordHash, newSalt, id).run();

      await logSecurityAudit(env.DB, {
        action: 'RESET_PASSWORD',
        targetId: id,
        summary: `重設管家「${targetUser.display_name}」(${targetUser.username}) 之登入安全密碼`,
        details: { username: targetUser.username },
        operator,
        ipAddress: clientIp
      });

      return Response.json({
        success: true,
        message: `管家「${targetUser.display_name}」之密碼已成功重設！`
      }, { headers: CORS_HEADERS });
    }

    // 2. 啟用 / 停用狀態切換
    if (typeof isActive === 'boolean' || typeof isActive === 'number') {
      const targetActive = isActive ? 1 : 0;

      // 防呆：禁止停用本人
      if (id === currentAdmin.id && targetActive === 0) {
        return Response.json(
          { success: false, message: '安全防護：您無法停用自己目前正在登入使用的管理員帳號。' },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      // 防呆：若要停用 SUPERADMIN，檢查系統是否還有其他啟用的 SUPERADMIN
      if (targetUser.role === 'SUPERADMIN' && targetActive === 0) {
        const superCount = await env.DB.prepare(
          "SELECT COUNT(*) as cnt FROM admin_users WHERE role = 'SUPERADMIN' AND is_active = 1 AND id != ?"
        ).bind(id).first();

        if (!superCount || superCount.cnt === 0) {
          return Response.json(
            { success: false, message: '安全防護：系統必須保留至少一位啟用中的「超級管理員」，無法停用此帳號。' },
            { status: 400, headers: CORS_HEADERS }
          );
        }
      }

      await env.DB.prepare(`
        UPDATE admin_users 
        SET is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(targetActive, id).run();

      await logSecurityAudit(env.DB, {
        action: targetActive === 1 ? 'ENABLE_USER' : 'DISABLE_USER',
        targetId: id,
        summary: `${targetActive === 1 ? '啟用' : '停用凍結'}管家「${targetUser.display_name}」(${targetUser.username}) 帳號`,
        details: { username: targetUser.username, isActive: Boolean(targetActive) },
        operator,
        ipAddress: clientIp
      });

      return Response.json({
        success: true,
        message: `管家帳號「${targetUser.display_name}」已成功${targetActive === 1 ? '啟用' : '停用'}。`
      }, { headers: CORS_HEADERS });
    }

    // 3. 編輯姓名與角色
    if (displayName || role) {
      const newDisplayName = (displayName || targetUser.display_name).trim();
      let newRole = role || targetUser.role;

      // 防呆：禁止將自己當前登入之 SUPERADMIN 角色降級
      if (id === currentAdmin.id && newRole !== 'SUPERADMIN' && targetUser.role === 'SUPERADMIN') {
        return Response.json(
          { success: false, message: '安全防護：您無法將自己的「超級管理員」角色降級。' },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      // 角色合法性檢查
      const validRoles = ['SUPERADMIN', 'CONCIERGE', 'VIEWER'];
      if (!validRoles.includes(newRole)) {
        newRole = targetUser.role;
      }

      await env.DB.prepare(`
        UPDATE admin_users 
        SET display_name = ?, role = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(newDisplayName, newRole, id).run();

      const roleZhMap = { SUPERADMIN: '超級管理員', CONCIERGE: '駐館管家', VIEWER: '唯讀人員', HOST: '駐館管家' };
      await logSecurityAudit(env.DB, {
        action: 'UPDATE_USER',
        targetId: id,
        summary: `更新管家「${targetUser.username}」資訊：姓名為「${newDisplayName}」，角色為【${roleZhMap[newRole]}】`,
        details: { username: targetUser.username, displayName: newDisplayName, role: newRole },
        operator,
        ipAddress: clientIp
      });

      return Response.json({
        success: true,
        message: '管家資料已成功更新！',
        user: {
          id,
          username: targetUser.username,
          displayName: newDisplayName,
          role: newRole,
          isActive: Boolean(targetUser.is_active)
        }
      }, { headers: CORS_HEADERS });
    }

    return Response.json({ success: false, message: '未提供任何更新內容。' }, { status: 400, headers: CORS_HEADERS });

  } catch (err) {
    return Response.json(
      { success: false, message: '更新管家資料失敗: ' + err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * DELETE /api/admin/users
 * 刪除管家人員帳號（僅限 SUPERADMIN）
 */
export async function onRequestDelete(context) {
  const { request, env, data } = context;
  const currentAdmin = data.adminUser;

  if (!env.DB) {
    return Response.json({ success: false, message: '資料庫尚未綁定 (DB not bound)' }, { status: 500, headers: CORS_HEADERS });
  }

  // 權限檢查：僅限 SUPERADMIN
  if (!currentAdmin || currentAdmin.role !== 'SUPERADMIN') {
    return Response.json(
      { success: false, message: '權限不足：僅限「超級管理員 (SUPERADMIN)」刪除管家帳號。' },
      { status: 403, headers: CORS_HEADERS }
    );
  }

  try {
    const url = new URL(request.url);
    let id = url.searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch (e) {
        // body not present
      }
    }

    if (!id) {
      return Response.json({ success: false, message: '缺少欲刪除之管家 ID。' }, { status: 400, headers: CORS_HEADERS });
    }

    // 1. 查詢目標使用者
    const targetUser = await env.DB.prepare(
      'SELECT id, username, display_name, role FROM admin_users WHERE id = ?'
    ).bind(id).first();

    if (!targetUser) {
      return Response.json({ success: false, message: '找不到欲刪除之管家資料。' }, { status: 404, headers: CORS_HEADERS });
    }

    // 2. 防呆：禁止刪除自己
    if (id === currentAdmin.id) {
      return Response.json(
        { success: false, message: '安全防護：您無法刪除自己當前正在登入使用的超級管理員帳號。' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 3. 防呆：若欲刪除 SUPERADMIN，檢查系統是否還有其他 SUPERADMIN
    if (targetUser.role === 'SUPERADMIN') {
      const superCount = await env.DB.prepare(
        "SELECT COUNT(*) as cnt FROM admin_users WHERE role = 'SUPERADMIN' AND id != ?"
      ).bind(id).first();

      if (!superCount || superCount.cnt === 0) {
        return Response.json(
          { success: false, message: '安全防護：系統必須保留至少一位「超級管理員」，無法刪除此帳號。' },
          { status: 400, headers: CORS_HEADERS }
        );
      }
    }

    // 4. 執行刪除
    await env.DB.prepare('DELETE FROM admin_users WHERE id = ?').bind(id).run();

    // 5. 寫入安全日誌
    const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    await logSecurityAudit(env.DB, {
      action: 'DELETE_USER',
      targetId: id,
      summary: `刪除管家帳號「${targetUser.display_name}」(${targetUser.username})`,
      details: { username: targetUser.username, displayName: targetUser.display_name, role: targetUser.role },
      operator: getOperatorTag(currentAdmin),
      ipAddress: clientIp
    });

    return Response.json({
      success: true,
      message: `已成功刪除管家帳號「${targetUser.display_name}」(${targetUser.username})。`
    }, { headers: CORS_HEADERS });

  } catch (err) {
    return Response.json(
      { success: false, message: '刪除管家帳號失敗: ' + err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
