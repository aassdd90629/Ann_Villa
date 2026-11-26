import { getClientIp, checkRateLimit, isLocked, recordFailAttempt, clearFailAttempt, sanitizeText } from '../_security.js';
import { sendLineNotification } from '../_line.js';

/**
 * POST /api/bookings/cancel - 旅客線上自主取消預訂 API
 * 
 * 核心業務防呆與極端案例防護：
 * 1. 嚴格身分核驗：bookingId + phone + email 三者核對，並加強「真實姓名」二次確認防誤按與惡意破壞。
 * 2. 過去日期與當日阻擋：check_in <= 台灣當日者禁止線上取消，強制引導電聯管家。
 * 3. 狀態檢查：已取消 (CANCELLED) 或已結案 (COMPLETED) 阻擋重複操作。
 * 4. 依照正式站退訂政策即時試算退款比例 (policies_refund_rules)：
 *    - 距入住 15 天（含）以上：100% 全額退款
 *    - 距入住 8 至 14 天：50% 退款
 *    - 距入住 7 天（含）以內：0% 不予退款（定金沒入）
 * 5. 金流退款資訊蒐集：若有應退金額，強制收集銀行代碼、帳號、戶名。
 * 6. 每日庫存物理釋放：原子性自 room_daily_inventory 刪除該檔期，官網日曆即刻釋出空房。
 * 7. 速率限制與暴力鎖定防護：同 IP 每分鐘上限 5 次，失敗 5 次鎖定 15 分鐘。
 * 8. 審計追蹤：詳細寫入 admin_audit_logs 留存取消軌跡。
 */
