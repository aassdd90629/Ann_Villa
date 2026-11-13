/**
 * POST /api/bookings - 旅客線上預約送出
 * 
 * 核心業務防呆：
 * 1. 必填欄位驗證
 * 2. 入住人數上限檢查 (全區最多 14 人)
 * 3. ★ 防重疊撞期鎖房 (Overlap Check)：[checkIn, checkOut) 與現有保留/訂單互斥
 * 4. 自動計算 50% 定金
 * 5. 產生唯一訂單編號 (SY-YYYYMMDD-XXXX)
 */
export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    if (!env.DB) {
      return Response.json({ success: false, message: 'DB not bound' }, { status: 500 });
    }

    const body = await request.json();
    const {
      roomId = 'villa-full',
      guestName,
      guestPhone,
      guestEmail,
      lineId = '',
      guestCount = 2,
      checkIn,
      checkOut,
      specialRequests = ''
    } = body;

    // 1. 基本必填校驗
    if (!guestName || !guestPhone || !guestEmail || !checkIn || !checkOut) {
      return Response.json({
        success: false,
        message: '請完整填寫姓名、電話、電子郵件與預計入住/退房日期。'
      }, { status: 400 });
    }

    // 2. 日期有效性檢查 (checkIn 必須早於 checkOut，且不得早於今日)
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    if (isNaN(inDate.getTime()) || isNaN(outDate.getTime()) || inDate >= outDate) {
      return Response.json({
        success: false,
        message: '入住日期必須早於退房日期，且格式須為 YYYY-MM-DD。'
      }, { status: 400 });
    }

    // 計算晚數
    const diffTime = Math.abs(outDate - inDate);
    const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // 3. 查詢房型資訊與人數上限檢查
    const room = await env.DB.prepare('SELECT * FROM rooms WHERE id = ?').bind(roomId).first();
    if (!room) {
      return Response.json({ success: false, message: '所選房型不存在。' }, { status: 404 });
    }

    if (guestCount > room.capacity_max) {
      return Response.json({
        success: false,
        message: `所選房型最多僅容納 ${room.capacity_max} 人，請重新調整人數。`
      }, { status: 400 });
    }

    // 4. ★ 核心防呆：撞期衝突檢查 (Overlap Check)
    // 兩區間重疊條件：NOT (A.end <= B.start OR A.start >= B.end)
    const conflictQuery = `
      SELECT COUNT(*) AS conflict_count FROM (
        SELECT 1 FROM bookings 
        WHERE room_id = ? 
          AND status != 'CANCELLED'
          AND NOT (check_out <= ? OR check_in >= ?)
        UNION ALL
        SELECT 1 FROM availability_blocks
        WHERE room_id = ?
          AND NOT (end_date <= ? OR start_date >= ?)
      )
    `;

    const conflictResult = await env.DB.prepare(conflictQuery)
      .bind(roomId, checkIn, checkOut, roomId, checkIn, checkOut)
      .first();

    if (conflictResult && conflictResult.conflict_count > 0) {
      return Response.json({
        success: false,
        message: '非常抱歉，您所選擇的檔期已被其他旅客預約或進行例行養護，請重新挑選日期。'
      }, { status: 409 });
    }

    // 5. 計算總金額與定金 (平日/假日基本定價試算)
    const basePrice = room.base_price;
    const totalAmount = basePrice * nights;
    const depositAmount = Math.round(totalAmount * 0.5);

    // 6. 產生唯一訂單編號
    const dateStr = checkIn.replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingId = `SY-${dateStr}-${randSuffix}`;

    // 7. 寫入 D1 資料庫
    await env.DB.prepare(`
      INSERT INTO bookings (
        id, room_id, guest_name, guest_phone, guest_email, line_id,
        guest_count, check_in, check_out, nights, total_amount, deposit_amount,
        deposit_status, status, source, special_requests
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'UNPAID', 'PENDING', 'OFFICIAL', ?)
    `).bind(
      bookingId, roomId, guestName, guestPhone, guestEmail, lineId,
      guestCount, checkIn, checkOut, nights, totalAmount, depositAmount,
      specialRequests
    ).run();

    return Response.json({
      success: true,
      booking: {
        id: bookingId,
        roomName: room.name,
        guestName,
        checkIn,
        checkOut,
        nights,
        guestCount,
        totalAmount,
        depositAmount,
        status: 'PENDING'
      },
      message: '預約申請已成功送出！請於 24 小時內完成定金匯款並透過官方 LINE 回報帳號後五碼。'
    }, { status: 201 });

  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

