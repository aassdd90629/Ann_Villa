/**
 * GET /api/availability - 取得已被佔用與保留的房態檔期
 * 
 * 整合：
 * 1. availability_blocks (Airbnb iCal 同步 + 手動關閉)
 * 2. bookings (官網尚未取消的正式/待確認預訂)
 * 
 * 特色：
 * - 具備邊緣自動定時重新拉取機制 (Auto-Sync)：若資料庫無 Airbnb 檔期或距上次同步超過 15 分鐘，
 *   自動透過 Cloudflare Pages 邊緣非同步拉取最新 Airbnb iCal 訂閱，保持房態 100% 同步！
 */
import { syncAirbnbCalendar } from './sync-ical.js';

export async function onRequestGet(context) {
  const { env, waitUntil } = context;

  try {
    if (!env.DB) {
      return Response.json({
        success: false,
        message: '資料庫尚未綁定 (env.DB not found)'
      }, { status: 500 });
    }

    // 自動同步檢測：目前先將 Airbnb 匯入月曆暫停 (改為後台管家自主關閉月曆管理)
    const ENABLE_AIRBNB_SYNC = false;
    const hasValidUrl = ENABLE_AIRBNB_SYNC && env.AIRBNB_ICAL_URL && !env.AIRBNB_ICAL_URL.includes('xxxx.ics');
    if (hasValidUrl) {
      try {
        const countRow = await env.DB.prepare(`
          SELECT count(*) as count FROM availability_blocks WHERE source = 'AIRBNB'
        `).first();
        const airbnbCount = countRow ? countRow.count : 0;

        if (airbnbCount === 0) {
          // 資料庫尚無任何 Airbnb 紀錄，首次加載時即時同步
          await syncAirbnbCalendar(env);
        } else {
          // 資料庫已有資料，檢查距離上次同步是否已超過 15 分鐘
          const lastLog = await env.DB.prepare(`
            SELECT executed_at FROM sync_logs WHERE channel = 'AIRBNB' AND status = 'SUCCESS' ORDER BY id DESC LIMIT 1
          `).first();

          const shouldRefresh = !lastLog || !lastLog.executed_at || 
            (Date.now() - new Date(lastLog.executed_at + 'Z').getTime() > 15 * 60 * 1000);

          if (shouldRefresh && typeof waitUntil === 'function') {
            // 背景非同步更新，不阻塞當次 HTTP 回應
            waitUntil(syncAirbnbCalendar(env).catch(e => {
              console.warn('[Availability] 背景同步 Airbnb 失敗:', e.message);
            }));
          }
        }
      } catch (syncErr) {
        // 同步過程異常不中斷主查詢，平滑退回讀取既有 D1 記錄
        console.warn('[Availability] 自動同步檢測略過:', syncErr.message);
      }
    }

    // 查詢今天 (含) 以後所有已佔用的區間
    const query = `
      SELECT 
        start_date AS startDate, 
        end_date AS endDate, 
        source, 
        summary,
        CASE 
          WHEN LOWER(summary) LIKE '%reserved%' THEN 'reserved' 
          ELSE 'blocked' 
        END AS type,
        'confirmed' AS status,
        external_uid AS uid
      FROM availability_blocks
      WHERE end_date >= DATE('now')
      
      UNION ALL
      
      SELECT 
        check_in AS startDate, 
        check_out AS endDate, 
        'DIRECT_BOOKING' AS source, 
        '官網直訂單' AS summary,
        'reserved' AS type,
        status,
        id AS uid
      FROM bookings
      WHERE check_out >= DATE('now') AND status != 'CANCELLED'
      
      ORDER BY startDate ASC
    `;

    const { results } = await env.DB.prepare(query).all();

    return Response.json({
      success: true,
      total: results.length,
      bookedRanges: results,
      lastSyncedAt: new Date().toISOString()
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=60' // 邊緣節點快取 60 秒
      }
    });
  } catch (err) {
    return Response.json({
      success: false,
      error: err.message
    }, { status: 500 });
  }
}
