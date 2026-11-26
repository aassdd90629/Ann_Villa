import { DatabaseSync } from 'node:sqlite';
import { onRequestPost as createBooking } from '../functions/api/bookings/index.js';
import { onRequestPost as reportPayment } from '../functions/api/bookings/report-payment.js';
import { onRequestPost as createBlock } from '../functions/api/admin/blocks/index.js';
import { onRequestGet as getAdminBookings } from '../functions/api/admin/bookings/index.js';

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
        const stmt = db.prepare(sql);
        const row = stmt.get(...boundParams);
        if (!row) return null;
        if (col) return row[col];
        return row;
      },
      async all() {
        const stmt = db.prepare(sql);
        const results = stmt.all(...boundParams);
        return { results };
      },
      async run() {
        const stmt = db.prepare(sql);
        const info = stmt.run(...boundParams);
        return { success: true, meta: { last_row_id: info.lastInsertRowid, changes: info.changes } };
      }
    };
  }

  async function batch(statements) {
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
  console.log('山語 Villa - P1 營運與金流防呆自動化驗證測試套件');
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

  // TC-P1-01: 手機號碼格式防呆 (TC-06)
  {
    // 不足碼
    const req1 = new Request('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestName: '測試手機少碼',
        guestPhone: '09123456', // 僅 8 碼
        guestEmail: 'valid@example.com',
        checkIn: '2027-04-10',
        checkOut: '2027-04-12',
        guestCount: 14
      })
    });
    const res1 = await createBooking({ env: mockEnv, request: req1 });
    const data1 = await res1.json();

    // 含有英文字
    const req2 = new Request('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestName: '測試手機含英文',
        guestPhone: '091234abcd',
        guestEmail: 'valid@example.com',
        checkIn: '2027-04-10',
        checkOut: '2027-04-12',
        guestCount: 14
      })
    });
    const res2 = await createBooking({ env: mockEnv, request: req2 });
    const data2 = await res2.json();

    assert('TC-06a 手機少碼阻擋 (HTTP 400)', res1.status === 400 && data1.message.includes('手機號碼格式不符'));
    assert('TC-06b 手機非純數字阻擋 (HTTP 400)', res2.status === 400 && data2.message.includes('手機號碼格式不符'));
  }

  // TC-P1-02: 電子信箱格式防呆
  {
    const req = new Request('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestName: '測試無效信箱',
        guestPhone: '0912345678',
        guestEmail: 'invalid-email-format',
        checkIn: '2027-04-10',
        checkOut: '2027-04-12',
        guestCount: 14
      })
    });
    const res = await createBooking({ env: mockEnv, request: req });
    const data = await res.json();
    assert('TC-P1-02 電子信箱格式錯誤阻擋 (HTTP 400)', res.status === 400 && data.message.includes('電子信箱格式無效'));
  }

  // TC-P1-03: 姓名超長與空白防呆
  {
    const req = new Request('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestName: 'A'.repeat(60), // 超過 50 字
        guestPhone: '0912345678',
        guestEmail: 'test@example.com',
        checkIn: '2027-04-10',
        checkOut: '2027-04-12',
        guestCount: 14
      })
    });
    const res = await createBooking({ env: mockEnv, request: req });
    const data = await res.json();
    assert('TC-P1-03 姓名長度超過上限阻擋 (HTTP 400)', res.status === 400 && data.message.includes('長度須介於 1 至 50 字元'));
  }

  // TC-P1-04: 匯款末五碼填報歷程保存 (防盲目覆寫)
  {
    const testId = 'TEST-ORDER-P1-REMIT';
    db.exec(`DELETE FROM bookings WHERE id = '${testId}'`);
    db.exec(`
      INSERT INTO bookings (
        id, room_id, guest_name, guest_phone, guest_email, guest_count,
        check_in, check_out, nights, total_amount, deposit_amount,
        deposit_status, status, source
      ) VALUES (
        '${testId}', 'villa-full', 'P1歷程住客', '0922333444', 'remit@example.com', 14,
        '2027-04-20', '2027-04-22', 2, 40000, 20000,
        'UNPAID', 'PENDING', 'OFFICIAL'
      )
    `);

    // 第一次回報: 11111
    const req1 = new Request('http://localhost/api/bookings/report-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: testId,
        phone: '0922333444',
        email: 'remit@example.com',
        bankLast5: '11111',
        paymentNote: '網銀國泰轉帳'
      })
    });
    const res1 = await reportPayment({ env: mockEnv, request: req1 });
    const data1 = await res1.json();
    assert('TC-P1-04a 初次回報末五碼成功', res1.status === 200 && data1.bankLast5 === '11111');

    // 第二次回報更換末五碼: 22222
    const req2 = new Request('http://localhost/api/bookings/report-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: testId,
        phone: '0922333444',
        email: 'remit@example.com',
        bankLast5: '22222',
        paymentNote: '改由玉山轉帳'
      })
    });
    const res2 = await reportPayment({ env: mockEnv, request: req2 });
    const data2 = await res2.json();

    const rowAfter = db.prepare("SELECT bank_last_5, payment_note FROM bookings WHERE id = ?").get(testId);
    assert('TC-P1-04b 第二次回報成功更新最新末五碼', rowAfter.bank_last_5 === '22222');
    assert('TC-P1-04c 備註欄位成功保留前次末五碼歷程', rowAfter.payment_note.includes('原 11111 -> 現 22222') && rowAfter.payment_note.includes('網銀國泰轉帳'), `(Note: ${rowAfter.payment_note})`);

    db.exec(`DELETE FROM bookings WHERE id = '${testId}'`);
  }

  // TC-P1-05: 管家鎖房撞期旅客正式訂單防呆 (TC-09)
  {
    const activeBookingId = 'TEST-ORDER-COLLIDE-01';
    db.exec(`DELETE FROM bookings WHERE id = '${activeBookingId}'`);
    db.exec(`DELETE FROM room_daily_inventory WHERE occupy_date IN ('2027-05-10', '2027-05-11')`);

    db.exec(`
      INSERT INTO bookings (
        id, room_id, guest_name, guest_phone, guest_email, guest_count,
        check_in, check_out, nights, total_amount, deposit_amount,
        deposit_status, status, source
      ) VALUES (
        '${activeBookingId}', 'villa-full', '黃小明貴賓', '0933444555', 'ming@example.com', 14,
        '2027-05-10', '2027-05-12', 2, 40000, 20000,
        'PAID', 'CONFIRMED', 'OFFICIAL'
      )
    `);
    db.exec(`
      INSERT INTO room_daily_inventory (room_id, occupy_date, booking_id, source)
      VALUES ('villa-full', '2027-05-10', '${activeBookingId}', 'BOOKING'),
             ('villa-full', '2027-05-11', '${activeBookingId}', 'BOOKING')
    `);

    // 1. 管家在沒有 force=true 的情況下嘗試關閉 2027-05-10
    const blockReq1 = new Request('http://localhost/api/admin/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'villa-full',
        dates: ['2027-05-10'],
        summary: '管家維護',
        force: false
      })
    });
    const blockRes1 = await createBlock({
      env: mockEnv,
      request: blockReq1,
      data: { adminUser: { username: 'admin', displayName: '總管家' } }
    });
    const blockData1 = await blockRes1.json();
    assert('TC-09a 鎖房撞期旅客正式訂單被阻擋 (409 Conflict)', blockRes1.status === 409 && blockData1.hasConflict && blockData1.message.includes('黃小明'), `(Status: ${blockRes1.status}, msg: ${blockData1.message})`);

    // 2. 管家確認覆蓋，帶入 force=true
    const blockReq2 = new Request('http://localhost/api/admin/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'villa-full',
        dates: ['2027-05-10'],
        summary: '管家緊急維護 (強制)',
        force: true
      })
    });
    const blockRes2 = await createBlock({
      env: mockEnv,
      request: blockReq2,
      data: { adminUser: { username: 'admin', displayName: '總管家' } }
    });
    const blockData2 = await blockRes2.json();
    assert('TC-09b 管家強制鎖房 (force=true) 成功通過', blockRes2.status === 200 && blockData2.success);

    // 清理
    db.exec(`DELETE FROM bookings WHERE id = '${activeBookingId}'`);
    db.exec(`DELETE FROM room_daily_inventory WHERE booking_id = '${activeBookingId}'`);
    db.exec(`DELETE FROM availability_blocks WHERE summary LIKE '%管家緊急維護%'`);
  }

  // TC-P1-06: 多筆訂單末五碼撞號提示 (hasDuplicateBankLast5)
  {
    const idA = 'TEST-DUP-A';
    const idB = 'TEST-DUP-B';
    db.exec(`DELETE FROM bookings WHERE id IN ('${idA}', '${idB}')`);

    db.exec(`
      INSERT INTO bookings (
        id, room_id, guest_name, guest_phone, guest_email, guest_count,
        check_in, check_out, nights, total_amount, deposit_amount,
        deposit_status, status, bank_last_5, source
      ) VALUES 
      ('${idA}', 'villa-full', '撞號客A', '0911000111', 'dupA@example.com', 14, '2027-05-20', '2027-05-22', 2, 40000, 20000, 'UNPAID', 'PENDING', '99887', 'OFFICIAL'),
      ('${idB}', 'villa-full', '撞號客B', '0911000222', 'dupB@example.com', 14, '2027-05-23', '2027-05-25', 2, 40000, 20000, 'UNPAID', 'PENDING', '99887', 'OFFICIAL')
    `);

    const adminBookingsRes = await getAdminBookings({ env: mockEnv });
    const adminBookingsData = await adminBookingsRes.json();
    const orderA = adminBookingsData.bookings.find(b => b.id === idA);
    const orderB = adminBookingsData.bookings.find(b => b.id === idB);

    assert('TC-P1-06a 訂單 A 正確標記 hasDuplicateBankLast5 = true', orderA && orderA.hasDuplicateBankLast5 === true);
    assert('TC-P1-06b 訂單 B 正確標記 hasDuplicateBankLast5 = true', orderB && orderB.hasDuplicateBankLast5 === true);

    db.exec(`DELETE FROM bookings WHERE id IN ('${idA}', '${idB}')`);
  }

  db.close();

  console.log('\n====================================================');
  console.log(`測試執行總結: 共 ${totalCount} 項測試，通過: ${passedCount}，失敗: ${totalCount - passedCount}`);
  console.log('====================================================');

  if (passedCount === totalCount) {
    console.log('🎉 所有 P1 營運與金流防呆驗證 100% 全數通過！');
    process.exit(0);
  } else {
    console.error('⚠️ 部分測試失敗，請檢查上述錯誤訊息！');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('P1 測試套件執行異常:', err);
  process.exit(1);
});
