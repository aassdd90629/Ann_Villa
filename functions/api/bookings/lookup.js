/**
 * POST /api/bookings/lookup - 旅客訂單查詢 API
 * 
 * 核心安全與業務機制：
 * 1. 雙重身分核驗 (手機電話 + 電子信箱)，杜絕單一欄位窮舉
 * 2. 嚴格參數化綁定 (env.DB.prepare(...).bind(...))，防範 SQL 注入
 * 3. 欄位安全過濾：嚴禁回傳內部 admin_notes 等機密審核備註
 * 4. 支援帶入 bookingId 進行精準單筆查詢，或查詢該手機/信箱名下所有訂房
 */
export async function onRequestPost(context) {
  const { env, request } = context;

  if (!env.DB) {
    return Response.json({ success: false, message: '資料庫連線異常' }, { status: 500 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { phone = '', email = '', bookingId = '' } = body;

    const trimmedPhone = String(phone).trim();
    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedBookingId = String(bookingId).trim();

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

    return Response.json({
      success: true,
      bookings: results || []
    });

  } catch (err) {
    return Response.json({
      success: false,
      message: '查詢訂單時發生錯誤: ' + (err.message || '未知錯誤')
    }, { status: 500 });
  }
}
