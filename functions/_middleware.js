/**
 * functions/_middleware.js
 * 
 * 山語 Villa 全站展示訪問門禁 (Site Password Gate)
 * 遵照 AGENTS.md 4. 展示與驗收環境規範：
 * - 透過邊緣中介軟體讀取 env.SITE_PASSWORD (預設 ryan1123_Ann)
 * - 未通過驗證者攔截並渲染高奢黑金質感的「專案展示解鎖頁」
 * - 輸入正確密碼後寫入 30 天 HttpOnly 安全 Cookie
 * - 靜態資源 (.js, .css, .png 等) 自動放行避免白屏
 */

// 密碼簡易簽章生成 (利用 SHA-256)
async function generateSignature(password) {
  const enc = new TextEncoder();
  const data = enc.encode(password + ':shanyu_demo_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 產生高奢山語質感的解鎖 HTML
function renderUnlockPage(errorMessage = '', returnUrl = '/') {
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>山語 Villa ｜ 專案驗收展示門禁</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: linear-gradient(135deg, #0d131f 0%, #151f32 50%, #0a0e17 100%);
      color: #e5e9f0;
      font-family: -apple-system, BlinkMacSystemFont, "PingFang TC", "Microsoft JhengHei", sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .gate-card {
      background: rgba(22, 32, 50, 0.75);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(212, 175, 55, 0.3);
      border-radius: 16px;
      padding: 40px 32px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(212, 175, 55, 0.1);
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .gate-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, transparent, #d4af37, #f3e5ab, #d4af37, transparent);
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(212, 175, 55, 0.15);
      border: 1px solid rgba(212, 175, 55, 0.4);
      color: #d4af37;
      font-size: 12px;
      border-radius: 20px;
      letter-spacing: 2px;
      margin-bottom: 20px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      letter-spacing: 4px;
      color: #f3e5ab;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 13px;
      color: #94a3b8;
      letter-spacing: 1px;
      margin-bottom: 28px;
      line-height: 1.6;
    }
    .form-group {
      margin-bottom: 20px;
      text-align: left;
    }
    .label {
      display: block;
      font-size: 12px;
      color: #cbd5e1;
      margin-bottom: 8px;
      letter-spacing: 1px;
    }
    .input-box {
      width: 100%;
      padding: 14px 16px;
      background: rgba(13, 19, 31, 0.8);
      border: 1px solid rgba(212, 175, 55, 0.25);
      border-radius: 8px;
      color: #fff;
      font-size: 15px;
      outline: none;
      transition: all 0.3s ease;
      letter-spacing: 1px;
    }
    .input-box:focus {
      border-color: #d4af37;
      box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
      background: rgba(13, 19, 31, 0.95);
    }
    .error-msg {
      color: #f87171;
      font-size: 13px;
      margin-bottom: 16px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      padding: 8px 12px;
      border-radius: 6px;
    }
    .btn-submit {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #d4af37 0%, #b89327 100%);
      color: #0d131f;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 2px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .btn-submit:hover {
      background: linear-gradient(135deg, #dfbc46 0%, #c49c30 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
    }
    .footer-hint {
      margin-top: 24px;
      font-size: 11px;
      color: #64748b;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="gate-card">
    <div class="badge">DEMO STAGING</div>
    <h1 class="title">山語 Villa</h1>
    <p class="subtitle">專案官方展示驗收環境<br>請輸入專屬通關密碼進入瀏覽</p>
    
    ${errorMessage ? `<div class="error-msg">${errorMessage}</div>` : ''}

    <form method="POST" action="/__site_unlock">
      <input type="hidden" name="returnUrl" value="${escapeHtml(returnUrl)}">
      <div class="form-group">
        <label class="label">訪問密碼 / ACCESS PASSWORD</label>
        <input type="password" name="password" class="input-box" placeholder="請輸入驗收密碼" autofocus required>
      </div>
      <button type="submit" class="btn-submit">驗證並進入官網</button>
    </form>
    
    <div class="footer-hint">
      山語 Villa 豪宅山莊包棟別墅 ｜ 內部專案預覽
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 0. 防呆：清除被舊版 GitHub Pages 404 hack 污染之網址 (~and~ 死循環)
  if (pathname.includes('~and~') || url.search.includes('~and~') || pathname.includes('/?/')) {
    const cleanTarget = pathname.startsWith('/admin') ? '/admin' : '/';
    return new Response(null, {
      status: 302,
      headers: { 'Location': cleanTarget }
    });
  }

  // 1. 若環境變數顯式關閉 (SITE_PASSWORD 為空)，直接放行 (附帶 SPA Fallback)
  const expectedPassword = env.SITE_PASSWORD ?? 'ryan1123_Ann';
  if (!expectedPassword) {
    const response = await next();
    if (response.status === 404 && request.headers.get('accept')?.includes('text/html') && env.ASSETS) {
      return env.ASSETS.fetch(new URL('/', request.url));
    }
    return response;
  }

  // 2. 靜態副檔名放行 (避免 CSS/JS/圖片/字型被中斷)
  const isStaticAsset = /\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|json|map|webmanifest|ics)$/i.test(pathname);
  if (isStaticAsset) {
    return next();
  }

  const validSignature = await generateSignature(expectedPassword);

  // 3. 處理密碼提交 POST /__site_unlock
  if (pathname === '/__site_unlock' && request.method === 'POST') {
    try {
      const formData = await request.formData();
      const inputPassword = formData.get('password') || '';
      const returnUrl = formData.get('returnUrl') || '/';

      if (inputPassword === expectedPassword) {
        // 密碼正確，寫入安全 Cookie (30 天有效)
        const headers = new Headers();
        headers.set('Location', returnUrl.startsWith('/') ? returnUrl : '/');
        headers.set(
          'Set-Cookie',
          `shanyu_demo_token=${validSignature}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
        );
        return new Response(null, { status: 302, headers });
      } else {
        // 密碼錯誤，重新渲染解鎖頁並帶錯誤提示
        return new Response(
          renderUnlockPage('通關密碼錯誤，請重新確認後再試。', returnUrl),
          { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    } catch (err) {
      return new Response('Invalid Request', { status: 400 });
    }
  }

  // 4. 檢查 Cookie 是否已有合法簽章
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );

  if (cookies['shanyu_demo_token'] === validSignature) {
    // Cookie 驗章通過，放行存取 (附帶 SPA Fallback: 若靜態檔案不存在則回退至 index.html 由 Vue Router 承接)
    const response = await next();
    if (response.status === 404 && request.headers.get('accept')?.includes('text/html') && env.ASSETS) {
      return env.ASSETS.fetch(new URL('/', request.url));
    }
    return response;
  }

  // 5. 若未驗證且是 API 請求，返回 401 JSON
  if (pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({ success: false, message: '請先完成展示環境密碼驗證。' }),
      { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }

  // 6. 其他頁面請求 (HTML)，攔截並渲染展示解鎖頁
  return new Response(
    renderUnlockPage('', pathname + url.search),
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

