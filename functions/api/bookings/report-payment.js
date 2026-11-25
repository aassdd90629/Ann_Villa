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

    // 1. 驗證該訂單是否存在且身分相符
    const checkQuery = `
      SELECT id, status, deposit_status, total_amount, deposit_amount, check_in, check_out
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

    // 2. 更新資料庫
    const nowIso = new Date().toISOString();
    await env.DB.prepare(`
      UPDATE bookings
      SET 
        bank_last_5 = ?,
        payment_reported_at = CURRENT_TIMESTAMP,
        payment_note = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(trimmedLast5, trimmedNote, trimmedId).run();

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
