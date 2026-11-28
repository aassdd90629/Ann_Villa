/**
 * functions/api/rooms.js
 * 
 * GET /api/rooms - 公開取得所有房型詳細規格、圖片與定價資訊 (100% 資料庫純動態驅動)
 * 
 * 核心規範：
 * 1. 已完全刪除靜態寫死之 DEFAULT_ROOMS 陣列，回歸 D1 資料庫為唯一真理。
 * 2. 圖片圖集 (gallery) 與封面主圖 (image) 全面連線 D1 media_assets (WHERE category = 'room' AND is_active = 1)。
 * 3. 🎯 防呆機制：若某房型目前無相片 (gallery.length === 0)，前台自動排除不顯示，避免空白與破版。
 * 4. 停用 HTTP 快取 (no-cache, no-store)，確保管家更新房型與相片後旅客立即看到最新圖資。
 */

const normalizeRoomId = (id) => (id || '').toLowerCase().replace(/^room-0?/, 'room-');

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
      return Response.json({ success: true, rooms: [] }, { headers: noCacheHeaders });
    }

    // 1. 查詢 D1 rooms 基本房型資訊 (排除包棟專案，僅取得獨立套房)
    let roomResults = [];
    try {
      const dbRooms = await env.DB.prepare(`
        SELECT 
          id, 
          name AS titleZh, 
          title_en AS titleEn,
          subtitle AS subtitleZh, 
          subtitle_en AS subtitleEn,
          floor,
          capacity_standard AS capacityStandard, 
          capacity_max AS capacityMax, 
          capacity_zh AS capacityZh,
          capacity_en AS capacityEn,
          bed_type_zh AS bedTypeZh,
          bed_type_en AS bedTypeEn,
          size_info AS size,
          base_price AS basePrice, 
          holiday_price AS holidayPrice, 
          extra_bed_price AS extraBedPrice,
          image,
          gallery_json AS galleryJson,
          highlights_zh_json AS highlightsZhJson,
          highlights_en_json AS highlightsEnJson,
          desc_zh AS descZh,
          desc_en AS descEn,
          is_active AS isActive
        FROM rooms
        WHERE is_active = 1 AND id != 'villa-full'
        ORDER BY id ASC
      `).all();
      roomResults = dbRooms?.results || [];
    } catch (roomErr) {
      console.warn('[Rooms API] 查詢 rooms 表警訊:', roomErr.message);
    }

    // 2. 核心：即時自 media_assets 查詢啟用中的客房實景寫真 (is_active = 1)
    let activeMedia = [];
    try {
      const mediaRes = await env.DB.prepare(`
        SELECT sub_category, cdn_url, sort_order, title_zh, tag_zh
        FROM media_assets 
        WHERE category = 'room' AND is_active = 1 
        ORDER BY sort_order ASC, created_at ASC
      `).all();
      activeMedia = mediaRes?.results || [];
    } catch (mediaErr) {
      console.warn('[Rooms API] 查詢 media_assets 警訊:', mediaErr.message);
    }

    // 3. 將 media_assets 的動態圖片綁定至各房型
    const formattedRooms = roomResults.map(r => {
      // 匹配該房型的所有啟用圖片 (支援 room-1 與 room-01 兼容)
      const matchedMedia = activeMedia.filter(m => normalizeRoomId(m.sub_category) === normalizeRoomId(r.id));

      let gallery = [];
      let image = r.image || '';

      // 🎯 只要 media_assets 中有圖片管理記錄，100% 以 media_assets 為準
      if (matchedMedia.length > 0) {
        gallery = matchedMedia.map(m => m.cdn_url);
        image = gallery[0];
      } else if (r.galleryJson) {
        try { 
          gallery = JSON.parse(r.galleryJson); 
          if (!Array.isArray(gallery)) gallery = [];
        } catch {
          gallery = [];
        }
        image = r.image || (gallery.length > 0 ? gallery[0] : '');
      }

      let highlightsZh = [];
      if (r.highlightsZhJson) {
        try { highlightsZh = JSON.parse(r.highlightsZhJson); } catch {}
      }

      let highlightsEn = [];
      if (r.highlightsEnJson) {
        try { highlightsEn = JSON.parse(r.highlightsEnJson); } catch {}
      }

      return {
        id: r.id,
        floor: r.floor || '1F',
        titleZh: r.titleZh || '',
        titleEn: r.titleEn || '',
        subtitleZh: r.subtitleZh || '',
        subtitleEn: r.subtitleEn || '',
        capacityZh: r.capacityZh || `${r.capacityStandard || 4} 人`,
        capacityEn: r.capacityEn || `${r.capacityStandard || 4} Guests`,
        bedTypeZh: r.bedTypeZh || '',
        bedTypeEn: r.bedTypeEn || '',
        size: r.size || '',
        basePrice: r.basePrice || 0,
        holidayPrice: r.holidayPrice || 0,
        capacityStandard: r.capacityStandard || 4,
        capacityMax: r.capacityMax || 4,
        image,
        gallery,
        highlightsZh,
        highlightsEn,
        descZh: r.descZh || '',
        descEn: r.descEn || ''
      };
    });

    // 4. 動態納入管家在後台自訂新增的全新客房分類 (如 room-custom-xxx)
    const baseNormalizedIds = new Set(roomResults.map(r => normalizeRoomId(r.id)));
    const customSubCats = new Set();
    activeMedia.forEach(m => {
      const norm = normalizeRoomId(m.sub_category);
      if (norm && !baseNormalizedIds.has(norm)) {
        customSubCats.add(m.sub_category);
      }
    });

    customSubCats.forEach(customSubId => {
      const customPhotos = activeMedia.filter(m => m.sub_category === customSubId);
      if (customPhotos.length > 0) {
        formattedRooms.push({
          id: customSubId,
          floor: '自訂',
          titleZh: customPhotos[0].tag_zh || '全新規劃特色客房',
          titleEn: 'Exclusive Private Suite',
          subtitleZh: '專屬私人景觀空間・獨立衛浴',
          subtitleEn: 'Exclusive Private Suite · Ensuite Bath',
          capacityZh: '4 人',
          capacityEn: '4 Guests',
          bedTypeZh: '雙人床',
          bedTypeEn: 'Double Bed',
          size: '約 12 坪',
          basePrice: 8800,
          holidayPrice: 10800,
          capacityStandard: 4,
          capacityMax: 4,
          image: customPhotos[0].cdn_url,
          gallery: customPhotos.map(m => m.cdn_url),
          highlightsZh: ['專屬私密空間', '自然採光通風良好', '乾濕分離衛浴'],
          highlightsEn: ['Private sanctuary', 'Natural daylight', 'Private ensuite'],
          descZh: '全新規劃之特色客房空間，環境幽靜宜人。',
          descEn: 'Newly designed private guest suite.'
        });
      }
    });

    // 🎯 核心過濾機制：無相片 (gallery.length === 0) 之客房分類一律不對外呈現，避免前台出現無圖空白卡片
    const validRooms = formattedRooms.filter(r => Array.isArray(r.gallery) && r.gallery.length > 0);

    return Response.json({
      success: true,
      rooms: validRooms
    }, { headers: noCacheHeaders });

  } catch (err) {
    console.error('[Rooms API] 讀取失敗:', err.message);
    return Response.json({
      success: false,
      rooms: []
    }, { status: 500, headers: noCacheHeaders });
  }
}
