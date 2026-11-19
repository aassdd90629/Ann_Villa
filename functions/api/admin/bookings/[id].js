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

    // 寫入審計日誌
    try {
      const currentAdmin = context.data?.adminUser;
      const operatorTag = currentAdmin?.displayName 
        ? `${currentAdmin.displayName} (${currentAdmin.username})` 
        : 'admin';

      const isDepositPaid = depositStatus === 'PAID' && existing.deposit_status !== 'PAID';
      const actionName = isDepositPaid ? 'CONFIRM_DEPOSIT' : 'UPDATE_BOOKING';
      const summaryText = isDepositPaid
        ? `核銷直訂單「${bookingId}」50% 定金入帳，定金狀態變更為【已付定金 (PAID)】`
        : `更新直訂單「${bookingId}」狀態：定金狀態【${newDepositStatus}】、訂單狀態【${newStatus}】`;

      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('booking', ?, ?, ?, ?, ?)
      `).bind(
        actionName,
        bookingId,
        summaryText,
        JSON.stringify({ oldDepositStatus: existing.deposit_status, newDepositStatus, oldStatus: existing.status, newStatus }),
        operatorTag
      ).run();
    } catch (logErr) {
      console.warn('寫入 booking audit log 警告:', logErr.message);
    }

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

