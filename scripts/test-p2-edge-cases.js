import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import { onRequestPost as createBooking } from '../functions/api/bookings/index.js';
import { onRequestPost as lookupBookings } from '../functions/api/bookings/lookup.js';
import { onRequestPost as reportPayment } from '../functions/api/bookings/report-payment.js';

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
  console.log('山語 Villa - P2 資安防護與反爬蟲濫用自動化驗證測試套件');
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

  // TC-P2-01: 幽靈批量預約防護 (同一電話/IP 24h 內限 2 筆 PENDING)
  {
    const spamPhone = '0988777666';
    const testIp = '192.168.10.99';
    db.exec(`DELETE FROM bookings WHERE guest_phone = '${spamPhone}'`);
    db.exec(`DELETE FROM room_daily_inventory WHERE occupy_date BETWEEN '2027-03-10' AND '2027-03-20'`);

    // 建立第 1 筆 (2027-03-10 ~ 2027-03-12)
    const req1 = new Request('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': testIp },
      body: JSON.stringify({
        guestName: '批量客1',
        guestPhone: spamPhone,
        guestEmail: 'spam1@example.com',
        checkIn: '2027-03-10',
        checkOut: '2027-03-12',
        guestCount: 14
      })
    });
    const res1 = await createBooking({ env: mockEnv, request: req1 });

    // 建立第 2 筆 (2027-03-12 ~ 2027-03-14)
    const req2 = new Request('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': testIp },
      body: JSON.stringify({
        guestName: '批量客2',
        guestPhone: spamPhone,
        guestEmail: 'spam2@example.com',
        checkIn: '2027-03-12',
        checkOut: '2027-03-14',
        guestCount: 14
      })
    });
    const res2 = await createBooking({ env: mockEnv, request: req2 });

    // 嘗試建立第 3 筆 (2027-03-14 ~ 2027-03-16) -> 必須被 429 阻擋！
    const req3 = new Request('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': testIp },
      body: JSON.stringify({
        guestName: '批量客3',
        guestPhone: spamPhone,
        guestEmail: 'spam3@example.com',
        checkIn: '2027-03-14',
        checkOut: '2027-03-16',
        guestCount: 14
      })
    });
    const res3 = await createBooking({ env: mockEnv, request: req3 });
    const data3 = await res3.json();

    assert('TC-P2-01a 第 1 筆與第 2 筆預訂正常放行 (201 Created)', res1.status === 201 && res2.status === 201, `(Res1: ${res1.status}, Res2: ${res2.status})`);
    assert('TC-P2-01b 第 3 筆未付款預訂被配額限制阻擋 (429 Too Many Requests)', res3.status === 429 && data3.message.includes('最多僅允許預約 2 筆待付款訂單'), `(Status: ${res3.status}, msg: ${data3.message})`);

    // 清理
    db.exec(`DELETE FROM bookings WHERE guest_phone = '${spamPhone}'`);
    db.exec(`DELETE FROM room_daily_inventory WHERE occupy_date BETWEEN '2027-03-10' AND '2027-03-16'`);
  }

  // TC-P2-02: 查單端點速率限制 (Rate Limiting: 15 次 / 60 秒)
  {
    const attackIp = '10.0.0.123';
    db.exec(`DELETE FROM rate_limit_logs WHERE rate_key LIKE 'lookup:%'`);

    let lastResStatus = 200;
    let lastData = null;
    for (let i = 0; i < 16; i++) {
      const req = new Request('http://localhost/api/bookings/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': attackIp },
        body: JSON.stringify({ phone: '0912345678', email: 'test@example.com' })
      });
      const res = await lookupBookings({ env: mockEnv, request: req });
      lastResStatus = res.status;
      lastData = await res.json();
    }
    assert('TC-P2-02 查單端點突發頻率限制 (第 16 次觸發 429)', lastResStatus === 429 && lastData.message.includes('查詢頻率過高'), `(Status: ${lastResStatus}, msg: ${lastData.message})`);
    db.exec(`DELETE FROM rate_limit_logs WHERE rate_key LIKE 'lookup:%'`);
  }

  // TC-P2-03: 查單連續比對失敗鎖定 (Brute-Force Fail Lock: 5 次失敗鎖定 15 分鐘)
  {
    const bruteForceIp = '10.0.0.222';
    db.exec(`DELETE FROM rate_limit_logs WHERE rate_key = 'lookup:fail:ip:${bruteForceIp}'`);

    // 模擬 5 次輸入不存在的手機信箱比對失敗
    for (let i = 0; i < 5; i++) {
      const req = new Request('http://localhost/api/bookings/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': bruteForceIp },
        body: JSON.stringify({ phone: `099900000${i}`, email: `nonexistent${i}@example.com` })
      });
      await lookupBookings({ env: mockEnv, request: req });
    }

    // 第 6 次查詢 -> 即使查正確號碼也應被鎖定阻擋！
    const reqBlocked = new Request('http://localhost/api/bookings/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': bruteForceIp },
      body: JSON.stringify({ phone: '0912345678', email: 'correct@example.com' })
    });
    const resBlocked = await lookupBookings({ env: mockEnv, request: reqBlocked });
    const dataBlocked = await resBlocked.json();
    assert('TC-P2-03 查單連續 5 次失敗自動防暴力鎖定 15 分鐘 (429 Too Many Requests)', resBlocked.status === 429 && dataBlocked.message.includes('連續查詢比對失敗次數過多'), `(Status: ${resBlocked.status}, msg: ${dataBlocked.message})`);

    db.exec(`DELETE FROM rate_limit_logs WHERE rate_key = 'lookup:fail:ip:${bruteForceIp}'`);
  }

  // TC-P2-04: 回報末五碼連續失敗鎖定 (Report Payment Brute-Force Fail Lock)
  {
    const hackIp = '10.0.0.333';
    db.exec(`DELETE FROM rate_limit_logs WHERE rate_key LIKE 'report:%'`);

    // 模擬連續 5 次錯誤訂單號碼回報
    for (let i = 0; i < 5; i++) {
      const req = new Request('http://localhost/api/bookings/report-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': hackIp },
        body: JSON.stringify({
          bookingId: `SY-FAKE-ORDER-${i}`,
          phone: '0912345678',
          email: 'test@example.com',
          bankLast5: '12345'
        })
      });
      await reportPayment({ env: mockEnv, request: req });
    }

    // 第 6 次回報 -> 應直接被 IP 失敗鎖定攔截
    const reqBlocked = new Request('http://localhost/api/bookings/report-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': hackIp },
      body: JSON.stringify({
        bookingId: 'SY-20261214-5512',
        phone: '0912345678',
        email: 'test@example.com',
        bankLast5: '88219'
      })
    });
    const resBlocked = await reportPayment({ env: mockEnv, request: reqBlocked });
    const dataBlocked = await resBlocked.json();
    assert('TC-P2-04 回報末五碼連續 5 次失敗自動鎖定 (429 Too Many Requests)', resBlocked.status === 429 && dataBlocked.message.includes('比對失敗次數過多'), `(Status: ${resBlocked.status}, msg: ${dataBlocked.message})`);

    db.exec(`DELETE FROM rate_limit_logs WHERE rate_key LIKE 'report:%'`);
  }

  // TC-P2-05: 輸入欄位 XSS 標籤消毒防護
  {
    db.exec(`DELETE FROM room_daily_inventory WHERE occupy_date BETWEEN '2027-03-20' AND '2027-03-22'`);

    const req = new Request('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestName: '<script>alert("xss")</script>王大明',
        guestPhone: '0911223344',
        guestEmail: 'xss@example.com',
        checkIn: '2027-03-20',
        checkOut: '2027-03-22',
        guestCount: 14,
        specialRequests: '<img src=x onerror=alert(1)>希望提早入住烤肉<style>body{display:none}</style>'
      })
    });
    const res = await createBooking({ env: mockEnv, request: req });
    const data = await res.json();
    const createdId = data.booking?.id;

    assert('TC-P2-05a XSS 惡意內容送單被消毒並成功建立', res.status === 201 && createdId, `(Created ID: ${createdId})`);

    const row = db.prepare("SELECT guest_name, special_requests, client_ip FROM bookings WHERE id = ?").get(createdId);
    assert('TC-P2-05b 姓名與備註 HTML/XSS 標籤已被完全消毒', !row.guest_name.includes('<script>') && !row.special_requests.includes('<img') && !row.special_requests.includes('<style>') && row.guest_name.includes('王大明') && row.special_requests.includes('烤肉'), `(Name: ${row.guest_name}, Note: ${row.special_requests})`);

    db.exec(`DELETE FROM bookings WHERE id = '${createdId}'`);
    db.exec(`DELETE FROM room_daily_inventory WHERE booking_id = '${createdId}'`);
  }

  // TC-P2-06: 安全標頭驗證 (public/_headers)
  {
    const headersContent = fs.readFileSync('d:/hotel/Ann_Villa/public/_headers', 'utf-8');
    const hasNosniff = headersContent.includes('X-Content-Type-Options: nosniff');
    const hasFrameOptions = headersContent.includes('X-Frame-Options: SAMEORIGIN');
    const hasReferrer = headersContent.includes('Referrer-Policy: strict-origin-when-cross-origin');
    assert('TC-P2-06 public/_headers 安全防護標頭配置齊全', hasNosniff && hasFrameOptions && hasReferrer, '(nosniff, SAMEORIGIN, strict-origin)');
  }

  db.close();

  console.log('\n====================================================');
  console.log(`測試執行總結: 共 ${totalCount} 項測試，通過: ${passedCount}，失敗: ${totalCount - passedCount}`);
  console.log('====================================================');

  if (passedCount === totalCount) {
    console.log('🎉 所有 P2 資安防護與反爬蟲濫用極限驗證 100% 全數通過！');
    process.exit(0);
  } else {
    console.error('⚠️ 部分測試失敗，請檢查上述錯誤訊息！');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('P2 測試套件執行異常:', err);
  process.exit(1);
});
