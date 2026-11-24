/**
 * PATCH /api/admin/bookings/:id
 * 
 * 修改訂單狀態與資料 (例如取消訂單 CANCELLED、恢復訂單 CONFIRMED、定金核銷 PAID、修改備註與旅客資訊)
 * 遵守後端規範：嚴格使用 env.DB.prepare(...).bind(...) 參數化綁定
 */
export async function onRequestPatch(context) {
  const { params, request, env } = context;
  const bookingId = params.id;

  if (!env.DB) {
    return Response.json({ success: false, message: 'DB not bound' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const {
      depositStatus,
      status,
      guestName,
      guestPhone,
      guestEmail,
      lineId,
      guestCount,
      specialRequests
    } = body;

    // 檢查訂單是否存在
    const existing = await env.DB.prepare(
      `SELECT 
        id, deposit_status, status, guest_name, guest_phone, guest_email, line_id, guest_count, special_requests, check_in, check_out 
       FROM bookings WHERE id = ?`
    ).bind(bookingId).first();

    if (!existing) {
      return Response.json(
        { success: false, message: '找不到該筆訂單編號: ' + bookingId },
        { status: 404 }
      );
    }

    const newDepositStatus = depositStatus !== undefined ? depositStatus : existing.deposit_status;
    const newStatus = status !== undefined ? status : existing.status;
    const newGuestName = guestName !== undefined ? String(guestName).trim() : existing.guest_name;
    const newGuestPhone = guestPhone !== undefined ? String(guestPhone).trim() : existing.guest_phone;
    const newGuestEmail = guestEmail !== undefined ? String(guestEmail).trim() : existing.guest_email;
    const newLineId = lineId !== undefined ? String(lineId).trim() : existing.line_id;
    const newGuestCount = guestCount !== undefined ? Number(guestCount) : existing.guest_count;
    const newSpecialRequests = specialRequests !== undefined ? String(specialRequests).trim() : existing.special_requests;

    await env.DB.prepare(`
      UPDATE bookings 
      SET 
        deposit_status = ?, 
        status = ?, 
        guest_name = ?,
        guest_phone = ?,
        guest_email = ?,
        line_id = ?,
        guest_count = ?,
        special_requests = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      newDepositStatus,
      newStatus,
      newGuestName,
      newGuestPhone,
      newGuestEmail,
      newLineId,
      newGuestCount,
      newSpecialRequests,
      bookingId
    ).run();

    // 寫入審計日誌
    try {
      const currentAdmin = context.data?.adminUser;
      const operatorTag = currentAdmin?.displayName 
        ? `${currentAdmin.displayName} (${currentAdmin.username})` 
        : 'admin';

      let actionName = 'UPDATE_BOOKING';
      let summaryText = `更新直訂單「${bookingId}」資料`;

      if (newStatus === 'CANCELLED' && existing.status !== 'CANCELLED') {
        actionName = 'CANCEL_BOOKING';
        summaryText = `管家取消直訂單「${bookingId}」（旅客：${newGuestName}，檔期：${existing.check_in} ~ ${existing.check_out}），房態已釋放為空房`;
      } else if (newStatus === 'CONFIRMED' && existing.status === 'CANCELLED') {
        actionName = 'RESTORE_BOOKING';
        summaryText = `管家重新恢復直訂單「${bookingId}」（旅客：${newGuestName}）為已確認狀態`;
      } else if (depositStatus === 'PAID' && existing.deposit_status !== 'PAID') {
        actionName = 'CONFIRM_DEPOSIT';
        summaryText = `核銷直訂單「${bookingId}」50% 定金入帳，定金狀態變更為【已付定金 (PAID)】`;
      }

      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('booking', ?, ?, ?, ?, ?)
      `).bind(
        actionName,
        bookingId,
        summaryText,
        JSON.stringify({
          oldStatus: existing.status,
          newStatus,
          oldDepositStatus: existing.deposit_status,
          newDepositStatus,
          guestName: newGuestName,
          guestPhone: newGuestPhone
        }),
        operatorTag
      ).run();
    } catch (logErr) {
      console.warn('寫入 booking audit log 警告:', logErr.message);
    }

    return Response.json({
      success: true,
      message: newStatus === 'CANCELLED' ? '訂單已成功取消，房態檔期已即刻釋放！' : '訂單資料與狀態更新成功',
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
