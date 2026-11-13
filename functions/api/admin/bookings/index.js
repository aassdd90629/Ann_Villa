/**
 * GET /api/admin/bookings
 * 
 * 取得所有直訂單清單 (依建立時間倒序排序)
 * 遵守後端規範：SQL 參數化查詢、防注入
 */
export async function onRequestGet(context) {
  const { env } = context;

  if (!env.DB) {
    return Response.json({ success: false, message: 'DB not bound' }, { status: 500 });
  }

  try {
    const query = `
      SELECT 
        b.id,
        b.room_id,
        r.name AS room_name,
        b.guest_name,
        b.guest_phone,
        b.guest_email,
        b.line_id,
        b.guest_count,
        b.check_in,
        b.check_out,
        b.nights,
        b.total_amount,
        b.deposit_amount,
        b.deposit_status,
        b.status,
        b.special_requests,
        b.created_at,
        b.updated_at
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      ORDER BY b.created_at DESC
    `;

    const { results } = await env.DB.prepare(query).all();

    return Response.json({
      success: true,
      bookings: results || []
    });
  } catch (err) {
    return Response.json(
      { success: false, message: '查詢訂單列表失敗: ' + err.message },
      { status: 500 }
    );
  }
}
