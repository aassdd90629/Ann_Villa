/**
 * GET /api/admin/bookings
 * 
 * 取得所有直訂單清單 (依建立時間倒序排序)
 * 遵守後端規範：SQL 參數化查詢、防注入
 */
export async function onRequestGet(context) {
  const { env } = context;

  if (!env.DB) {
    return Response.json({ success: false, message: 'DB not bound' }, { status: 500 });
  }

  try {
    const query = `
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
        b.cancel_reason_category,
        b.cancel_reason_note,
        b.cancelled_by,
        b.cancelled_at,
        b.refund_status,
        b.refund_amount,
        b.refund_bank_code,
        b.refund_bank_name,
        b.refund_account,
        b.refund_account_name,
        b.refund_completed_at,
        b.refund_reference_no,
        b.refund_admin_note,
        b.created_at,
        b.updated_at
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      ORDER BY b.created_at DESC
    `;

    const { results } = await env.DB.prepare(query).all();
    const rawBookings = results || [];

    // 防呆統計 (P1 級別)：計算未取消訂單中各末五碼出現次數，標記重複撞號以提醒管家比對金額
    const last5Counts = {};
    for (const b of rawBookings) {
      if (b.status !== 'CANCELLED' && b.bank_last_5) {
        const code = String(b.bank_last_5).trim().toUpperCase();
        last5Counts[code] = (last5Counts[code] || 0) + 1;
      }
    }

    const enhancedBookings = rawBookings.map(b => {
      const code = b.bank_last_5 ? String(b.bank_last_5).trim().toUpperCase() : null;
      return {
        ...b,
        hasDuplicateBankLast5: code ? (last5Counts[code] > 1) : false
      };
    });

    return Response.json({
      success: true,
      bookings: enhancedBookings
    });
  } catch (err) {
    return Response.json(
      { success: false, message: '查詢訂單列表失敗: ' + err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/bookings
 * 
 * 管家後台直接新增/代客下訂單 (手動立單)
 * 遵守後端規範：防撞期重疊檢查、參數化綁定、金流防竄改計算、審計日誌
 */
export async function onRequestPost(context) {
  const { env, request } = context;

  if (!env.DB) {
    return Response.json({ success: false, message: 'DB not bound' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const {
      roomId = 'villa-full',
      guestName,
      guestPhone,
      guestEmail = '',
      lineId = '',
      guestCount = 14,
      checkIn,
      checkOut,
      depositStatus = 'PAID', // 後台代訂預設為 PAID 或 UNPAID
      status = 'CONFIRMED',   // 後台代訂預設為 CONFIRMED 或 PENDING
      specialRequests = '',
      customTotalAmount       // 可自訂總額 (若留空則由系統動態算價)
    } = body;

    // 1. 必填校驗
    if (!guestName || !guestName.trim()) {
      return Response.json({ success: false, message: '請填寫訂房旅客姓名。' }, { status: 400 });
    }
    if (!guestPhone || !guestPhone.trim()) {
      return Response.json({ success: false, message: '請填寫聯絡電話。' }, { status: 400 });
    }
    if (!checkIn || !checkOut) {
      return Response.json({ success: false, message: '請選擇入住日期與退房日期。' }, { status: 400 });
    }

    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    if (isNaN(inDate.getTime()) || isNaN(outDate.getTime()) || inDate >= outDate) {
      return Response.json({ success: false, message: '入住日期必須早於退房日期 (格式 YYYY-MM-DD)。' }, { status: 400 });
    }

    const diffTime = Math.abs(outDate - inDate);
    const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // 2. 核心防呆：檔期撞期衝突檢查 (Overlap Check)
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
        message: `所選檔期【${checkIn} 至 ${checkOut}】已被其他訂單或鎖房佔用，無法重複立單！`
      }, { status: 409 });
    }

    // 3. 房型檢查
    const room = await env.DB.prepare('SELECT * FROM rooms WHERE id = ?').bind(roomId).first();
    const roomName = room ? room.name : '山語 Villa 全包棟別墅';

    // 4. 計算總金額與 50% 定金 (可自訂或系統計價)
    let totalAmount = 0;
    if (customTotalAmount !== undefined && customTotalAmount !== null && customTotalAmount !== '' && !isNaN(Number(customTotalAmount))) {
      totalAmount = Math.max(0, Math.round(Number(customTotalAmount)));
    } else {
      const DEFAULT_HOLIDAYS = [
        { start: '2026-12-24', end: '2026-12-27', price: 47000 },
        { start: '2026-12-31', end: '2027-01-01', price: 47000 },
        { start: '2027-01-01', end: '2027-01-03', price: 47000 },
        { start: '2027-02-04', end: '2027-02-10', price: 50000 },
        { start: '2027-02-26', end: '2027-03-01', price: 38000 }
      ];
      let dynamicHolidays = DEFAULT_HOLIDAYS;
      let t1Price = 20000, t2Price = 25000, t3Price = 30000, weekendPrice = 35000;
      let t1MaxGuests = 10, t2MaxGuests = 14, systemMaxCapacity = 18;

      try {
        const pRows = await env.DB.prepare('SELECT setting_key, setting_value FROM pricing_settings').all();
        if (pRows?.results) {
          for (const row of pRows.results) {
            if (row.setting_key === 'weekday_tier1_price') t1Price = Number(row.setting_value) || t1Price;
            if (row.setting_key === 'weekday_tier2_price') t2Price = Number(row.setting_value) || t2Price;
            if (row.setting_key === 'weekday_tier3_price') t3Price = Number(row.setting_value) || t3Price;
            if (row.setting_key === 'weekday_tier1_max_guests') t1MaxGuests = Number(row.setting_value) || t1MaxGuests;
            if (row.setting_key === 'weekday_tier2_max_guests') t2MaxGuests = Number(row.setting_value) || t2MaxGuests;
            if (row.setting_key === 'weekend_price') weekendPrice = Number(row.setting_value) || weekendPrice;
            if (row.setting_key === 'max_capacity') systemMaxCapacity = Number(row.setting_value) || systemMaxCapacity;
          }
        }
        const hRows = await env.DB.prepare('SELECT start_date, end_date, price FROM holiday_rates WHERE is_active = 1').all();
        if (hRows?.results?.length > 0) {
          dynamicHolidays = hRows.results.map(r => ({ start: r.start_date, end: r.end_date, price: Number(r.price) }));
        }
      } catch {}

      const getWeekdayTierPrice = (count) => {
        const g = Number(count) || systemMaxCapacity;
        if (g <= t1MaxGuests) return t1Price;
        if (g <= t2MaxGuests) return t2Price;
        return t3Price;
      };

      let curr = new Date(checkIn);
      const end = new Date(checkOut);
      while (curr < end) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        const holiday = dynamicHolidays.find(h => dateStr >= h.start && dateStr <= h.end);
        if (holiday) {
          totalAmount += holiday.price;
        } else {
          const dayOfWeek = curr.getDay();
          if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
            totalAmount += (room?.holiday_price || weekendPrice);
          } else {
            totalAmount += getWeekdayTierPrice(guestCount);
          }
        }
        curr.setDate(curr.getDate() + 1);
      }
    }

    const depositAmount = Math.round(totalAmount * 0.5);

    // 5. 產生唯一訂單編號
    const dateCode = checkIn.replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingId = `SY-${dateCode}-${randSuffix}`;

    // 6. 寫入 bookings 資料表與每日排他庫存表
    const batchStatements = [
      env.DB.prepare(`
        INSERT INTO bookings (
          id, room_id, guest_name, guest_phone, guest_email, line_id,
          guest_count, check_in, check_out, nights, total_amount, deposit_amount,
          deposit_status, status, source, special_requests
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'MANUAL_ADMIN', ?)
      `).bind(
        bookingId,
        roomId,
        guestName.trim(),
        guestPhone.trim(),
        guestEmail.trim(),
        lineId.trim(),
        Number(guestCount) || 14,
        checkIn,
        checkOut,
        nights,
        totalAmount,
        depositAmount,
        depositStatus,
        status,
        specialRequests.trim()
      )
    ];

    let cDate = new Date(checkIn);
    const oDate = new Date(checkOut);
    while (cDate < oDate) {
      const y = cDate.getFullYear();
      const m = String(cDate.getMonth() + 1).padStart(2, '0');
      const d = String(cDate.getDate()).padStart(2, '0');
      batchStatements.push(
        env.DB.prepare(`
          INSERT OR REPLACE INTO room_daily_inventory (room_id, occupy_date, booking_id, source)
          VALUES (?, ?, ?, 'BOOKING')
        `).bind(roomId, `${y}-${m}-${d}`, bookingId)
      );
      cDate.setDate(cDate.getDate() + 1);
    }

    await env.DB.batch(batchStatements);

    // 7. 寫入審計日誌
    try {
      const currentAdmin = context.data?.adminUser;
      const operatorTag = currentAdmin?.displayName 
        ? `${currentAdmin.displayName} (${currentAdmin.username})` 
        : 'admin';

      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('booking', 'CREATE_BOOKING', ?, ?, ?, ?)
      `).bind(
        bookingId,
        `管家後台代客立單：${guestName.trim()}（${checkIn} ~ ${checkOut}，共 ${nights} 晚，NT$ ${totalAmount.toLocaleString()}）`,
        JSON.stringify({ bookingId, guestName: guestName.trim(), checkIn, checkOut, totalAmount, depositStatus, status }),
        operatorTag
      ).run();
    } catch (logErr) {
      console.warn('寫入 create booking audit log 警告:', logErr.message);
    }

    return Response.json({
      success: true,
      message: `訂單【${bookingId}】（${guestName.trim()} 貴賓）已成功建立！`,
      booking: {
        id: bookingId,
        room_name: roomName,
        guest_name: guestName.trim(),
        guest_phone: guestPhone.trim(),
        guest_email: guestEmail.trim(),
        line_id: lineId.trim(),
        guest_count: Number(guestCount) || 14,
        check_in: checkIn,
        check_out: checkOut,
        nights,
        total_amount: totalAmount,
        deposit_amount: depositAmount,
        deposit_status: depositStatus,
        status,
        special_requests: specialRequests.trim()
      }
    }, { status: 201 });

  } catch (err) {
    return Response.json({
      success: false,
      message: '建立訂單失敗: ' + err.message
    }, { status: 500 });
  }
}

