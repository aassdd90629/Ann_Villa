/**
 * functions/api/admin/pricing.js
 * 
 * GET /api/admin/pricing - 管理員讀取完整定價與連假列表
 * PUT /api/admin/pricing - 管理員儲存定價設定與連假更新
 * 
 * 核心安全與自動容錯：
 * 1. 內建自動建表 (Self-Healing / Ensure Tables)，若表尚未建立自動初始化
 * 2. 受 api/admin/_middleware.js JWT 守門保護
 * 3. 所有 SQL 嚴格使用參數化 .bind(...)
 */

const DEFAULT_HOLIDAYS = [
  { id: 'h-2026-xmas', nameZh: '2026 聖誕節連假', nameEn: '2026 Christmas Holiday', startDate: '2026-12-24', endDate: '2026-12-27', price: 47000, hasBreakfast: 1, noteZh: '含精緻手作早餐', sortOrder: 1 },
  { id: 'h-2026-nye', nameZh: '2026 跨年假期', nameEn: "2026 New Year's Eve", startDate: '2026-12-31', endDate: '2027-01-01', price: 47000, hasBreakfast: 1, noteZh: '含精緻手作早餐', sortOrder: 2 },
  { id: 'h-2027-ny', nameZh: '2027 元旦連假', nameEn: '2027 New Year Holiday', startDate: '2027-01-01', endDate: '2027-01-03', price: 47000, hasBreakfast: 1, noteZh: '含精緻手作早餐', sortOrder: 3 },
  { id: 'h-2027-cny', nameZh: '2027 農曆春節過年連假', nameEn: '2027 Lunar New Year Holiday', startDate: '2027-02-04', endDate: '2027-02-10', price: 50000, hasBreakfast: 0, noteZh: '春節期間不提供早餐', sortOrder: 4 },
  { id: 'h-2027-228', nameZh: '2027 和平紀念日連假', nameEn: '2027 Peace Memorial Day Holiday', startDate: '2027-02-26', endDate: '2027-03-01', price: 38000, hasBreakfast: 1, noteZh: '含精緻手作早餐', sortOrder: 5 },
  { id: 'h-2027-tomb', nameZh: '2027 清明與兒童連假', nameEn: "2027 Children's & Tomb Sweeping Day", startDate: '2027-04-02', endDate: '2027-04-06', price: 38000, hasBreakfast: 1, noteZh: '含精緻手作早餐', sortOrder: 6 },
  { id: 'h-2027-labor', nameZh: '2027 五一勞動節連假', nameEn: '2027 Labor Day Holiday', startDate: '2027-04-29', endDate: '2027-05-02', price: 38000, hasBreakfast: 1, noteZh: '含精緻手作早餐', sortOrder: 7 },
  { id: 'h-2027-dragon', nameZh: '2027 端午連假', nameEn: '2027 Dragon Boat Festival Holiday', startDate: '2027-06-08', endDate: '2027-06-09', price: 35000, hasBreakfast: 1, noteZh: '含精緻手作早餐', sortOrder: 8 },
  { id: 'h-2027-moon', nameZh: '2027 中秋連假', nameEn: '2027 Mid-Autumn Festival Holiday', startDate: '2027-09-14', endDate: '2027-09-15', price: 35000, hasBreakfast: 1, noteZh: '含精緻手作早餐', sortOrder: 9 },
  { id: 'h-2027-teacher', nameZh: '2027 教師節連假', nameEn: "2027 Teachers' Day Holiday", startDate: '2027-09-27', endDate: '2027-09-28', price: 35000, hasBreakfast: 1, noteZh: '含精緻手作早餐', sortOrder: 10 },
  { id: 'h-2027-national', nameZh: '2027 雙十國慶連假', nameEn: '2027 National Day Holiday', startDate: '2027-10-08', endDate: '2027-10-11', price: 38000, hasBreakfast: 1, noteZh: '含精緻手作早餐', sortOrder: 11 },
  { id: 'h-2027-retro', nameZh: '2027 光復節連假', nameEn: '2027 Retrocession Day Holiday', startDate: '2027-10-22', endDate: '2027-10-25', price: 38000, hasBreakfast: 1, noteZh: '含精緻手作早餐', sortOrder: 12 },
  { id: 'h-2027-xmas', nameZh: '2027 聖誕連假', nameEn: '2027 Christmas Holiday', startDate: '2027-12-23', endDate: '2027-12-26', price: 47000, hasBreakfast: 1, noteZh: '含精緻手作早餐', sortOrder: 13 },
  { id: 'h-2028-ny', nameZh: '2028 跨年元旦連假', nameEn: "2028 New Year's Eve & New Year Holiday", startDate: '2027-12-30', endDate: '2028-01-02', price: 47000, hasBreakfast: 1, noteZh: '含精緻手作早餐', sortOrder: 14 }
];

