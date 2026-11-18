/**
 * functions/api/pricing.js
 * 
 * GET /api/pricing - 前台讀取全站最新動態定價與國定連假表
 * 
 * 核心機制：
 * 1. 優先自 Cloudflare D1 (pricing_settings 與 holiday_rates) 讀取最新設定
 * 2. 若無資料、表尚未建立或離線時，自動回傳預設之備援定價 (Graceful Fallback)，絕不噴錯
 * 3. 支援前台雙語與邊緣 CDN 快取
 */

const DEFAULT_SETTINGS = {
  weekdayTier1: 20000,
  weekdayTier2: 25000,
  weekdayTier3: 30000,
  weekend: 35000,
  deposit: 3000,
  maxCapacity: 18,
  checkInTime: '15:00',
  checkOutTime: '11:00'
};

const DEFAULT_HOLIDAYS = [
  { id: 'h-2026-xmas', nameZh: '2026 聖誕節連假', nameEn: '2026 Christmas Holiday', startDate: '2026-12-24', endDate: '2026-12-27', price: 47000, breakfast: true, noteZh: '含精緻手作早餐' },
  { id: 'h-2026-nye', nameZh: '2026 跨年假期', nameEn: "2026 New Year's Eve", startDate: '2026-12-31', endDate: '2027-01-01', price: 47000, breakfast: true, noteZh: '含精緻手作早餐' },
  { id: 'h-2027-ny', nameZh: '2027 元旦連假', nameEn: '2027 New Year Holiday', startDate: '2027-01-01', endDate: '2027-01-03', price: 47000, breakfast: true, noteZh: '含精緻手作早餐' },
  { id: 'h-2027-cny', nameZh: '2027 農曆春節過年連假', nameEn: '2027 Lunar New Year Holiday', startDate: '2027-02-04', endDate: '2027-02-10', price: 50000, breakfast: false, noteZh: '春節期間不提供早餐' },
  { id: 'h-2027-228', nameZh: '2027 和平紀念日連假', nameEn: '2027 Peace Memorial Day Holiday', startDate: '2027-02-26', endDate: '2027-03-01', price: 38000, breakfast: true, noteZh: '含精緻手作早餐' },
  { id: 'h-2027-tomb', nameZh: '2027 清明與兒童連假', nameEn: "2027 Children's & Tomb Sweeping Day", startDate: '2027-04-02', endDate: '2027-04-06', price: 38000, breakfast: true, noteZh: '含精緻手作早餐' },
  { id: 'h-2027-labor', nameZh: '2027 五一勞動節連假', nameEn: '2027 Labor Day Holiday', startDate: '2027-04-29', endDate: '2027-05-02', price: 38000, breakfast: true, noteZh: '含精緻手作早餐' },
  { id: 'h-2027-dragon', nameZh: '2027 端午連假', nameEn: '2027 Dragon Boat Festival Holiday', startDate: '2027-06-08', endDate: '2027-06-09', price: 35000, breakfast: true, noteZh: '含精緻手作早餐' },
  { id: 'h-2027-moon', nameZh: '2027 中秋連假', nameEn: '2027 Mid-Autumn Festival Holiday', startDate: '2027-09-14', endDate: '2027-09-15', price: 35000, breakfast: true, noteZh: '含精緻手作早餐' },
  { id: 'h-2027-teacher', nameZh: '2027 教師節連假', nameEn: "2027 Teachers' Day Holiday", startDate: '2027-09-27', endDate: '2027-09-28', price: 35000, breakfast: true, noteZh: '含精緻手作早餐' },
  { id: 'h-2027-national', nameZh: '2027 雙十國慶連假', nameEn: '2027 National Day Holiday', startDate: '2027-10-08', endDate: '2027-10-11', price: 38000, breakfast: true, noteZh: '含精緻手作早餐' },
  { id: 'h-2027-retro', nameZh: '2027 光復節連假', nameEn: '2027 Retrocession Day Holiday', startDate: '2027-10-22', endDate: '2027-10-25', price: 38000, breakfast: true, noteZh: '含精緻手作早餐' },
  { id: 'h-2027-xmas', nameZh: '2027 聖誕連假', nameEn: '2027 Christmas Holiday', startDate: '2027-12-23', endDate: '2027-12-26', price: 47000, breakfast: true, noteZh: '含精緻手作早餐' },
  { id: 'h-2028-ny', nameZh: '2028 跨年元旦連假', nameEn: "2028 New Year's Eve & New Year Holiday", startDate: '2027-12-30', endDate: '2028-01-02', price: 47000, breakfast: true, noteZh: '含精緻手作早餐' }
];

export async function onRequestGet(context) {
  const { env } = context;

  try {
    if (!env.DB) {
      return Response.json({ success: true, settings: DEFAULT_SETTINGS, holidays: DEFAULT_HOLIDAYS });
    }

    const settings = { ...DEFAULT_SETTINGS };
    let holidays = DEFAULT_HOLIDAYS;

    // 1. 查詢通用設定 (容錯)
    try {
      const settingsRows = await env.DB.prepare('SELECT setting_key, setting_value FROM pricing_settings').all();
      if (settingsRows && settingsRows.results) {
        for (const row of settingsRows.results) {
          const k = row.setting_key;
          const v = row.setting_value;
          if (k === 'weekday_tier1_price') settings.weekdayTier1 = Number(v) || settings.weekdayTier1;
          if (k === 'weekday_tier2_price') settings.weekdayTier2 = Number(v) || settings.weekdayTier2;
          if (k === 'weekday_tier3_price') settings.weekdayTier3 = Number(v) || settings.weekdayTier3;
          if (k === 'weekend_price') settings.weekend = Number(v) || settings.weekend;
          if (k === 'deposit_amount') settings.deposit = Number(v) || settings.deposit;
          if (k === 'max_capacity') settings.maxCapacity = Number(v) || settings.maxCapacity;
          if (k === 'check_in_time') settings.checkInTime = v;
          if (k === 'check_out_time') settings.checkOutTime = v;
        }
      }
    } catch {
      // 若資料表尚未建立，優雅使用預設值
    }

    // 2. 查詢連假 (容錯)
    try {
      const holidaysRows = await env.DB.prepare(`
        SELECT 
          id, 
          name_zh AS nameZh, 
          name_en AS nameEn, 
          start_date AS startDate, 
          end_date AS endDate, 
          price, 
          has_breakfast = 1 AS breakfast, 
          note_zh AS noteZh, 
          note_en AS noteEn
        FROM holiday_rates 
        WHERE is_active = 1 
        ORDER BY sort_order ASC, start_date ASC
      `).all();

      if (holidaysRows && holidaysRows.results && holidaysRows.results.length > 0) {
        holidays = holidaysRows.results;
      }
    } catch {
      // 若連假表尚未建立，優雅使用預設值
    }

    return Response.json({
      success: true,
      settings,
      holidays
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=120'
      }
    });

  } catch {
    return Response.json({
      success: true,
      settings: DEFAULT_SETTINGS,
      holidays: DEFAULT_HOLIDAYS
    });
  }
}
