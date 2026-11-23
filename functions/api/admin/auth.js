/**
 * functions/api/admin/auth.js
 * 
 * POST /api/admin/auth - 管家/管理員登入
 * GET  /api/admin/auth - 驗證當前 Token 是否有效 (由 _middleware 守護)
 */

import { signToken, hashPassword } from './_jwt.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return Response.json(
        { success: false, message: '請輸入使用者帳號與密碼。' },
        { status: 400 }
      );
    }

    const secret = env.JWT_SECRET || 'shanyu_villa_jwt_super_secret_key_2026';
    let matchedUser = null;

    // 1. 優先查詢 D1 資料庫 admin_users 表
    if (env.DB) {
      try {
        const user = await env.DB.prepare(
          'SELECT * FROM admin_users WHERE username = ?'
        ).bind(username.trim().toLowerCase()).first();

        if (user) {
          if (user.is_active === 0) {
            return Response.json(
              { success: false, message: '登入失敗：此管家帳號已被停用，請聯繫超級管理員。' },
              { status: 403 }
            );
          }

          const inputHash = await hashPassword(password, user.salt);
          if (inputHash === user.password_hash) {
            matchedUser = {
              id: user.id,
              username: user.username,
              displayName: user.display_name,
              role: user.role === 'HOST' ? 'CONCIERGE' : user.role
            };

            // 更新最後登入時間
            await env.DB.prepare(
              'UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?'
            ).bind(user.id).run();
          }
        }
      } catch (dbErr) {
        console.warn('查詢 admin_users 表異常 (可能尚未遷移)，切換至預設備援認證:', dbErr.message);
      }
    }

    // 2. 備援認證 (當 D1 尚未遷移或本機單機測試時，允許預設管理員登入)
    if (!matchedUser) {
      const fallbackPassword = env.ADMIN_PASSWORD || 'HccDNH!8dQDGupqb';
      if (username.trim().toLowerCase() === 'admin' && password === fallbackPassword) {
        matchedUser = {
          id: 'admin-fallback-01',
          username: 'admin',
          displayName: '山語專屬管家',
          role: 'SUPERADMIN'
        };
      }
    }

    // 3. 帳密檢核失敗
    if (!matchedUser) {
      return Response.json(
        { success: false, message: '帳號或密碼錯誤，請重新確認。' },
        { status: 401 }
      );
    }

    // 4. 寫入登入稽核日誌
    if (env.DB) {
      try {
        const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
        const roleZhMap = { SUPERADMIN: '超級管理員', CONCIERGE: '駐館管家', VIEWER: '唯讀人員', HOST: '駐館管家' };
        await env.DB.prepare(`
          INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator, ip_address)
          VALUES ('security', 'ADMIN_LOGIN', ?, ?, ?, ?, ?)
        `).bind(
          matchedUser.username,
          `管家「${matchedUser.displayName}」(${matchedUser.username}) 成功登入後台管理系統`,
          JSON.stringify({ role: matchedUser.role, roleName: roleZhMap[matchedUser.role] || matchedUser.role }),
          `${matchedUser.displayName} (${matchedUser.username})`,
          clientIp
        ).run();
      } catch (logErr) {
        // 容錯不阻擋登入
      }
    }

    // 5. 簽發 7 天效期之安全 Token
    const token = await signToken(matchedUser, secret);

    return Response.json({
      success: true,
      message: '登入成功',
      token,
      user: matchedUser
    });

  } catch (err) {
    return Response.json(
      { success: false, message: '伺服器內部錯誤: ' + err.message },
      { status: 500 }
    );
  }
}

export async function onRequestGet(context) {
  // 通過 _middleware.js 驗證後，直接回傳當前使用者資訊
  return Response.json({
    success: true,
    user: context.data.adminUser
  });
}

