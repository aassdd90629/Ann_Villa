/**
 * functions/api/admin/media/upload.js
 * 
 * POST /api/admin/media/upload
 * 
 * 處理管家端圖片上傳：
 * 1. 若環境有綁定 Cloudflare R2 (env.MEDIA_BUCKET)，實體檔案極速直傳 R2，並建立快取 CDN URL
 * 2. 若本機端或無 R2 綁定，則以 WebP Data URL 存儲於 D1，保證本機開發與展示完全零報錯
 * 3. 登錄中繼資料至 media_assets 表，並寫入安全審計日誌
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

export async function onRequestPost(context) {
  const { request, env, data } = context;
  const currentAdmin = data.adminUser;

  if (!env.DB) {
    return Response.json({ success: false, message: 'DB not bound' }, { status: 500, headers: CORS_HEADERS });
  }

  try {
    const body = await request.json();
    const { 
      base64, 
      filename = 'image.webp', 
      category = 'hero', 
      subCategory = 'banner',
      titleZh, 
      titleEn = '', 
      tagZh = '', 
      tagEn = '',
      width = 1920,
      height = 1080,
      fileSize = 0,
      mimeType = 'image/webp'
    } = body;

    if (!base64) {
      return Response.json({ success: false, message: '請提供圖片 base64 資料。' }, { status: 400, headers: CORS_HEADERS });
    }

    if (!titleZh || !titleZh.trim()) {
      return Response.json({ success: false, message: '請輸入圖片名稱/描述。' }, { status: 400, headers: CORS_HEADERS });
    }

    const cleanTitleZh = titleZh.trim();
    const mediaId = 'media-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const bucket = env.MEDIA_BUCKET || env.R2_BUCKET;

    let r2Key = null;
    let cdnUrl = '';

    if (bucket) {
      // 1. 寫入 Cloudflare R2
      try {
        const rawBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
        const binaryStr = atob(rawBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        r2Key = `uploads/${category}/${Date.now()}-${safeFilename}`;

        await bucket.put(r2Key, bytes, {
          httpMetadata: {
            contentType: mimeType || 'image/webp',
            cacheControl: 'public, max-age=31536000, immutable'
          }
        });

        // 訪問路徑
        cdnUrl = `/api/media/${r2Key}`;
      } catch (r2Err) {
        console.warn('[R2 Upload Warning]:', r2Err.message);
        cdnUrl = base64; // Fallback
      }
    } else {
      // 2. 本機或展示環境備援：使用 Base64 Data URL
      cdnUrl = base64;
    }

    // 狀態預設為 0 (草稿，符合「先草稿再上架」規範)
    const initialActive = (body.isActive === true || body.isActive === 1) ? 1 : 0;

    // 取得當前最大排序值
    const maxSortRow = await env.DB.prepare(
      'SELECT MAX(sort_order) as maxSort FROM media_assets WHERE category = ?'
    ).bind(category).first();
    const nextSort = (maxSortRow?.maxSort || 0) + 1;

    // 寫入 D1 media_assets 表
    await env.DB.prepare(`
      INSERT INTO media_assets (
        id, category, sub_category, title_zh, title_en, tag_zh, tag_en, r2_key, cdn_url, file_size, width, height, sort_order, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      mediaId,
      category,
      subCategory || '',
      cleanTitleZh,
      titleEn.trim(),
      tagZh.trim(),
      tagEn.trim(),
      r2Key,
      cdnUrl,
      Number(fileSize) || 0,
      Number(width) || 1920,
      Number(height) || 1080,
      nextSort,
      initialActive
    ).run();

    // 寫入操作日誌
    const operator = getOperatorTag(currentAdmin);
    await env.DB.prepare(`
      INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
      VALUES ('media', 'UPLOAD_IMAGE', ?, ?, ?, ?)
    `).bind(
      mediaId,
      `上傳新圖片：「${cleanTitleZh}」至【${category === 'hero' ? '首頁Hero' : category === 'room' ? '客房' : '公設'}】（狀態：${initialActive === 1 ? '直接上架' : '草稿'}，儲存於：${r2Key ? 'Cloudflare R2' : '本地儲存'}）`,
      JSON.stringify({ mediaId, category, width, height, r2Key, isActive: Boolean(initialActive) }),
      operator
    ).run();

    return Response.json({
      success: true,
      message: initialActive === 1 ? '圖片已成功上架並加入媒體庫！' : '圖片已成功儲存為草稿（待審核後可一鍵上架）！',
      asset: {
        id: mediaId,
        category,
        subCategory,
        titleZh: cleanTitleZh,
        titleEn,
        tagZh,
        tagEn,
        cdnUrl,
        r2Key,
        sortOrder: nextSort,
        isActive: Boolean(initialActive)
      }
    }, { headers: CORS_HEADERS });

  } catch (err) {
    return Response.json(
      { success: false, message: '圖片上傳處理失敗: ' + err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
