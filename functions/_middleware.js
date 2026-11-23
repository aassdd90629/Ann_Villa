/**
 * functions/_middleware.js
 * 
 * 山語 Villa 全站邊緣中介軟體 (Edge Middleware)
 * - 清除舊版 GitHub Pages 404 hack 殘留之網址 (~and~ 死循環)
 * - SPA Fallback：當請求之靜態檔案不存在且為 HTML 請求時，自動回退至 index.html 由 Vue Router 承接
 */

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. 防呆：清除被舊版 GitHub Pages 404 hack 污染之網址 (~and~ 死循環)
  if (pathname.includes('~and~') || url.search.includes('~and~') || pathname.includes('/?/')) {
    const cleanTarget = pathname.startsWith('/admin') ? '/admin' : '/';
    return new Response(null, {
      status: 302,
      headers: { 'Location': cleanTarget }
    });
  }

  // 2. 正常執行後續請求與 API (已移除全站訪問密碼門禁，大眾訪客可公開直接瀏覽)
  const response = await next();

  // 3. SPA Fallback: 若靜態資源不存在 (404) 且為 HTML 頁面請求，回退至 index.html 由 Vue Router 承接
  if (response.status === 404 && request.headers.get('accept')?.includes('text/html') && env.ASSETS) {
    return env.ASSETS.fetch(new URL('/', request.url));
  }

  return response;
}
