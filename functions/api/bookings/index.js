import { getClientIp, sanitizeText, verifyTurnstileToken } from '../_security.js';
import { sendLineNotification } from '../_line.js';

/**
 * POST /api/bookings - 旅客線上預約送出
 * 
 * 核心業務防呆與極端案例防護 (P0 & P1 & P2 等級)：
 * 1. 必填欄位與格式校驗 (YYYY-MM-DD 嚴格格式、手機正則、Email 正則)
 * 2. ★ 過去日期阻擋 (不得早於今日台灣時間 UTC+8)
 * 3. ★ 入住退房順序防呆 (至少入住 1 晚，阻擋 0 晚或退房早於入住)
 * 4. ★ 最大晚數上限限制 (單次線上上限 14 晚，防範長租攻擊與迴圈資源耗盡)
 * 5. ★ 預約窗口開放上限 (僅開放未來 180 天內預約，防範遠期定價未定虧損)
 * 6. ★ 入住人數上限與數值防呆 (整數 1 至 maxGuests，阻擋 0 人、負數、小數)
 * 7. ★ 自動釋放超過 24 小時未付未回報之幽靈過期訂單
 * 8. ★ 防重疊撞期鎖房 (Overlap Check)：[checkIn, checkOut) 與現有保留/訂單互斥
 * 9. ★ 高併發同毫秒物理排他鎖 (D1 Batch + room_daily_inventory 唯一鍵約束)
 * 10. ★ P2 資安防護：同一電話或 IP 於 24 小時內上限 2 筆未付款預訂 (防幽靈霸房攻擊)
 * 11. ★ P2 資安防護：XSS 特殊字元消毒與 Cloudflare Turnstile 無感人機驗證支援
 * 12. 金流防竄改計算 50% 定金
 * 13. 產生唯一訂單編號 (SY-YYYYMMDD-XXXX)
 */
