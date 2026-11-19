/**
 * functions/api/admin/_middleware.js
 * 
 * 山語 Villa 後台專屬 API 邊緣中介軟體 (Auth Middleware)
 * 遵照後端規範與 1113todo.md：
 * - 嚴格攔截所有 /api/admin/* 請求
 * - 登入端點 (POST /api/admin/auth) 放行
 * - 其餘所有管理 API 強制驗證 Authorization: Bearer <TOKEN>
 * - 未授權請求直接回傳 401 Unauthorized
 */

import { verifyToken } from './_jwt.js';

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. POST /api/admin/auth 為登入接口，直接放行
  if (pathname === '/api/admin/auth' && request.method === 'POST') {
    return next();
  }

  // 2. 取得 Authorization Header 或 Cookie 中的 Token
  const authHeader = request.headers.get('Authorization') || '';
  let token = '';

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else {
    // 嘗試自 Cookie 取得
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [k, ...v] = c.trim().split('=');
        return [k, v.join('=')];
      })
    );
    token = cookies['shanyu_admin_token'] || '';
  }

  if (!token) {
    return new Response(
      JSON.stringify({ success: false, message: '未經授權：缺少管理員登入憑證。' }),
      { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }

  // 3. 邊緣校驗 Token 有效性與簽章
  const secret = env.JWT_SECRET || 'shanyu_villa_jwt_super_secret_key_2026';
  const adminUser = await verifyToken(token, secret);

  if (!adminUser) {
    return new Response(
      JSON.stringify({ success: false, message: '未經授權：登入憑證已過期或無效，請重新登入。' }),
      { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }

  // 4. 即時檢查帳號是否已被停用 (即時踢出已停用管家) 與同步最新角色
  if (env.DB && adminUser.id && adminUser.id !== 'admin-fallback-01') {
    try {
      const dbUser = await env.DB.prepare(
        'SELECT display_name, role, is_active FROM admin_users WHERE id = ?'
      ).bind(adminUser.id).first();

      if (dbUser) {
        if (dbUser.is_active === 0) {
          return new Response(
            JSON.stringify({ success: false, message: '存取被拒：您的管家帳號已被停用，請洽超級管理員。' }),
            { status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }
        adminUser.displayName = dbUser.display_name;
        adminUser.role = dbUser.role === 'HOST' ? 'CONCIERGE' : dbUser.role;
      }
    } catch (dbErr) {
      // 容錯跳過，依賴 Token 資訊
    }
  }

  // 5. RBAC 權限角色檢查
  const isWriteMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);

  // (1) 唯讀人員 (VIEWER) 禁止所有寫入操作
  if (isWriteMethod && adminUser.role === 'VIEWER') {
    return new Response(
      JSON.stringify({ success: false, message: '權限不足：您的帳號為「唯讀人員 (VIEWER)」，無法進行任何新增、修改或刪除操作。' }),
      { status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }

  // (2) 超級管理員專屬權限守門
  const requiresSuperAdmin = 
    pathname.startsWith('/api/admin/users') ||
    pathname.startsWith('/api/admin/bookings/clear-test') ||
    (pathname.startsWith('/api/admin/pricing') && request.method === 'POST');

  if (requiresSuperAdmin && adminUser.role !== 'SUPERADMIN') {
    return new Response(
      JSON.stringify({ success: false, message: '權限不足：此項操作僅限「超級管理員 (SUPERADMIN)」執行。' }),
      { status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }

  // 6. 通過校驗，注入至 context.data 供後續 API 使用
  context.data.adminUser = adminUser;
  return next();
}

