import { getClientIp, checkRateLimit, isLocked, recordFailAttempt, clearFailAttempt, sanitizeText } from '../_security.js';
import { sendLineNotification } from '../_line.js';

/**
 * POST /api/bookings/bind-line - 旅客線上自主綁定 LINE 官方帳號通知
 * 
 * 核心業務與資安機制：
 * 1. 雙重身分核驗：bookingId + phone (防冒領訂單)
 * 2. 格式檢驗：lineUserId 必須為以 'U' 開頭的 33 碼英數字 (LINE 官方規範)
 * 3. 速率限制與暴力鎖定防護：同 IP 每分鐘上限 10 次，失敗 5 次鎖定 15 分鐘
 * 4. 綁定成功即時補發：依據當前訂單狀態，即時推播最新對應卡片至旅客 LINE
 */
export async function onRequestPost(context) {
  const { env, request } = context;

  if (!env.DB) {
    return Response.json({ success: false, message: '資料庫連線異常' }, { status: 500 });
  }

  try {
    const clientIp = getClientIp(request);
    const failIpKey = `bindline:fail:ip:${clientIp}`;
    const rateKey = `bindline:rate:ip:${clientIp}`;

    // 1. 速率限制：每分鐘上限 10 次
    const rateRes = await checkRateLimit(env.DB, rateKey, 10, 60);
    if (!rateRes.allowed) {
      return Response.json({
        success: false,
        message: '操作過於頻繁，請於 1 分鐘後再試。'
      }, { status: 429 });
    }

    // 2. 檢查 IP 是否已被鎖定
    if (await isLocked(env.DB, failIpKey, 5)) {
      return Response.json({
        success: false,
        message: '核驗失敗次數過多，為保障訂單安全，請稍候 15 分鐘再試或聯繫管家協助。'
      }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { bookingId = '', phone = '', lineUserId = '' } = body;

    const trimmedId = sanitizeText(bookingId, 50);
    const trimmedPhone = sanitizeText(phone, 30);
    const trimmedLineUid = sanitizeText(lineUserId, 64);

    if (!trimmedId || !trimmedPhone || !trimmedLineUid) {
      return Response.json({
        success: false,
        message: '請完整提供訂單編號、聯絡手機號碼與 LINE 識別碼。'
      }, { status: 400 });
    }

    // LINE userId 格式驗證：U 開頭且長度約 33 碼
    if (!/^U[0-9a-f]{32}$/i.test(trimmedLineUid)) {
      return Response.json({
        success: false,
        message: 'LINE 識別碼格式無效。'
      }, { status: 400 });
    }

    const normalizedPhone = trimmedPhone.replace(/[-\s]/g, '');

    // 3. 驗證訂單是否存在並核對手機
    const booking = await env.DB.prepare(`
      SELECT 
        id, room_id, guest_name, guest_phone, guest_email, guest_count,
        check_in, check_out, nights, total_amount, deposit_amount, deposit_status,
        status, bank_last_5, refund_amount, refund_status, cancel_reason_note,
        line_user_id
      FROM bookings
      WHERE id = ?
        AND (REPLACE(REPLACE(guest_phone, '-', ''), ' ', '') = ? OR guest_phone = ?)
    `).bind(trimmedId, normalizedPhone, trimmedPhone).first();

    if (!booking) {
      await recordFailAttempt(env.DB, failIpKey, 900);
      return Response.json({
        success: false,
        message: '核對失敗，找不到相符之訂單編號或手機號碼。'
      }, { status: 404 });
    }

    // 核對成功，清除失敗鎖定
    await clearFailAttempt(env.DB, failIpKey);

    // 4. 更新 line_user_id
    await env.DB.prepare(`
      UPDATE bookings 
      SET line_user_id = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(trimmedLineUid, trimmedId).run();

    // 5. 依據當前訂單狀態，決定推播之事件卡片
    let eventType = 'BOOKING_PENDING';
    if (booking.status === 'CANCELLED') {
      eventType = 'BOOKING_CANCELLED';
    } else if (booking.deposit_status === 'PAID') {
      eventType = 'BOOKING_CONFIRMED';
    } else if (booking.bank_last_5) {
      eventType = 'PAYMENT_REPORTED';
    }

    // 6. 異步推播最新進度卡片
    const linePromise = sendLineNotification(env, {
      bookingId: trimmedId,
      lineUserId: trimmedLineUid,
      eventType,
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

    if (context.waitUntil) {
      context.waitUntil(linePromise);
    } else {
      await linePromise;
    }

    return Response.json({
      success: true,
      message: 'LINE 通知已成功綁定！最新訂單進度卡片已即刻傳送至您的 LINE。',
      bookingId: trimmedId,
      lineUserId: trimmedLineUid
    });

  } catch (err) {
    return Response.json({
      success: false,
      message: '綁定失敗: ' + (err.message || '未知錯誤')
    }, { status: 500 });
  }
}
