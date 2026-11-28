/**
 * functions/api/media.js
 * 
 * GET /api/media - 前台讀取全站圖片與輪播媒體資產 (100% 資料庫驅動)
 * 支援參數：?category=hero / room / facility
 * 
 * 核心特色：
 * 1. 優先自 D1 media_assets 表讀取啟用中 (is_active = 1) 圖片
 * 2. 嚴格按 sort_order 排序
 * 3. 具備 Graceful Fallback：若 D1 離線或尚未遷移，自動回傳內建預設輪播大圖
 */

const DEFAULT_HERO_SLIDES = [
  { id: 'slide-1', image: '/img/homebanner/homebanner-01.webp', titleZh: '星夜璀璨・豪宅山莊', titleEn: 'Luminous Nightscape Estate', tagZh: '莊園夜色', tagEn: 'Villa Nightscape', alt: '山語 Villa 豪宅山莊夜景' },
  { id: 'slide-2', image: '/img/homebanner/homebanner-02.webp', titleZh: '露台晨曦・漫步雲海仙境', titleEn: 'Panoramic Viewing Deck & Morning Mist', tagZh: '觀景露台雲海', tagEn: 'Viewing Deck Vista', alt: '山語 Villa 觀景露台眺望壯闊雲海' },
  { id: 'slide-3', image: '/img/homebanner/homebanner-03.webp', titleZh: '群山環繞・自然田園風光', titleEn: 'Scenic Mountain Countryside', tagZh: '自然景致', tagEn: 'Nature & Orchard', alt: '山語 Villa 周邊自然景致' },
  { id: 'slide-4', image: '/img/homebanner/homebanner-04.webp', titleZh: '山嵐漫漫・壯闊縹緲雲海', titleEn: 'Sea of Clouds & Mountain Mist', tagZh: '壯闊雲海', tagEn: 'Sea of Clouds', alt: '山語 Villa 雲海繚繞絕景' },
  { id: 'slide-5', image: '/img/homebanner/homebanner-05.webp', titleZh: '開闊綠意・專屬青翠草坪', titleEn: 'Expansive Private Green Lawn', tagZh: '戶外休閒草坪', tagEn: 'Private Lawn', alt: '山語 Villa 綠意庭園草坪' },
  { id: 'slide-6', image: '/img/homebanner/homebanner-06.webp', titleZh: '晚霞如畫・落日彩霞暮色', titleEn: 'Twilight Glow & Crimson Sunset', tagZh: '落日彩霞', tagEn: 'Sunset Twilight', alt: '山語 Villa 傍晚夕陽滿天彩霞' },
  { id: 'slide-7', image: '/img/homebanner/homebanner-07.webp', titleZh: '夜色微光・漫步翠綠草坡', titleEn: 'Illuminated Gardens & Hillside Lawn', tagZh: '草坡夜間光影', tagEn: 'Night Garden Lights', alt: '山語 Villa 夜間莊園草坡與暖光造景' },
  { id: 'slide-8', image: '/img/homebanner/homebanner-08.webp', titleZh: '半戶外露台・品茗眺望群山', titleEn: 'Covered Viewing Terrace & Tea Lounge', tagZh: '戶外景觀座席', tagEn: 'Scenic Tea Terrace', alt: '山語 Villa 半戶外景觀座席眺望群山' },
  { id: 'slide-9', image: '/img/homebanner/homebanner-09.webp', titleZh: '氣派迴廊・開闊休閒木棧平台', titleEn: 'Expansive Veranda & Timber Deck', tagZh: '莊園景觀迴廊', tagEn: 'Grand Veranda & Deck', alt: '山語 Villa 寬闊景觀迴廊與戶外木棧平台' },
  { id: 'slide-10', image: '/img/homebanner/homebanner-10.webp', titleZh: '晴空莊園・石砌門廊與翠綠庭園', titleEn: 'Sunlit Stone Veranda & Garden Patio', tagZh: '晴日莊園外觀', tagEn: 'Sunny Estate Exterior', alt: '山語 Villa 晴空下石砌外觀迴廊與戶外庭園草坪' },
  { id: 'slide-11', image: '/img/homebanner/homebanner-11.webp', titleZh: '晴日木棧露台・石柱長廊遠眺群巒', titleEn: 'Sunlit Timber Deck & Mountain Corridor', tagZh: '晴空觀景長廊', tagEn: 'Sunlit Veranda Deck', alt: '山語 Villa 晴空下寬敞木棧觀景露台與石柱長廊' }
];

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const reqCategory = url.searchParams.get('category');

  const fallbackResult = {
    success: true,
    hero: DEFAULT_HERO_SLIDES.map((s, i) => ({
      id: s.id,
      titleZh: s.titleZh,
      titleEn: s.titleEn,
      tagZh: s.tagZh,
      tagEn: s.tagEn,
      cdnUrl: s.image,
      sortOrder: i + 1,
      isActive: true
    })),
    room: [],
    facility: []
  };

  if (!env || !env.DB) {
    return Response.json(fallbackResult);
  }

  try {
    let query = `
      SELECT id, category, sub_category, title_zh, title_en, tag_zh, tag_en, r2_key, cdn_url, thumbnail_url, file_size, width, height, sort_order, is_active
      FROM media_assets
      WHERE is_active = 1
    `;
    const params = [];

    if (reqCategory) {
      query += ` AND category = ?`;
      params.push(reqCategory);
    }

    query += ` ORDER BY sort_order ASC, created_at ASC`;

    const { results } = await env.DB.prepare(query).bind(...params).all();

    if (!results || results.length === 0) {
      return Response.json(fallbackResult);
    }

    const hero = [];
    const room = [];
    const facility = [];

    for (const item of results) {
      const asset = {
        id: item.id,
        category: item.category,
        subCategory: item.sub_category,
        titleZh: item.title_zh,
        titleEn: item.title_en || item.title_zh,
        tagZh: item.tag_zh || '',
        tagEn: item.tag_en || '',
        r2Key: item.r2_key,
        cdnUrl: item.cdn_url,
        thumbnailUrl: item.thumbnail_url || item.cdn_url,
        width: item.width,
        height: item.height,
        sortOrder: item.sort_order,
        isActive: Boolean(item.is_active)
      };

      if (item.category === 'hero') hero.push(asset);
      else if (item.category === 'room') room.push(asset);
      else if (item.category === 'facility') facility.push(asset);
    }

    return Response.json({
      success: true,
      hero: hero.length > 0 ? hero : fallbackResult.hero,
      room,
      facility
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (err) {
    console.warn('[Media API] D1 查詢失敗，切換為預設資源:', err.message);
    return Response.json(fallbackResult);
  }
}
