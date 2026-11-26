import { sendLineNotification } from '../../../_line.js';

/**
 * POST /api/admin/bookings/:id/send-line - 管家手動觸發/重發 LINE 官方通知卡片
 */
export async function onRequestPost(context) {
  const { params, request, env } = context;
  const bookingId = params.id;

  if (!env.DB) {
    return Response.json({ success: false, message: '資料庫連線異常' }, { status: 500 });
  }

  try {
    const booking = await env.DB.prepare(`
      SELECT 
        id, room_id, status, deposit_status, guest_name, guest_phone, guest_email,
        guest_count, check_in, check_out, nights, total_amount, deposit_amount,
        bank_last_5, refund_amount, refund_status, cancel_reason_note, line_user_id
      FROM bookings 
      WHERE id = ?
    `).bind(bookingId).first();

    if (!booking) {
      return Response.json({ success: false, message: '找不到該筆訂單: ' + bookingId }, { status: 404 });
    }

    if (!booking.line_user_id) {
      return Response.json({
        success: false,
        message: '該旅客尚未綁定 LINE 官方帳號通知 (line_user_id 為空)，無法進行推播。'
      }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    let targetEvent = body.eventType;

    // 若未指定事件，自動依訂單當前狀態推斷
    if (!targetEvent) {
      if (booking.status === 'CANCELLED') {
        targetEvent = 'BOOKING_CANCELLED';
      } else if (booking.deposit_status === 'PAID') {
        targetEvent = 'BOOKING_CONFIRMED';
      } else if (booking.bank_last_5) {
        targetEvent = 'PAYMENT_REPORTED';
      } else {
        targetEvent = 'BOOKING_PENDING';
      }
    }

    const result = await sendLineNotification(env, {
      bookingId,
      lineUserId: booking.line_user_id,
      eventType: targetEvent,
      bookingData: {
        guestName: booking.guest_name,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        nights: booking.nights,
        guestCount: booking.guest_count,
        totalAmount: booking.total_amount,
        depositAmount: booking.deposit_amount,
        bankLast5: booking.bank_last_5 || '',
        refundAmount: booking.refund_amount || 0,
        refundStatus: booking.refund_status || 'NONE',
        cancelReason: booking.cancel_reason_note || ''
      }
    });

    // 寫入審計日誌
    try {
      const currentAdmin = context.data?.adminUser;
      const operatorTag = currentAdmin?.displayName 
        ? `${currentAdmin.displayName} (${currentAdmin.username})` 
        : 'admin';

      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('BOOKING', 'MANUAL_LINE_PUSH', ?, ?, ?, ?)
      `).bind(
        bookingId,
        `管家手動推播 LINE【${targetEvent}】訊息`,
        JSON.stringify({ targetEvent, result }),
        operatorTag
      ).run();
    } catch (e) {
      console.warn('Audit log write error:', e);
    }

    if (!result.success) {
      return Response.json({
        success: false,
        message: '推播發送失敗: ' + (result.error || 'LINE API 回應異常'),
        detail: result
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: `LINE【${targetEvent}】通知卡片已成功推送至旅客 LINE！`,
      bookingId,
      eventType: targetEvent
    });

  } catch (err) {
    return Response.json({
      success: false,
      message: '處理推播失敗: ' + (err.message || '未知錯誤')
    }, { status: 500 });
  }
}
