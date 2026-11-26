import { getClientIp, checkRateLimit, isLocked, recordFailAttempt, clearFailAttempt, sanitizeText } from '../_security.js';

/**
 * POST /api/bookings/lookup - 旅客訂單查詢 API
 * 
 * 核心安全與防護機制 (P2 級別)：
 * 1. 雙重身分核驗 (手機電話 + 電子信箱)，杜絕單一欄位窮舉
 * 2. 嚴格參數化綁定 (env.DB.prepare(...).bind(...))，防範 SQL 注入
 * 3. ★ 速率限制 (Rate Limiting)：同 IP 每分鐘上限 15 次查詢 (HTTP 429)
 * 4. ★ 連續比對失敗防暴力窮舉鎖定：15 分鐘內連續失敗 5 次，暫時鎖定該 IP 15 分鐘 (HTTP 429)
 * 5. 欄位安全過濾：嚴禁回傳內部 admin_notes 等機密審核備註
 * 6. 支援帶入 bookingId 進行精準單筆查詢，或查詢該手機/信箱名下所有訂房
 */
export async function onRequestPost(context) {
  const { env, request } = context;

  if (!env.DB) {
    return Response.json({ success: false, message: '資料庫連線異常' }, { status: 500 });
  }

  try {
    const clientIp = getClientIp(request);
    const failKey = `lookup:fail:ip:${clientIp}`;
    const rateKey = `lookup:rate:ip:${clientIp}`;

    // 1. P2 資安防護：速率限制檢查 (同 IP 每分鐘 15 次)
    const rateRes = await checkRateLimit(env.DB, rateKey, 15, 60);
    if (!rateRes.allowed) {
      return Response.json({
        success: false,
        message: '查詢頻率過高，為保障系統服務品質，請於 1 分鐘後再試。'
      }, { status: 429 });
    }

    // 2. P2 資安防護：連續暴力比對失敗鎖定檢驗 (5 次失敗鎖定 15 分鐘)
    if (await isLocked(env.DB, failKey, 5)) {
      return Response.json({
        success: false,
        message: '連續查詢比對失敗次數過多，為保障旅客資料安全，此 IP 已暫時限制查詢 15 分鐘，或請直接洽詢官方 LINE 管家。'
      }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { phone = '', email = '', bookingId = '' } = body;

    const trimmedPhone = sanitizeText(phone, 30);
    const trimmedEmail = String(email).trim().toLowerCase().slice(0, 100);
    const trimmedBookingId = sanitizeText(bookingId, 50);

    if (!trimmedPhone || !trimmedEmail) {
      return Response.json({
        success: false,
        message: '請輸入當初預約時填寫的「聯絡手機電話」與「電子信箱」。'
      }, { status: 400 });
    }

    // 手機號碼格式標準化 (過濾空格與連字號)
    const normalizedPhone = trimmedPhone.replace(/[-\s]/g, '');

    let query = `
      SELECT 
        b.id,
        b.room_id,
        r.name AS room_name,
        b.guest_name,
        b.guest_phone,
        b.guest_email,
        b.line_id,
        b.line_user_id,
        b.line_notified_at,
        b.guest_count,
        b.check_in,
        b.check_out,
        b.nights,
        b.total_amount,
        b.deposit_amount,
        b.deposit_status,
        b.status,
        b.special_requests,
        b.bank_last_5,
        b.payment_reported_at,
        b.payment_note,
        b.cancelled_by,
        b.cancelled_at,
        b.cancel_reason_category,
        b.cancel_reason_note,
        b.refund_status,
        b.refund_amount,
        b.refund_bank_code,
        b.refund_bank_name,
        b.refund_account,
        b.refund_account_name,
        b.refund_completed_at,
        b.created_at
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE (REPLACE(REPLACE(b.guest_phone, '-', ''), ' ', '') = ? OR b.guest_phone = ?)
        AND LOWER(TRIM(b.guest_email)) = ?
    `;

    const binds = [normalizedPhone, trimmedPhone, trimmedEmail];

    if (trimmedBookingId) {
      query += ` AND b.id = ?`;
      binds.push(trimmedBookingId);
    }

    query += ` ORDER BY b.created_at DESC LIMIT 20`;

    const { results } = await env.DB.prepare(query).bind(...binds).all();
    const bookings = results || [];

    if (bookings.length === 0) {
      // 查無資料，記錄一次失敗嘗試 (防暴力撞庫)
      await recordFailAttempt(env.DB, failKey, 900);
    } else {
      // 查詢成功，清除失敗累計
      await clearFailAttempt(env.DB, failKey);
    }

    return Response.json({
      success: true,
      bookings
    });

  } catch (err) {
    return Response.json({
      success: false,
      message: '查詢訂單時發生錯誤: ' + (err.message || '未知錯誤')
    }, { status: 500 });
  }
}
