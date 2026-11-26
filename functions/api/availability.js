/**
 * GET /api/availability - 取得已被佔用與保留的房態檔期
 * 
 * 整合：
 * 1. availability_blocks (管家自主關閉與外部保留)
 * 2. bookings (官網尚未取消的正式/待確認預訂)
 * 
 * 核心業務防呆 (P0 等級)：
 * - 自動偵測並釋放超過 24 小時未付定金且未回報匯款之逾期 PENDING 訂單
 * - 即時排除逾期訂單，確保日曆不會因幽靈訂單無端永久反灰
 */
export async function onRequestGet(context) {
  const { env } = context;

  try {
    if (!env.DB) {
      return Response.json({
        success: false,
        message: '資料庫尚未綁定 (env.DB not found)'
      }, { status: 500 });
    }

    // 1. 自動巡檢並釋放超過 24 小時未付定金且未回報末五碼之過期 PENDING 訂單
    try {
      const staleBookings = await env.DB.prepare(`
        SELECT id FROM bookings
        WHERE status = 'PENDING'
          AND (deposit_status IS NULL OR deposit_status = 'UNPAID')
          AND (bank_last_5 IS NULL OR bank_last_5 = '')
          AND created_at <= DATETIME('now', '-24 hours')
      `).all();

      if (staleBookings && staleBookings.results && staleBookings.results.length > 0) {
        for (const stale of staleBookings.results) {
          await env.DB.batch([
            env.DB.prepare("UPDATE bookings SET status = 'CANCELLED', special_requests = COALESCE(special_requests, '') || ' [系統自動逾期釋放：超過24小時未付定金]', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(stale.id),
            env.DB.prepare("DELETE FROM room_daily_inventory WHERE booking_id = ?").bind(stale.id)
          ]);
        }
      }
    } catch (cleanupErr) {
      console.warn('[Availability Stale Cleanup Warning]:', cleanupErr.message);
    }

    // 2. 查詢今天 (含) 以後所有有效佔用的區間 (排除 CANCELLED 及超過 24 小時之逾期未付訂單)
    const query = `
      SELECT 
        id,
        start_date AS startDate, 
        end_date AS endDate, 
        source, 
        summary,
        CASE 
          WHEN LOWER(summary) LIKE '%reserved%' THEN 'reserved' 
          ELSE 'blocked' 
        END AS type,
        'confirmed' AS status,
        external_uid AS uid,
        NULL AS deposit_status,
        NULL AS bank_last_5
      FROM availability_blocks
      WHERE end_date >= DATE('now')
      
      UNION ALL
      
      SELECT 
        id,
        check_in AS startDate, 
        check_out AS endDate, 
        'DIRECT_BOOKING' AS source, 
        '官網直訂單' AS summary,
        'reserved' AS type,
        status,
        id AS uid,
        deposit_status,
        bank_last_5
      FROM bookings
      WHERE check_out >= DATE('now') 
        AND status != 'CANCELLED'
        AND NOT (
          status = 'PENDING'
          AND (deposit_status IS NULL OR deposit_status = 'UNPAID')
          AND (bank_last_5 IS NULL OR bank_last_5 = '')
          AND created_at <= DATETIME('now', '-24 hours')
        )
      
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
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (err) {
    console.error('[Availability API Exception]:', err);
    return Response.json({
      success: false,
      message: '無法取得最新房態資料，請稍後再試。'
    }, { status: 500 });
  }
}