export async function onRequestPost(context) {
  const { env, request } = context;

  if (!env.DB) {
    return Response.json({ success: false, message: '資料庫連線異常' }, { status: 500 });
  }

  try {
    const clientIp = getClientIp(request);
    const failIpKey = `cancel:fail:ip:${clientIp}`;
    const rateKey = `cancel:rate:ip:${clientIp}`;

    // 1. 速率限制：每分鐘上限 5 次
    const rateRes = await checkRateLimit(env.DB, rateKey, 5, 60);
    if (!rateRes.allowed) {
      return Response.json({
        success: false,
        message: '取消操作頻率過高，請稍候 1 分鐘後再試。'
      }, { status: 429 });
    }

    // 2. 檢查此 IP 是否已被暴力比對鎖定
    if (await isLocked(env.DB, failIpKey, 5)) {
      return Response.json({
        success: false,
        message: '輸入比對失敗次數過多，為保障訂單安全，此 IP 已暫時限制操作 15 分鐘，請洽詢官方 LINE 管家。'
      }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      bookingId = '',
      phone = '',
      email = '',
      confirmName = '',
      cancelReason = '',
      refundBankCode = '',
      refundBankName = '',
      refundAccount = '',
      refundAccountName = ''
    } = body;

    const trimmedId = sanitizeText(bookingId, 50);
    const trimmedPhone = sanitizeText(phone, 30);
    const trimmedEmail = String(email).trim().toLowerCase().slice(0, 100);
    const trimmedConfirmName = sanitizeText(confirmName, 50);
    const trimmedReason = sanitizeText(cancelReason, 300);
    const trimmedBankCode = sanitizeText(refundBankCode, 10);
    const trimmedBankName = sanitizeText(refundBankName, 50);
    const trimmedAccount = sanitizeText(refundAccount, 30);
    const trimmedAccountName = sanitizeText(refundAccountName, 50);

    const failOrderKey = `cancel:fail:order:${trimmedId}`;
    if (trimmedId && await isLocked(env.DB, failOrderKey, 5)) {
      return Response.json({
        success: false,
        message: '該訂單核驗失敗次數過多，已暫時鎖定 15 分鐘，請確認資料後再試。'
      }, { status: 429 });
    }

    if (!trimmedId || !trimmedPhone || !trimmedEmail || !trimmedConfirmName) {
      return Response.json({
        success: false,
        message: '請完整填寫訂單編號、聯絡手機、電子信箱與主要訂房人真實姓名。'
      }, { status: 400 });
    }

    const normalizedPhone = trimmedPhone.replace(/[-\s]/g, '');

    // 3. 驗證訂單是否存在與核對身分
    const booking = await env.DB.prepare(`
      SELECT 
        id, room_id, status, deposit_status, total_amount, deposit_amount,
        check_in, check_out, guest_name, guest_phone, guest_email, bank_last_5,
        line_user_id
      FROM bookings
      WHERE id = ?
        AND (REPLACE(REPLACE(guest_phone, '-', ''), ' ', '') = ? OR guest_phone = ?)
        AND LOWER(TRIM(guest_email)) = ?
    `).bind(trimmedId, normalizedPhone, trimmedPhone, trimmedEmail).first();

    if (!booking) {
      await recordFailAttempt(env.DB, failIpKey, 900);
      if (trimmedId) await recordFailAttempt(env.DB, failOrderKey, 900);

      return Response.json({
        success: false,
        message: '找不到相符之預訂訂單，請確認訂單編號、手機與電子信箱是否完全相符。'
      }, { status: 404 });
    }

    // 4. 二次訂房人姓名防呆核驗 (防止他人知悉手機信箱後惡意退訂)
    if (booking.guest_name.trim().toLowerCase() !== trimmedConfirmName.toLowerCase()) {
      await recordFailAttempt(env.DB, failIpKey, 900);
      if (trimmedId) await recordFailAttempt(env.DB, failOrderKey, 900);

      return Response.json({
        success: false,
        message: '主要訂房人姓名核對不符，請輸入送出預約時填寫的真實姓名。'
      }, { status: 400 });
    }

    // 核對成功，清除鎖定計數
    await clearFailAttempt(env.DB, failIpKey);
    if (trimmedId) await clearFailAttempt(env.DB, failOrderKey);

    // 5. 狀態防呆
    if (booking.status === 'CANCELLED') {
      return Response.json({
        success: false,
        message: '此訂單目前已為取消狀態，無需重複取消。'
      }, { status: 400 });
    }

    if (booking.status === 'COMPLETED') {
      return Response.json({
        success: false,
        message: '此訂單已完成入住結案，無法申請取消。'
      }, { status: 400 });
    }

    // 6. 過去日期與當日取消防呆（以台灣時間 Asia/Taipei 為準）
    const now = new Date();
    const twDateStr = new Intl.DateTimeFormat('zh-TW', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now).replace(/\//g, '-');

    if (booking.check_in <= twDateStr) {
      return Response.json({
        success: false,
        message: '已達入住當日或預訂日期已過，無法於線上直接取消。如有緊急需求請直接致電管家。'
      }, { status: 400 });
    }

    // 7. 依據正式站退訂規定計算退款比例與天數
    // policies_refund_rules:
    // - 入住前15天取消，訂金可全額退款。
    // - 入住前8-14天內取消，訂金可退還一半。
    // - 入住前7天內取消，訂金則不退還。
    const checkInMs = new Date(`${booking.check_in}T00:00:00+08:00`).getTime();
    const todayMs = new Date(`${twDateStr}T00:00:00+08:00`).getTime();
    const diffDays = Math.ceil((checkInMs - todayMs) / (1000 * 60 * 60 * 24));

    let refundPercentage = 0;
    if (diffDays >= 15) {
      refundPercentage = 100;
    } else if (diffDays >= 8) {
      refundPercentage = 50;
    } else {
      refundPercentage = 0;
    }

    const isPaid = booking.deposit_status === 'PAID';
    const depositAmount = Number(booking.deposit_amount) || 0;
    let refundAmount = 0;
    let refundStatus = 'NONE';

    if (isPaid) {
      refundAmount = Math.round(depositAmount * (refundPercentage / 100));
      if (refundAmount > 0) {
        // 有應退金額，必須填寫完整退款帳號
        if (!trimmedBankCode || !trimmedAccount || !trimmedAccountName) {
          return Response.json({
            success: false,
            message: `依正式站退費政策，距入住尚有 ${diffDays} 天可退還定金 ${refundPercentage}%（NT$ ${refundAmount.toLocaleString()}），請填寫退款銀行代碼、帳號與戶名以利管家為您匯退。`
          }, { status: 400 });
        }
        refundStatus = 'PENDING'; // 待管家網銀轉帳
      } else {
        refundStatus = 'FORFEITED'; // 距入住未滿 7 天，依約沒入定金
      }
    } else {
      // 未付款 (UNPAID)
      if (booking.bank_last_5 && (trimmedAccount || trimmedBankCode)) {
        // 曾回報末五碼，可能已自行轉帳但尚未核銷，記錄待退款
        refundStatus = 'PENDING';
        refundAmount = Math.round(depositAmount * (refundPercentage / 100));
      } else {
        refundStatus = 'NONE';
        refundAmount = 0;
      }
    }

    const cancelNoteText = trimmedReason 
      ? `旅客線上自主取消 [${diffDays}天前取消, 退定${refundPercentage}% NT$${refundAmount}] 備註: ${trimmedReason}`
      : `旅客線上自主取消 [${diffDays}天前取消, 退定${refundPercentage}% NT$${refundAmount}]`;

    // 8. 執行批次原子性操作：更新訂單、釋放每日庫存、寫入審計日誌
    const batchStatements = [
      env.DB.prepare(`
        UPDATE bookings
        SET 
          status = 'CANCELLED',
          cancelled_by = 'GUEST',
          cancelled_at = CURRENT_TIMESTAMP,
          cancel_reason_category = 'GUEST_PERSONAL',
          cancel_reason_note = ?,
          refund_status = ?,
          refund_amount = ?,
          refund_bank_code = ?,
          refund_bank_name = ?,
          refund_account = ?,
          refund_account_name = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        cancelNoteText,
        refundStatus,
        refundAmount,
        trimmedBankCode || null,
        trimmedBankName || null,
        trimmedAccount || null,
        trimmedAccountName || null,
        trimmedId
      ),
      // 關鍵防呆：物理釋放 room_daily_inventory 庫存
      env.DB.prepare('DELETE FROM room_daily_inventory WHERE booking_id = ?').bind(trimmedId),
      // 審計日誌
      env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator, ip_address)
        VALUES ('BOOKING', 'GUEST_CANCEL_BOOKING', ?, ?, ?, 'guest', ?)
      `).bind(
        trimmedId,
        `旅客線上自主取消預訂 [${diffDays}天前, 退定${refundPercentage}% NT$${refundAmount}]`,
        JSON.stringify({
          diffDays,
          refundPercentage,
          refundAmount,
          refundStatus,
          reason: trimmedReason
        }),
        clientIp
      )
    ];

    await env.DB.batch(batchStatements);

    // 9. 觸發 LINE Messaging API 推播通知 (若已綁定 line_user_id)
    if (booking.line_user_id) {
      const linePromise = sendLineNotification(env, {
        bookingId: trimmedId,
        lineUserId: booking.line_user_id,
        eventType: 'BOOKING_CANCELLED',
        bookingData: {
          guestName: booking.guest_name,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          depositAmount,
          refundAmount,
          refundStatus,
          cancelReason: trimmedReason
        }
      });
      if (context.waitUntil) context.waitUntil(linePromise);
      else await linePromise;
    }

    let userMessage = '預訂已成功取消，原保留檔期已即刻為您釋放。';
    if (refundStatus === 'PENDING') {
      userMessage = `預訂已成功取消！依規定可退還定金 NT$ ${refundAmount.toLocaleString()}，管家將於 3 至 5 個工作天內核對並匯入您提供的帳戶。`;
    } else if (refundStatus === 'FORFEITED') {
      userMessage = '預訂已取消。因距入住日未滿 7 天，依山語 Villa 官方退訂政策定金不予退還，檔期已即刻為您釋出。';
    }

    return Response.json({
      success: true,
      message: userMessage,
      bookingId: trimmedId,
      refundAmount,
      refundPercentage,
      refundStatus,
      diffDays
    });

  } catch (err) {
    return Response.json({
      success: false,
      message: '取消預訂失敗: ' + (err.message || '未知錯誤')
    }, { status: 500 });
  }
}