const DEFAULT_PRICING = {
  weekdayTier1: 20000,
  weekdayTier2: 25000,
  weekdayTier3: 30000,
  weekend: 35000,
  deposit: 3000,
  maxCapacity: 18,
  checkInTime: '15:00',
  checkOutTime: '11:00'
};

async function ensureTables(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS pricing_settings (
        setting_key TEXT PRIMARY KEY,
        setting_value TEXT NOT NULL,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS holiday_rates (
        id TEXT PRIMARY KEY,
        name_zh TEXT NOT NULL,
        name_en TEXT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        price INTEGER NOT NULL,
        has_breakfast INTEGER DEFAULT 1,
        note_zh TEXT,
        note_en TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 檢查是否已有通用設定，若無則注入初始種子
    const countRes = await db.prepare('SELECT COUNT(*) AS c FROM pricing_settings').first();
    if (!countRes || countRes.c === 0) {
      const initSettings = [
        ['weekday_tier1_price', '20000', '平日 10人以下每晚價格'],
        ['weekday_tier2_price', '25000', '平日 11-14人每晚價格'],
        ['weekday_tier3_price', '30000', '平日 15-18人每晚價格'],
        ['weekend_price', '35000', '一般假日 (週五至週日) 每晚價格'],
        ['deposit_amount', '3000', '現場入住押金'],
        ['max_capacity', '18', '全區最高容納人數'],
        ['check_in_time', '15:00', '入住時間'],
        ['check_out_time', '11:00', '退房時間']
      ];
      for (const [k, v, d] of initSettings) {
        await db.prepare('INSERT OR IGNORE INTO pricing_settings (setting_key, setting_value, description) VALUES (?, ?, ?)').bind(k, v, d).run();
      }
    }

    // 檢查是否已有連假，若無則注入初始種子
    const hCountRes = await db.prepare('SELECT COUNT(*) AS c FROM holiday_rates').first();
    if (!hCountRes || hCountRes.c === 0) {
      for (const h of DEFAULT_HOLIDAYS) {
        await db.prepare(`
          INSERT OR IGNORE INTO holiday_rates (id, name_zh, name_en, start_date, end_date, price, has_breakfast, note_zh, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(h.id, h.nameZh, h.nameEn, h.startDate, h.endDate, h.price, h.hasBreakfast, h.noteZh, h.sortOrder).run();
      }
    }
  } catch (e) {
    console.error('ensureTables failed:', e);
  }
}

export async function onRequestGet(context) {
  const { env } = context;

  try {
    if (!env.DB) {
      return Response.json({
        success: true,
        pricing: DEFAULT_PRICING,
        holidays: DEFAULT_HOLIDAYS
      });
    }

    // 自動建表與初始化種子
    await ensureTables(env.DB);

    const settingsRows = await env.DB.prepare('SELECT setting_key, setting_value FROM pricing_settings').all();
    const settingsMap = {};
    if (settingsRows && settingsRows.results) {
      for (const row of settingsRows.results) {
        settingsMap[row.setting_key] = row.setting_value;
      }
    }

    const holidaysRows = await env.DB.prepare(`
      SELECT 
        id, 
        name_zh AS nameZh, 
        name_en AS nameEn, 
        start_date AS startDate, 
        end_date AS endDate, 
        price, 
        has_breakfast AS hasBreakfast, 
        note_zh AS noteZh,
        sort_order AS sortOrder,
        is_active AS isActive
      FROM holiday_rates 
      ORDER BY sort_order ASC, start_date ASC
    `).all();

    const holidaysList = holidaysRows && holidaysRows.results && holidaysRows.results.length > 0
      ? holidaysRows.results
      : DEFAULT_HOLIDAYS;

    return Response.json({
      success: true,
      pricing: {
        weekdayTier1: Number(settingsMap.weekday_tier1_price) || DEFAULT_PRICING.weekdayTier1,
        weekdayTier2: Number(settingsMap.weekday_tier2_price) || DEFAULT_PRICING.weekdayTier2,
        weekdayTier3: Number(settingsMap.weekday_tier3_price) || DEFAULT_PRICING.weekdayTier3,
        weekend: Number(settingsMap.weekend_price) || DEFAULT_PRICING.weekend,
        deposit: Number(settingsMap.deposit_amount) || DEFAULT_PRICING.deposit,
        maxCapacity: Number(settingsMap.max_capacity) || DEFAULT_PRICING.maxCapacity,
        checkInTime: settingsMap.check_in_time || DEFAULT_PRICING.checkInTime,
        checkOutTime: settingsMap.check_out_time || DEFAULT_PRICING.checkOutTime
      },
      holidays: holidaysList
    });

  } catch (err) {
    // 優雅降級回傳預設值，保證前端畫面永遠可用
    return Response.json({
      success: true,
      pricing: DEFAULT_PRICING,
      holidays: DEFAULT_HOLIDAYS,
      warning: err.message
    });
  }
}

export async function onRequestPut(context) {
  const { env, request } = context;

  try {
    if (!env.DB) {
      return Response.json({ success: false, message: 'DB not bound' }, { status: 500 });
    }

    // 自動確保資料表存在
    await ensureTables(env.DB);

    const body = await request.json();
    const { pricing, holidays } = body;

    // 1. 批量更新 pricing_settings
    if (pricing) {
      const updates = [
        ['weekday_tier1_price', String(pricing.weekdayTier1 || 20000)],
        ['weekday_tier2_price', String(pricing.weekdayTier2 || 25000)],
        ['weekday_tier3_price', String(pricing.weekdayTier3 || 30000)],
        ['weekend_price', String(pricing.weekend || 35000)],
        ['deposit_amount', String(pricing.deposit || 3000)],
        ['max_capacity', String(pricing.maxCapacity || 18)]
      ];

      for (const [key, val] of updates) {
        await env.DB.prepare(`
          INSERT INTO pricing_settings (setting_key, setting_value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(setting_key) DO UPDATE SET
            setting_value = excluded.setting_value,
            updated_at = CURRENT_TIMESTAMP
        `).bind(key, val).run();
      }
    }

    // 2. 批量更新 holiday_rates (若有傳入)
    if (Array.isArray(holidays)) {
      for (let i = 0; i < holidays.length; i++) {
        const h = holidays[i];
        if (!h.id || !h.nameZh || !h.startDate || !h.endDate || !h.price) continue;

        await env.DB.prepare(`
          INSERT INTO holiday_rates (
            id, name_zh, name_en, start_date, end_date, price, 
            has_breakfast, note_zh, sort_order, is_active, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET
            name_zh = excluded.name_zh,
            name_en = excluded.name_en,
            start_date = excluded.start_date,
            end_date = excluded.end_date,
            price = excluded.price,
            has_breakfast = excluded.has_breakfast,
            note_zh = excluded.note_zh,
            sort_order = excluded.sort_order,
            is_active = excluded.is_active,
            updated_at = CURRENT_TIMESTAMP
        `).bind(
          h.id,
          h.nameZh,
          h.nameEn || '',
          h.startDate,
          h.endDate,
          Number(h.price),
          h.hasBreakfast ? 1 : 0,
          h.noteZh || '',
          i + 1,
          h.isActive !== false ? 1 : 0
        ).run();
      }
    }

    // 3. 寫入審計操作日誌 (Audit Log)
    try {
      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('pricing', 'UPDATE_PRICING', 'pricing_settings', ?, ?, 'admin')
      `).bind(
        `更新全區包棟房價政策：平日（${pricing?.weekdayTier1 || 20000}/${pricing?.weekdayTier2 || 25000}/${pricing?.weekdayTier3 || 30000}）、一般假日（${pricing?.weekend || 35000}），連假檔期（共 ${holidays?.length || 0} 組）`,
        JSON.stringify({ pricing, holidayCount: holidays?.length || 0 })
      ).run();
    } catch (logErr) {
      console.warn('寫入 pricing audit log 警告:', logErr.message);
    }

    return Response.json({
      success: true,
      message: '全站定價政策與國定連續假期設定已成功儲存！'
    });

  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
