/**
 * GET /api/availability - 取得已被佔用與保留的房態檔期
 * 
 * 整合：
 * 1. availability_blocks (管家自主關閉與外部保留)
 * 2. bookings (官網尚未取消的正式/待確認預訂)
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

    // 查詢今天 (含) 以後所有已佔用的區間
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
        external_uid AS uid
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
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (err) {
    return Response.json({
      success: false,
      error: err.message
    }, { status: 500 });
  }
}
