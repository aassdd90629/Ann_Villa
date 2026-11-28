/**
 * functions/api/facilities.js
 * 
 * GET /api/facilities - 公開取得所有公共休閒娛樂設施與相片圖集 (100% 資料庫純動態驅動)
 * 
 * 核心規範：
 * 1. 已完全刪除靜態寫死之 DEFAULT_FACILITIES 陣列，回歸 D1 資料庫為唯一真理。
 * 2. 設施相簿 (gallery) 與主圖 (image) 全面連線 D1 media_assets (WHERE category = 'facility' AND is_active = 1)。
 * 3. 🎯 防呆機制：若某公設分類目前無相片 (gallery.length === 0)，前台自動排除不顯示，避免空白與破版。
 * 4. 停用 HTTP 快取 (no-cache, no-store)，確保管家於後台更換照片後即時生效。
 */

const facilityAliasMap = {
  'ktv-theater': ['living-ktv', 'ktv-theater', 'ktv'],
  'smart-kitchen': ['kitchen', 'smart-kitchen', 'kitchen-bar'],
  'mahjong-room': ['mahjong', 'mahjong-room', 'fac-mahjong-01', 'fac-mahjong-02'],
  'outdoor-bbq': ['bbq', 'outdoor-bbq'],
  'tea-ceremony': ['tea', 'tea-ceremony'],
  'viewing-deck': ['viewing-deck', 'terrace']
};

export async function onRequestGet(context) {
  const { env } = context;

  const noCacheHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  try {
    if (!env || !env.DB) {
      return Response.json({ success: true, facilities: [] }, { headers: noCacheHeaders });
    }

    // 1. 查詢 D1 facilities 表 (啟用的設施空間)
    let facResults = [];
    try {
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
          sort_order AS sortOrder
        FROM facilities
        WHERE is_active = 1
        ORDER BY sort_order ASC
      `).all();
      facResults = dbFacs?.results || [];
    } catch (facErr) {
      console.warn('[Facilities API] 查詢 facilities 表警訊:', facErr.message);
    }

    // 2. 核心：即時自 media_assets 查詢啟用中的園區公設照片 (is_active = 1)
    let activeMedia = [];
    try {
      const mediaRes = await env.DB.prepare(`
        SELECT sub_category, cdn_url, sort_order, title_zh, tag_zh
        FROM media_assets 
        WHERE category = 'facility' AND is_active = 1 
        ORDER BY sort_order ASC, created_at ASC
      `).all();
      activeMedia = mediaRes?.results || [];
    } catch (mediaErr) {
      console.warn('[Facilities API] 查詢 media_assets 警訊:', mediaErr.message);
    }

    // 3. 將 media_assets 的動態圖片綁定至各設施空間
    const formattedFacilities = facResults.map(f => {
      const aliases = facilityAliasMap[f.id] || [f.id];

      // 匹配該設施的所有啟用相片
      const matchedMedia = activeMedia.filter(m => aliases.includes(m.sub_category));

      let gallery = [];
      let image = f.image || '';

      // 🎯 只要 media_assets 中有該設施的相片管理記錄，100% 以 media_assets 為準
      if (matchedMedia.length > 0) {
        gallery = matchedMedia.map(m => m.cdn_url);
        image = gallery[0];
      } else if (f.galleryJson) {
        try { 
          gallery = JSON.parse(f.galleryJson); 
          if (!Array.isArray(gallery)) gallery = [];
        } catch {
          gallery = [];
        }
        image = f.image || (gallery.length > 0 ? gallery[0] : '');
      }

      let featuresZh = [];
      if (f.featuresZhJson) {
        try { featuresZh = JSON.parse(f.featuresZhJson); } catch {}
      }

      let featuresEn = [];
      if (f.featuresEnJson) {
        try { featuresEn = JSON.parse(f.featuresEnJson); } catch {}
      }

      return {
        id: f.id,
        titleZh: f.titleZh || '',
        titleEn: f.titleEn || '',
        descZh: f.descZh || '',
        descEn: f.descEn || '',
        image,
        featuresZh,
        featuresEn,
        gallery,
        sortOrder: f.sortOrder || 1
      };
    });

    // 4. 動態納入管家在後台自訂新增的全新公設空間 (如 fac-custom-xxx)
    const allKnownAliases = new Set(Object.values(facilityAliasMap).flat());
    const customFacSubCats = new Set();
    activeMedia.forEach(m => {
      if (m.sub_category && !allKnownAliases.has(m.sub_category)) {
        customFacSubCats.add(m.sub_category);
      }
    });

    customFacSubCats.forEach(customSubId => {
      const customPhotos = activeMedia.filter(m => m.sub_category === customSubId);
      if (customPhotos.length > 0) {
        formattedFacilities.push({
          id: customSubId,
          titleZh: customPhotos[0].tag_zh || '全新規劃公設空間',
          titleEn: 'Custom Leisure Amenity',
          descZh: '全新規劃之莊園公共休閒空間，提供尊榮愜意的山居休閒體驗。',
          descEn: 'Exclusive leisure amenity space for relaxation.',
          image: customPhotos[0].cdn_url,
          featuresZh: ['專屬休閒設施', '舒適放鬆空間', '全天候開放'],
          featuresEn: ['Exclusive amenity', 'Relaxing space'],
          gallery: customPhotos.map(m => m.cdn_url),
          sortOrder: 99
        });
      }
    });

    // 🎯 核心過濾機制：無相片 (gallery.length === 0) 之分類一律不對外呈現，避免前台出現無圖空白卡片
    const validFacilities = formattedFacilities.filter(f => Array.isArray(f.gallery) && f.gallery.length > 0);

    return Response.json({
      success: true,
      facilities: validFacilities
    }, { headers: noCacheHeaders });

  } catch (err) {
    console.error('[Facilities API] 讀取失敗:', err.message);
    return Response.json({
      success: false,
      facilities: []
    }, { status: 500, headers: noCacheHeaders });
  }
}
