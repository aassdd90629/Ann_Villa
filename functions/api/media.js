/**
 * functions/api/media.js
 * 
 * GET /api/media - 前台讀取全站圖片與輪播媒體資產
 * 支援參數：?category=hero / room / facility
 * 
 * 核心特色：
 * 1. 優先自 D1 media_assets 表讀取啟用中 (is_active = 1) 圖片
 * 2. 嚴格按 sort_order 排序
 * 3. 具備 Graceful Fallback：若 D1 離線或尚未遷移，自動回傳內建預設輪播大圖
 */

import defaultHeroSlides from '../../src/data/hero-slides.json';

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const reqCategory = url.searchParams.get('category');

  const fallbackResult = {
    success: true,
    hero: defaultHeroSlides.map((s, i) => ({
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

  if (!env.DB) {
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

    for (const r of results) {
      const item = {
        id: r.id,
        category: r.category,
        subCategory: r.sub_category,
        titleZh: r.title_zh,
        titleEn: r.title_en || '',
        tagZh: r.tag_zh || '',
        tagEn: r.tag_en || '',
        cdnUrl: r.cdn_url,
        thumbnailUrl: r.thumbnail_url || r.cdn_url,
        fileSize: r.file_size,
        width: r.width,
        height: r.height,
        sortOrder: r.sort_order,
        isActive: Boolean(r.is_active)
      };

      if (r.category === 'hero') hero.push(item);
      else if (r.category === 'room') room.push(item);
      else if (r.category === 'facility') facility.push(item);
    }

    return Response.json({
      success: true,
      hero: hero.length > 0 ? hero : fallbackResult.hero,
      room,
      facility
    });

  } catch (err) {
    console.warn('[Media API] 查詢異常，切換至靜態備援:', err.message);
    return Response.json(fallbackResult);
  }
}