export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    if (!env.DB) {
      return Response.json({ success: false, message: 'DB not bound' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      roomId = 'villa-full',
      guestName = '',
      guestPhone = '',
      guestEmail = '',
      lineId = '',
      lineUserId = '',
      guestCount = 2,
      checkIn = '',
      checkOut = '',
      specialRequests = '',
      turnstileToken = ''
    } = body;

    const clientIp = getClientIp(request);

    // P2 資安防護：Cloudflare Turnstile 人機驗證 (若配置密鑰則強制校驗)
    if (env.TURNSTILE_SECRET_KEY) {
      const turnstileRes = await verifyTurnstileToken(env.TURNSTILE_SECRET_KEY, turnstileToken || request.headers.get('cf-turnstile-response'), clientIp);
      if (!turnstileRes.success) {
        return Response.json({
          success: false,
          message: '人機安全驗證失敗，請重整頁面重試。'
        }, { status: 403 });
      }
    }

    // 1. 基本必填校驗與欄位格式防呆 (P1 級別)
    const rawName = typeof guestName === 'string' ? guestName.trim() : '';
    const cleanPhone = String(guestPhone || '').replace(/[-\s]/g, '');
    const trimmedEmail = String(guestEmail || '').trim().toLowerCase();
    const trimmedCheckIn = String(checkIn || '').trim();
    const trimmedCheckOut = String(checkOut || '').trim();
    const rawSpecial = typeof specialRequests === 'string' ? specialRequests.trim() : '';

    if (!rawName || !cleanPhone || !trimmedEmail || !trimmedCheckIn || !trimmedCheckOut) {
      return Response.json({
        success: false,
        message: '請完整填寫姓名、電話、電子郵件與預計入住/退房日期。'
      }, { status: 400 });
    }

    // 姓名長度限制 (1 至 50 字元)
    if (rawName.length < 1 || rawName.length > 50) {
      return Response.json({
        success: false,
        message: '訂房旅客姓名長度須介於 1 至 50 字元。'
      }, { status: 400 });
    }

    // 特殊需求備註長度限制 (上限 500 字元)
    if (rawSpecial.length > 500) {
      return Response.json({
        success: false,
        message: '特殊需求備註長度不可超過 500 字元。'
      }, { status: 400 });
    }

    // P2 資安防護：輸入欄位消毒 (濾除 HTML 標籤與惡意字元)
    const trimmedName = sanitizeText(rawName, 50);
    const trimmedLineId = sanitizeText(lineId, 50);
    const trimmedLineUid = sanitizeText(lineUserId, 64);
    const trimmedSpecial = sanitizeText(rawSpecial, 500);

    // 手機號碼格式防呆 (台灣手機 09 開頭 10 碼，或帶國碼之國際號碼 +...)
    const isTwMobile = /^09\d{8}$/.test(cleanPhone);
    const isIntlPhone = /^\+[1-9]\d{7,14}$/.test(cleanPhone);
    if (!isTwMobile && !isIntlPhone) {
      return Response.json({
        success: false,
        message: '手機號碼格式不符，請填寫有效之 10 碼行動電話（例如：0912345678）或帶國碼之國際號碼（例如：+886912345678）。'
      }, { status: 400 });
    }

    // 電子信箱格式防呆 (標準 RFC 格式，上限 100 字元)
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(trimmedEmail) || trimmedEmail.length > 100) {
      return Response.json({
        success: false,
        message: '電子信箱格式無效，請確認填寫正確 Email 地址（例如：name@example.com）。'
      }, { status: 400 });
    }

    // P2 資安防護：同一電話或 IP 於 24 小時內限制最多建立 2 筆未付款預約 (防幽靈霸房攻擊)
    const quotaQuery = `
      SELECT COUNT(*) AS pending_count FROM bookings
      WHERE status = 'PENDING'
        AND (
          REPLACE(REPLACE(guest_phone, '-', ''), ' ', '') = ?
          OR (client_ip IS NOT NULL AND client_ip != '' AND client_ip = ?)
        )
        AND created_at >= DATETIME('now', '-24 hours')
    `;
    const quotaRes = await env.DB.prepare(quotaQuery).bind(cleanPhone, clientIp).first();
    if (quotaRes && quotaRes.pending_count >= 2) {
      return Response.json({
        success: false,
        message: '同一聯絡電話或 IP 於 24 小時內最多僅允許預約 2 筆待付款訂單，如需更多檔期請直接洽詢官方 LINE 管家。'
      }, { status: 429 });
    }

    // 2. 日期格式校驗 (標準 YYYY-MM-DD)
    const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
    if (!DATE_REGEX.test(trimmedCheckIn) || !DATE_REGEX.test(trimmedCheckOut)) {
      return Response.json({
        success: false,
        message: '入住與退房日期格式必須為 YYYY-MM-DD。'
      }, { status: 400 });
    }

    const inDate = new Date(trimmedCheckIn);
    const outDate = new Date(trimmedCheckOut);
    if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
      return Response.json({
        success: false,
        message: '日期無效，請確認年月日是否正確。'
      }, { status: 400 });
    }

    // 3. 過去日期防呆 (以台灣時間 Asia/Taipei UTC+8 為基準)
    const now = new Date();
    const twTodayStr = new Intl.DateTimeFormat('zh-TW', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now).replace(/\//g, '-');

    if (trimmedCheckIn < twTodayStr) {
      return Response.json({
        success: false,
        message: `入住日期不得早於今日（台灣時間 ${twTodayStr}）。`
      }, { status: 400 });
    }

    // 4. 入住退房順序防呆 (checkIn 必須小於 checkOut，至少入住 1 晚)
    if (trimmedCheckIn >= trimmedCheckOut) {
      return Response.json({
        success: false,
        message: '退房日期必須晚於入住日期（至少預訂 1 晚）。'
      }, { status: 400 });
    }

    // 計算晚數
    const diffTime = outDate.getTime() - inDate.getTime();
    const nights = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // 5. 最大住宿天數防呆 (單次線上上限 14 晚)
    if (nights > 14) {
      return Response.json({
        success: false,
        message: '單次線上包棟預約上限為 14 晚，如需長期租賃請洽官方 LINE 管家專線。'
      }, { status: 400 });
    }

    // 6. 預約開放窗口上限防呆 (僅開放未來 180 天內預訂)
    const maxAdvanceDays = 180;
    const maxBookingDate = new Date(now.getTime() + maxAdvanceDays * 24 * 60 * 60 * 1000);
    const maxBookingDateStr = new Intl.DateTimeFormat('zh-TW', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(maxBookingDate).replace(/\//g, '-');

    if (trimmedCheckIn > maxBookingDateStr) {
      return Response.json({
        success: false,
        message: `目前僅開放未來 ${maxAdvanceDays} 天內之預約（最遠可預約至 ${maxBookingDateStr}）。`
      }, { status: 400 });
    }

    // 7. 查詢房型資訊與人數上限防呆 (阻擋 0 人、負數、小數)
    const room = await env.DB.prepare('SELECT * FROM rooms WHERE id = ?').bind(roomId).first();
    if (!room) {
      return Response.json({ success: false, message: '所選房型不存在。' }, { status: 404 });
    }

    const parsedGuests = parseInt(guestCount, 10);
    const maxGuests = Math.max(room.capacity_max || 14, 18);
    if (isNaN(parsedGuests) || parsedGuests < 1 || parsedGuests > maxGuests) {
      return Response.json({
        success: false,
        message: `所選房型容納人數為 1 至 ${maxGuests} 位，請確認預約人數。`
      }, { status: 400 });
    }

    // 8. ★ 自動巡檢並釋放超過 24 小時未付定金且未回報之幽靈過期訂單
    try {
      const staleBookings = await env.DB.prepare(`
        SELECT id FROM bookings
        WHERE status = 'PENDING'
          AND (deposit_status IS NULL OR deposit_status = 'UNPAID')
          AND (bank_last_5 IS NULL OR bank_last_5 = '')
          AND created_at <= DATETIME('now', '-24 hours')
      `).all();

      if (staleBookings && staleBookings.results && staleBookings.results.length > 0) {
        for (const stale of staleBookings.results) {
          await env.DB.batch([
            env.DB.prepare("UPDATE bookings SET status = 'CANCELLED', special_requests = COALESCE(special_requests, '') || ' [系統自動逾期釋放：超過24小時未付定金]', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(stale.id),
            env.DB.prepare("DELETE FROM room_daily_inventory WHERE booking_id = ?").bind(stale.id)
          ]);
        }
      }
    } catch (cleanupErr) {
      console.warn('[Auto-Cleanup Stale Bookings Warning]:', cleanupErr.message);
    }

    // 9. ★ 檔期衝突排他性檢查 (Overlap Check)
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
      .bind(roomId, trimmedCheckIn, trimmedCheckOut, roomId, trimmedCheckIn, trimmedCheckOut)
      .first();

    if (conflictResult && conflictResult.conflict_count > 0) {
      return Response.json({
        success: false,
        message: '非常抱歉，您所選擇的檔期已被其他旅客預約或進行例行養護，請重新挑選日期。'
      }, { status: 409 });
    }

    // 10. 計算總金額與定金 (金流防竄改：優先讀取 D1 動態定價與連假設定，自動備援預設常數)
    const DEFAULT_HOLIDAYS = [
      { start: '2026-12-24', end: '2026-12-27', price: 47000 },
      { start: '2026-12-31', end: '2027-01-01', price: 47000 },
      { start: '2027-01-01', end: '2027-01-03', price: 47000 },
      { start: '2027-02-04', end: '2027-02-10', price: 50000 },
      { start: '2027-02-26', end: '2027-03-01', price: 38000 },
      { start: '2027-04-02', end: '2027-04-06', price: 38000 },
      { start: '2027-04-29', end: '2027-05-02', price: 38000 },
      { start: '2027-06-08', end: '2027-06-09', price: 35000 },
      { start: '2027-09-14', end: '2027-09-15', price: 35000 },
      { start: '2027-09-27', end: '2027-09-28', price: 35000 },
      { start: '2027-10-08', end: '2027-10-11', price: 38000 },
      { start: '2027-10-22', end: '2027-10-25', price: 38000 },
      { start: '2027-12-23', end: '2027-12-26', price: 47000 },
      { start: '2027-12-30', end: '2028-01-02', price: 47000 }
    ];

    let dynamicHolidays = DEFAULT_HOLIDAYS;
    let t1Price = 20000;
    let t2Price = 25000;
    let t3Price = 30000;
    let weekendPrice = 35000;

    try {
      const pRows = await env.DB.prepare('SELECT setting_key, setting_value FROM pricing_settings').all();
      if (pRows && pRows.results) {
        for (const row of pRows.results) {
          if (row.setting_key === 'weekday_tier1_price') t1Price = Number(row.setting_value) || t1Price;
          if (row.setting_key === 'weekday_tier2_price') t2Price = Number(row.setting_value) || t2Price;
          if (row.setting_key === 'weekday_tier3_price') t3Price = Number(row.setting_value) || t3Price;
          if (row.setting_key === 'weekend_price') weekendPrice = Number(row.setting_value) || weekendPrice;
        }
      }

      const hRows = await env.DB.prepare('SELECT start_date, end_date, price FROM holiday_rates WHERE is_active = 1').all();
      if (hRows && hRows.results && hRows.results.length > 0) {
        dynamicHolidays = hRows.results.map(r => ({
          start: r.start_date,
          end: r.end_date,
          price: Number(r.price)
        }));
      }
    } catch (_) {}

    const getWeekdayTierPrice = (count) => {
      const g = Number(count) || 18;
      if (g <= 10) return t1Price;
      if (g <= 14) return t2Price;
      return t3Price;
    };

    let totalAmount = 0;
    const occupiedDates = [];
    let curr = new Date(trimmedCheckIn);
    const end = new Date(trimmedCheckOut);

    while (curr < end) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      occupiedDates.push(dateStr);

      const holiday = dynamicHolidays.find(h => dateStr >= h.start && dateStr <= h.end);
      if (holiday) {
        totalAmount += holiday.price;
      } else {
        const dayOfWeek = curr.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
        if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
          totalAmount += (weekendPrice || room.holiday_price || 35000);
        } else {
          totalAmount += getWeekdayTierPrice(parsedGuests);
        }
      }
      curr.setDate(curr.getDate() + 1);
    }

    const depositAmount = Math.round(totalAmount * 0.5);

    // 11. 產生唯一訂單編號
    const dateCode = trimmedCheckIn.replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingId = `SY-${dateCode}-${randSuffix}`;

    // 12. ★ 高併發同毫秒物理排他鎖 (D1 Batch + room_daily_inventory UNIQUE 索引)
    const batchStatements = [
      env.DB.prepare(`
        INSERT INTO bookings (
          id, room_id, guest_name, guest_phone, guest_email, line_id, line_user_id,
          guest_count, check_in, check_out, nights, total_amount, deposit_amount,
          deposit_status, status, source, special_requests, client_ip
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'UNPAID', 'PENDING', 'OFFICIAL', ?, ?)
      `).bind(
        bookingId, roomId, trimmedName, cleanPhone, trimmedEmail, trimmedLineId, trimmedLineUid || null,
        parsedGuests, trimmedCheckIn, trimmedCheckOut, nights, totalAmount, depositAmount,
        trimmedSpecial, clientIp
      )
    ];

    for (const d of occupiedDates) {
      batchStatements.push(
        env.DB.prepare(`
          INSERT INTO room_daily_inventory (room_id, occupy_date, booking_id, source)
          VALUES (?, ?, ?, 'BOOKING')
        `).bind(roomId, d, bookingId)
      );
    }

    try {
      await env.DB.batch(batchStatements);
    } catch (insertErr) {
      // 捕獲 UNIQUE 鍵衝突（另一併發請求搶先寫入）
      if (insertErr.message && (insertErr.message.includes('UNIQUE constraint failed') || insertErr.message.includes('PRIMARY KEY'))) {
        return Response.json({
          success: false,
          message: '非常抱歉，您所選擇的檔期剛被其他旅客搶先一步預約，請重新挑選日期。'
        }, { status: 409 });
      }
      throw insertErr;
    }

    // 13. 觸發 LINE Messaging API 推播通知 (若已具備 line_user_id)
    if (trimmedLineUid && trimmedLineUid.startsWith('U')) {
      const linePromise = sendLineNotification(env, {
        bookingId,
        lineUserId: trimmedLineUid,
        eventType: 'BOOKING_PENDING',
        bookingData: {
          guestName: trimmedName,
          checkIn: trimmedCheckIn,
          checkOut: trimmedCheckOut,
          nights,
          guestCount: parsedGuests,
          totalAmount,
          depositAmount
        }
      });
      if (context.waitUntil) context.waitUntil(linePromise);
      else await linePromise;
    }

    return Response.json({
      success: true,
      booking: {
        id: bookingId,
        roomName: room.name,
        guestName: trimmedName,
        checkIn: trimmedCheckIn,
        checkOut: trimmedCheckOut,
        nights,
        guestCount: parsedGuests,
        totalAmount,
        depositAmount,
        status: 'PENDING'
      },
      message: '預約申請已成功送出！請於 24 小時內完成定金匯款並透過官方 LINE 回報帳號後五碼。'
    }, { status: 201 });

  } catch (err) {
    console.error('[Create Booking API Exception]:', err);
    return Response.json({
      success: false,
      message: '系統預約處理逾時或異常，請稍後重試或直接洽詢官方 LINE 管家協助。'
    }, { status: 500 });
  }
}
