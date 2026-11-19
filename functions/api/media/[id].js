/**
 * functions/api/media/[id].js
 * 
 * GET /api/media/:id - 串流 Cloudflare R2 雲端圖床實體檔案
 * 若 env.MEDIA_BUCKET 綁定，則自 R2 邊緣節點極速讀取並注入 Cache-Control。
 */

export async function onRequestGet(context) {
  const { params, env } = context;
  const mediaId = params.id;

  const bucket = env.MEDIA_BUCKET || env.R2_BUCKET;

  if (bucket) {
    try {
      const object = await bucket.get(mediaId);
      if (object) {
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');

        return new Response(object.body, { headers });
      }
    } catch (err) {
      console.warn('[R2 Media Serve] error:', err.message);
    }
  }

  // 若 R2 找不到或未綁定，自 D1 media_assets 查詢重定向或返回 404
  if (env.DB) {
    try {
      const row = await env.DB.prepare('SELECT cdn_url FROM media_assets WHERE id = ? OR r2_key = ?').bind(mediaId, mediaId).first();
      if (row && row.cdn_url) {
        return Response.redirect(row.cdn_url, 302);
      }
    } catch (e) {
      // ignore
    }
  }

  return new Response('Image not found', { status: 404 });
}
