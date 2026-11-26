/**
 * PATCH /api/admin/bookings/:id
 * 
 * 修改訂單狀態與資料 (例如取消訂單 CANCELLED、恢復訂單 CONFIRMED、定金核銷 PAID、修改備註與旅客資訊)
 * 遵守後端規範：嚴格使用 env.DB.prepare(...).bind(...) 參數化綁定
 * 
 * 核心防呆機制 (P0 級別)：
 * 1. ★ 恢復取消訂單防撞檢驗：若欲由 CANCELLED 恢復為 CONFIRMED/PENDING，強制重新比對檔期重疊衝突！
 * 2. ★ 每日排他庫存同步：取消訂單自動釋放 room_daily_inventory，恢復訂單自動重新鎖定。
 * 3. 完整審計日誌 (admin_audit_logs)。
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
      specialRequests,
      cancelReasonCategory,
      cancelReasonNote,
      refundStatus,
      refundAmount,
      refundReferenceNo,
      refundAdminNote
    } = body;

    // 檢查訂單是否存在
    const existing = await env.DB.prepare(
      `SELECT 
        id, room_id, deposit_status, status, guest_name, guest_phone, guest_email, line_id, guest_count, special_requests, check_in, check_out, cancel_reason_category, cancel_reason_note, refund_status, refund_amount, refund_reference_no, refund_admin_note 
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

    // 取消原因分類處理 (P3 級別)
    let newCancelReasonCategory = existing.cancel_reason_category;
    let newCancelReasonNote = existing.cancel_reason_note;

    if (newStatus === 'CANCELLED') {
      if (cancelReasonCategory !== undefined) newCancelReasonCategory = String(cancelReasonCategory).trim();
      if (cancelReasonNote !== undefined) newCancelReasonNote = String(cancelReasonNote).trim().slice(0, 500);
    } else if (existing.status === 'CANCELLED' && newStatus !== 'CANCELLED') {
      // 恢復訂單時清空取消原因
      newCancelReasonCategory = null;
      newCancelReasonNote = null;
    }

    // 退款狀態與資訊處理
    const newRefundStatus = refundStatus !== undefined ? String(refundStatus).trim() : existing.refund_status;
    const newRefundAmount = refundAmount !== undefined ? Number(refundAmount) : existing.refund_amount;
    const newRefundReferenceNo = refundReferenceNo !== undefined ? String(refundReferenceNo).trim() : existing.refund_reference_no;
    const newRefundAdminNote = refundAdminNote !== undefined ? String(refundAdminNote).trim().slice(0, 500) : existing.refund_admin_note;
    const isNowRefundCompleted = newRefundStatus === 'COMPLETED' && existing.refund_status !== 'COMPLETED';

    const roomId = existing.room_id || 'villa-full';

    // 核心防呆：若從 CANCELLED 欲「恢復訂單」至 CONFIRMED 或 PENDING，強制進行檔期排他衝突檢驗
    if (existing.status === 'CANCELLED' && newStatus !== 'CANCELLED') {
      const conflictQuery = `
        SELECT COUNT(*) AS conflict_count FROM (
          SELECT 1 FROM bookings 
          WHERE room_id = ? 
            AND id != ?
            AND status != 'CANCELLED'
            AND NOT (check_out <= ? OR check_in >= ?)
          UNION ALL
          SELECT 1 FROM availability_blocks
          WHERE room_id = ?
            AND NOT (end_date <= ? OR start_date >= ?)
        )
      `;

      const conflict = await env.DB.prepare(conflictQuery)
        .bind(roomId, bookingId, existing.check_in, existing.check_out, roomId, existing.check_in, existing.check_out)
        .first();

      if (conflict && conflict.conflict_count > 0) {
        return Response.json({
          success: false,
          message: `無法恢復該筆訂單！該檔期（${existing.check_in} 至 ${existing.check_out}）已被其他有效訂單或鎖房佔用，無法重疊。`
        }, { status: 409 });
      }
    }

    // 準備批次資料庫操作
    const batchStatements = [
      env.DB.prepare(`
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
          cancel_reason_category = ?,
          cancel_reason_note = ?,
          refund_status = ?,
          refund_amount = ?,
          refund_reference_no = ?,
          refund_admin_note = ?,
          refund_completed_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE refund_completed_at END,
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
        newCancelReasonCategory,
        newCancelReasonNote,
        newRefundStatus,
        newRefundAmount,
        newRefundReferenceNo,
        newRefundAdminNote,
        isNowRefundCompleted ? 1 : 0,
        bookingId
      )
    ];

    // 排他庫存表聯動維護
    if (newStatus === 'CANCELLED' && existing.status !== 'CANCELLED') {
      // 取消訂單：立即釋放 room_daily_inventory
      batchStatements.push(
        env.DB.prepare('DELETE FROM room_daily_inventory WHERE booking_id = ?').bind(bookingId)
      );
    } else if (existing.status === 'CANCELLED' && newStatus !== 'CANCELLED') {
      // 恢復訂單：重新寫入每日庫存
      let curr = new Date(existing.check_in);
      const end = new Date(existing.check_out);
      while (curr < end) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        batchStatements.push(
          env.DB.prepare(`
            INSERT OR REPLACE INTO room_daily_inventory (room_id, occupy_date, booking_id, source)
            VALUES (?, ?, ?, 'BOOKING')
          `).bind(roomId, `${y}-${m}-${d}`, bookingId)
        );
        curr.setDate(curr.getDate() + 1);
      }
    }

    await env.DB.batch(batchStatements);

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
        let reasonLabel = '未指定原因';
        if (newCancelReasonCategory === 'FORCE_MAJEURE') reasonLabel = '天災因素（停班停課全額退定）';
        else if (newCancelReasonCategory === 'GUEST_PERSONAL') reasonLabel = '旅客個人因素（依約扣除定金）';
        else if (newCancelReasonCategory === 'RESCHEDULE_HOLD') reasonLabel = '協商延期保留（保留定金權益）';
        else if (newCancelReasonCategory) reasonLabel = newCancelReasonCategory;

        summaryText = `管家取消直訂單「${bookingId}」（旅客：${newGuestName}，檔期：${existing.check_in} ~ ${existing.check_out}），原因：【${reasonLabel}】${newCancelReasonNote ? '，備註：' + newCancelReasonNote : ''}，房態檔期已即時釋放`;
      } else if (newStatus !== 'CANCELLED' && existing.status === 'CANCELLED') {
        actionName = 'RESTORE_BOOKING';
        summaryText = `管家重新恢復直訂單「${bookingId}」（旅客：${newGuestName}，檔期：${existing.check_in} ~ ${existing.check_out}）為已確認狀態`;
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
          guestPhone: newGuestPhone,
          cancelReasonCategory: newCancelReasonCategory,
          cancelReasonNote: newCancelReasonNote
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
      status: newStatus,
      cancelReasonCategory: newCancelReasonCategory,
      cancelReasonNote: newCancelReasonNote
    });

  } catch (err) {
    return Response.json(
      { success: false, message: '更新訂單狀態失敗: ' + err.message },
      { status: 500 }
    );
  }
}
