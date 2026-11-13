/**
 * PATCH /api/admin/bookings/:id
 * 
 * 修改訂單狀態 (例如定金核銷 PAID、訂單確認 CONFIRMED 或 CANCELLED)
 * 遵守後端規範：嚴格使用 env.DB.prepare(...).bind(...)
 */
export async function onRequestPatch(context) {
  const { params, request, env } = context;
  const bookingId = params.id;

  if (!env.DB) {
    return Response.json({ success: false, message: 'DB not bound' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { depositStatus, status } = body;

    // 檢查訂單是否存在
    const existing = await env.DB.prepare(
      'SELECT id, deposit_status, status FROM bookings WHERE id = ?'
    ).bind(bookingId).first();

    if (!existing) {
      return Response.json(
        { success: false, message: '找不到該筆訂單編號: ' + bookingId },
        { status: 404 }
      );
    }

    const newDepositStatus = depositStatus || existing.deposit_status;
    const newStatus = status || existing.status;

    await env.DB.prepare(`
      UPDATE bookings 
      SET deposit_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(newDepositStatus, newStatus, bookingId).run();

    return Response.json({
      success: true,
      message: '訂單狀態更新成功',
      bookingId,
      depositStatus: newDepositStatus,
      status: newStatus
    });

  } catch (err) {
    return Response.json(
      { success: false, message: '更新訂單狀態失敗: ' + err.message },
      { status: 500 }
    );
  }
}

