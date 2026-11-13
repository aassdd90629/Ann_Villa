/**
 * GET /api/rooms - 取得所有房型與定價資訊
 */
export async function onRequestGet(context) {
  const { env } = context;

  try {
    if (!env.DB) {
      return Response.json({ success: false, message: 'DB not bound' }, { status: 500 });
    }

    const { results } = await env.DB.prepare(`
      SELECT 
        id, 
        name, 
        subtitle, 
        base_price AS basePrice, 
        holiday_price AS holidayPrice, 
        capacity_standard AS capacityStandard, 
        capacity_max AS capacityMax, 
        extra_bed_price AS extraBedPrice,
        is_active AS isActive
      FROM rooms
      WHERE is_active = 1
      ORDER BY id ASC
    `).all();

    return Response.json({
      success: true,
      rooms: results
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300'
      }
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

