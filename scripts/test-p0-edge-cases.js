import { DatabaseSync } from 'node:sqlite';
import { onRequestPost as createBooking } from '../functions/api/bookings/index.js';
import { onRequestPatch as patchAdminBooking } from '../functions/api/admin/bookings/[id].js';
import { onRequestGet as getAvailability } from '../functions/api/availability.js';

const dbPath = 'd:/hotel/Ann_Villa/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/f0dcbcf5840a2643f416c808c0e38b6cb6a61d2f431f45a8a6dafb26fbd23ac7.sqlite';

function createMockD1() {
  const db = new DatabaseSync(dbPath);

  function prepare(sql) {
    let boundParams = [];
    return {
      bind(...params) {
        boundParams = params;
        return this;
      },
      async first(col) {
        try {
          const stmt = db.prepare(sql);
          const row = stmt.get(...boundParams);
          if (!row) return null;
          if (col) return row[col];
          return row;
        } catch (err) {
          throw err;
        }
      },
      async all() {
        try {
          const stmt = db.prepare(sql);
          const results = stmt.all(...boundParams);
          return { results };
        } catch (err) {
          throw err;
        }
      },
      async run() {
        try {
          const stmt = db.prepare(sql);
          const info = stmt.run(...boundParams);
          return { success: true, meta: { last_row_id: info.lastInsertRowid, changes: info.changes } };
        } catch (err) {
          throw err;
        }
      }
    };
  }

  async function batch(statements) {
    // SQLite transaction
    db.exec('BEGIN TRANSACTION;');
    try {
      const results = [];
      for (const s of statements) {
        const res = await s.run();
        results.push(res);
      }
      db.exec('COMMIT;');
      return results;
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }

  return { db, prepare, batch };
}

async function runTests() {
  console.log('====================================================');
  console.log('山語 Villa - P0 防呆與極端案例自動化驗證測試套件');
  console.log('====================================================\n');

  const { db, prepare, batch } = createMockD1();
  const mockEnv = { DB: { prepare, batch } };

  let passedCount = 0;
  let totalCount = 0;

  function assert(title, condition, extra = '') {
    totalCount++;
    if (condition) {
      console.log(`✅ [PASS] ${title} ${extra}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${title} ${extra}`);
    }
  }

  // TC-01: 過去日期阻擋
  {
    const req = new Request('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'villa-full',
        guestName: '測試過去預約',
        guestPhone: '0912345678',
        guestEmail: 'test@example.com',
        checkIn: '2020-01-01',
        checkOut: '2020-01-03',
        guestCount: 14
      })
    });
    const res = await createBooking({ env: mockEnv, request: req });
    const data = await res.json();
    assert('TC-01 過去日期阻擋', res.status === 400 && data.message.includes('入住日期不得早於今日'), `(Status: ${res.status}, msg: ${data.message})`);
  }

  // TC-02: 退房早於入住
  {
    const req = new Request('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'villa-full',
        guestName: '測試逆向日期',
        guestPhone: '0912345678',
        guestEmail: 'test@example.com',
        checkIn: '2027-04-10',
        checkOut: '2027-04-08',
        guestCount: 14
      })
    });
    const res = await createBooking({ env: mockEnv, request: req });
    const data = await res.json();
    assert('TC-02 退房早於入住阻擋', res.status === 400 && data.message.includes('退房日期必須晚於入住日期'), `(Status: ${res.status}, msg: ${data.message})`);
  }

  // TC-03: 零晚入住 (同日入住退房)
  {
    const req = new Request('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'villa-full',
        guestName: '測試零晚',
        guestPhone: '0912345678',
        guestEmail: 'test@example.com',
        checkIn: '2027-04-10',
        checkOut: '2027-04-10',
        guestCount: 14
      })
    });
    const res = await createBooking({ env: mockEnv, request: req });
    const data = await res.json();
    assert('TC-03 零晚入住阻擋', res.status === 400 && data.message.includes('退房日期必須晚於入住日期'), `(Status: ${res.status}, msg: ${data.message})`);
  }

  // TC-04: 超過最大住宿天數 (14晚上限)
  {
    const req = new Request('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'villa-full',
        guestName: '測試長租',
        guestPhone: '0912345678',
        guestEmail: 'test@example.com',
        checkIn: '2027-04-01',
        checkOut: '2027-04-20', // 19 晚
        guestCount: 14
      })
    });
    const res = await createBooking({ env: mockEnv, request: req });
    const data = await res.json();
    assert('TC-04 超長住宿天數阻擋 (14晚)', res.status === 400 && data.message.includes('單次線上包棟預約上限為 14 晚'), `(Status: ${res.status}, msg: ${data.message})`);
  }

  // TC-04b: 遠期窗口阻擋 (超過 180 天)
  {
    const req = new Request('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'villa-full',
        guestName: '測試超遠期',
        guestPhone: '0912345678',
        guestEmail: 'test@example.com',
        checkIn: '2029-01-01',
        checkOut: '2029-01-03',
        guestCount: 14
      })
    });
    const res = await createBooking({ env: mockEnv, request: req });
    const data = await res.json();
    assert('TC-04b 遠期開放窗口防呆 (180天)', res.status === 400 && data.message.includes('僅開放未來 180 天內之預約'), `(Status: ${res.status}, msg: ${data.message})`);
  }

  // TC-05: 人數邊界值 (0人與負數)
  {
    const req1 = new Request('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'villa-full',
        guestName: '測試零人',
        guestPhone: '0912345678',
        guestEmail: 'test@example.com',
        checkIn: '2027-04-10',
        checkOut: '2027-04-12',
        guestCount: 0
      })
    });
    const res1 = await createBooking({ env: mockEnv, request: req1 });
    const data1 = await res1.json();

    const req2 = new Request('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'villa-full',
        guestName: '測試超載人',
        guestPhone: '0912345678',
        guestEmail: 'test@example.com',
        checkIn: '2027-04-10',
        checkOut: '2027-04-12',
        guestCount: 99
      })
    });
    const res2 = await createBooking({ env: mockEnv, request: req2 });
    const data2 = await res2.json();

    assert('TC-05 入住人數邊界防呆 (0人與超載99人)', res1.status === 400 && res2.status === 400, `(0人: ${res1.status}, 99人: ${res2.status})`);
  }

  // TC-07: 正常立單與高併發撞期排他鎖 (room_daily_inventory)
  let testBookingId1 = null;
  const testCheckIn = '2027-04-15';
  const testCheckOut = '2027-04-17';
  {
    // 清理舊測試資料
    db.exec(`DELETE FROM bookings WHERE id LIKE 'TEST-%' OR guest_name LIKE 'P0測試%'`);
    db.exec(`DELETE FROM room_daily_inventory WHERE occupy_date IN ('2027-04-15', '2027-04-16', '2027-04-17')`);

    // 1. 送出第一筆預訂 (2027-04-15 ~ 2027-04-17)
    const req1 = new Request('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'villa-full',
        guestName: 'P0測試貴賓A',
        guestPhone: '0988111222',
        guestEmail: 'guestA@example.com',
        checkIn: testCheckIn,
        checkOut: testCheckOut,
        guestCount: 14
      })
    });
    const res1 = await createBooking({ env: mockEnv, request: req1 });
    const data1 = await res1.json();
    testBookingId1 = data1.booking?.id;

    assert('TC-07a 正常訂單建立成功並寫入每日庫存', res1.status === 201 && testBookingId1, `(Order ID: ${testBookingId1})`);

    // 驗證庫存表記錄
    const invRows = db.prepare("SELECT * FROM room_daily_inventory WHERE booking_id = ?").all(testBookingId1);
    assert('TC-07b 每日庫存排他表記錄 2 晚', invRows.length === 2 && invRows[0].occupy_date === '2027-04-15' && invRows[1].occupy_date === '2027-04-16', `(Rows count: ${invRows.length})`);

    // 2. 模擬第二位旅客在同時間送出重疊訂單 (2027-04-16 ~ 2027-04-18)
    const req2 = new Request('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'villa-full',
        guestName: 'P0測試貴賓B',
        guestPhone: '0988333444',
        guestEmail: 'guestB@example.com',
        checkIn: '2027-04-16',
        checkOut: '2027-04-18',
        guestCount: 14
      })
    });
    const res2 = await createBooking({ env: mockEnv, request: req2 });
    const data2 = await res2.json();
    assert('TC-07c 併發重疊檔期被排他衝突攔截 (409 Conflict)', res2.status === 409 && data2.message.includes('已被其他旅客預約'), `(Status: ${res2.status}, msg: ${data2.message})`);
  }

  // TC-08: 取消訂單釋放庫存 & 恢復訂單防撞檢驗
  {
    // 1. 取消訂單 A
    const cancelReq = new Request(`http://localhost/api/admin/bookings/${testBookingId1}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' })
    });
    const cancelRes = await patchAdminBooking({
      env: mockEnv,
      request: cancelReq,
      params: { id: testBookingId1 },
      data: { adminUser: { username: 'test-admin', displayName: '測試管家' } }
    });
    const cancelData = await cancelRes.json();
    assert('TC-08a 管家取消訂單成功', cancelRes.status === 200 && cancelData.status === 'CANCELLED');

    // 驗證庫存表已清空釋放
    const invAfterCancel = db.prepare("SELECT * FROM room_daily_inventory WHERE booking_id = ?").all(testBookingId1);
    assert('TC-08b 取消後庫存表立即物理釋放', invAfterCancel.length === 0);

    // 2. 建立新訂單 C 佔用同一檔期 (2027-04-15 ~ 2027-04-17)
    const reqC = new Request('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'villa-full',
        guestName: 'P0測試貴賓C',
        guestPhone: '0988555666',
        guestEmail: 'guestC@example.com',
        checkIn: testCheckIn,
        checkOut: testCheckOut,
        guestCount: 14
      })
    });
    const resC = await createBooking({ env: mockEnv, request: reqC });
    const dataC = await resC.json();
    const testBookingIdC = dataC.booking?.id;
    assert('TC-08c 新旅客 C 成功遞補釋放後之檔期', resC.status === 201 && testBookingIdC);

    // 3. 管家此時嘗試恢復被取消的訂單 A -> 必須被防撞機制攔截！
    const restoreReq = new Request(`http://localhost/api/admin/bookings/${testBookingId1}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CONFIRMED' })
    });
    const restoreRes = await patchAdminBooking({
      env: mockEnv,
      request: restoreReq,
      params: { id: testBookingId1 },
      data: { adminUser: { username: 'test-admin', displayName: '測試管家' } }
    });
    const restoreData = await restoreRes.json();
    assert('TC-08d 恢復訂單防撞檢驗：已被 C 佔用時強制攔截 (409 Conflict)', restoreRes.status === 409 && restoreData.message.includes('已被其他有效訂單或鎖房佔用'), `(Status: ${restoreRes.status}, msg: ${restoreData.message})`);

    // 清理測試單 C
    if (testBookingIdC) {
      db.exec(`DELETE FROM bookings WHERE id = '${testBookingIdC}'`);
      db.exec(`DELETE FROM room_daily_inventory WHERE booking_id = '${testBookingIdC}'`);
    }
    if (testBookingId1) {
      db.exec(`DELETE FROM bookings WHERE id = '${testBookingId1}'`);
      db.exec(`DELETE FROM room_daily_inventory WHERE booking_id = '${testBookingId1}'`);
    }
  }

  // TC-10: 逾期未付定金幽靈訂單自動巡檢釋放
  {
    // 建立一張 30 小時前的過期 PENDING 訂單
    const staleId = 'TEST-STALE-ORDER-001';
    db.exec(`DELETE FROM bookings WHERE id = '${staleId}'`);
    db.exec(`DELETE FROM room_daily_inventory WHERE booking_id = '${staleId}'`);

    db.exec(`
      INSERT INTO bookings (
        id, room_id, guest_name, guest_phone, guest_email, guest_count,
        check_in, check_out, nights, total_amount, deposit_amount,
        deposit_status, status, source, created_at
      ) VALUES (
        '${staleId}', 'villa-full', 'P0過期幽靈住客', '0911222333', 'ghost@example.com', 14,
        '2027-04-25', '2027-04-27', 2, 50000, 25000,
        'UNPAID', 'PENDING', 'OFFICIAL', DATETIME('now', '-30 hours')
      )
    `);
    db.exec(`
      INSERT INTO room_daily_inventory (room_id, occupy_date, booking_id, source)
      VALUES ('villa-full', '2027-04-25', '${staleId}', 'BOOKING'),
             ('villa-full', '2027-04-26', '${staleId}', 'BOOKING')
    `);

    // 觸發 availability 查詢
    const availRes = await getAvailability({ env: mockEnv });
    const availData = await availRes.json();

    // 驗證過期單已自動轉為 CANCELLED，且庫存已釋放
    const staleRow = db.prepare("SELECT status, special_requests FROM bookings WHERE id = ?").get(staleId);
    const staleInv = db.prepare("SELECT * FROM room_daily_inventory WHERE booking_id = ?").all(staleId);

    assert('TC-10a 逾期 24 小時未付單自動被標記為 CANCELLED', staleRow.status === 'CANCELLED' && staleRow.special_requests.includes('系統自動逾期釋放'), `(Status: ${staleRow.status})`);
    assert('TC-10b 逾期未付單庫存已自動物理清除釋放', staleInv.length === 0, `(Inv Count: ${staleInv.length})`);

    // 清理測試幽靈單
    db.exec(`DELETE FROM bookings WHERE id = '${staleId}'`);
  }

  db.close();

  console.log('\n====================================================');
  console.log(`測試執行總結: 共 ${totalCount} 項測試，通過: ${passedCount}，失敗: ${totalCount - passedCount}`);
  console.log('====================================================');

  if (passedCount === totalCount) {
    console.log('🎉 所有 P0 防呆與極端案例驗證 100% 全數通過！');
    process.exit(0);
  } else {
    console.error('⚠️ 部分測試失敗，請檢查上述錯誤訊息！');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('測試套件執行異常:', err);
  process.exit(1);
});
