/**
 * POST /api/bookings/report-payment - 旅客線上自主回報定金匯款末五碼
 * 
 * 核心安全防護與業務邏輯：
 * 1. 嚴格身分核驗：bookingId + phone + email 三者均符合才允許回報
 * 2. 格式校驗：末五碼必須為 5 碼英數
 * 3. 狀態檢查：已核銷(PAID)或已取消(CANCELLED)的訂單阻擋重複填報
 * 4. 參數化綁定更新，記錄回報時間與自訂匯款備註
 */
export async function onRequestPost(context) {
  const { env, request } = context;

  if (!env.DB) {
    return Response.json({ success: false, message: '資料庫連線異常' }, { status: 500 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const {
      bookingId = '',
      phone = '',
      email = '',
      bankLast5 = '',
      paymentNote = ''
    } = body;

    const trimmedId = String(bookingId).trim();
    const trimmedPhone = String(phone).trim();
    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedLast5 = String(bankLast5).trim().toUpperCase();
    const trimmedNote = String(paymentNote).trim();

    if (!trimmedId || !trimmedPhone || !trimmedEmail || !trimmedLast5) {
      return Response.json({
        success: false,
        message: '請完整填寫訂單編號、聯絡手機、電子信箱與匯款帳號末五碼。'
      }, { status: 400 });
    }

    // 格式驗證：末五碼必須為 5 碼英數字
    if (!/^[A-Z0-9]{5}$/.test(trimmedLast5)) {
      return Response.json({
        success: false,
        message: '匯款末五碼格式不符，請輸入標準 5 碼英數字（例如：88219）。'
      }, { status: 400 });
    }

    const normalizedPhone = trimmedPhone.replace(/[-\s]/g, '');

    // 1. 驗證該訂單是否存在且身分相符 (查詢現有末五碼與備註以保存歷程)
    const checkQuery = `
      SELECT id, status, deposit_status, total_amount, deposit_amount, check_in, check_out, bank_last_5, payment_note
      FROM bookings
      WHERE id = ?
        AND (REPLACE(REPLACE(guest_phone, '-', ''), ' ', '') = ? OR guest_phone = ?)
        AND LOWER(TRIM(guest_email)) = ?
    `;

    const booking = await env.DB.prepare(checkQuery)
      .bind(trimmedId, normalizedPhone, trimmedPhone, trimmedEmail)
      .first();

    if (!booking) {
      return Response.json({
        success: false,
        message: '找不到相符之訂單，請確認訂單編號、手機與電子信箱是否完全相符。'
      }, { status: 404 });
    }

    if (booking.status === 'CANCELLED') {
      return Response.json({
        success: false,
        message: '該筆訂單目前為已取消狀態，如需重新預約請洽詢官方 LINE 管家。'
      }, { status: 400 });
    }

    if (booking.deposit_status === 'PAID') {
      return Response.json({
        success: false,
        message: '該筆訂單定金已核銷確認，無需重複回報。'
      }, { status: 400 });
    }

    // 2. 歷史紀錄防呆 (P1 級別)：若曾填報過末五碼，將異動歷程自動追補，防止舊紀錄被盲目抹除
    const nowTimeStr = new Intl.DateTimeFormat('zh-TW', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(new Date());

    let finalPaymentNote = trimmedNote;
    if (booking.bank_last_5) {
      const existingNote = booking.payment_note ? String(booking.payment_note).trim() : '';
      const isChanged = booking.bank_last_5 !== trimmedLast5;
      const historyTag = isChanged 
        ? `[${nowTimeStr} 變更末五碼: 原 ${booking.bank_last_5} -> 現 ${trimmedLast5}${trimmedNote ? ' 備註: ' + trimmedNote : ''}]`
        : `[${nowTimeStr} 再次確認末五碼: ${trimmedLast5}${trimmedNote ? ' 備註: ' + trimmedNote : ''}]`;
      finalPaymentNote = existingNote ? `${existingNote}\n${historyTag}` : historyTag;
    } else if (trimmedNote) {
      finalPaymentNote = `[${nowTimeStr} 初次回報末五碼: ${trimmedLast5}] 備註: ${trimmedNote}`;
    }

    // 3. 更新資料庫
    const nowIso = new Date().toISOString();
    await env.DB.prepare(`
      UPDATE bookings
      SET 
        bank_last_5 = ?,
        payment_reported_at = CURRENT_TIMESTAMP,
        payment_note = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(trimmedLast5, finalPaymentNote, trimmedId).run();

    return Response.json({
      success: true,
      message: '匯款末五碼已成功回報！山語 Villa 管家將於營業時間內儘速為您對帳核銷。',
      bookingId: trimmedId,
      bankLast5: trimmedLast5,
      reportedAt: nowIso
    });

  } catch (err) {
    return Response.json({
      success: false,
      message: '回報失敗: ' + (err.message || '未知錯誤')
    }, { status: 500 });
  }
}
