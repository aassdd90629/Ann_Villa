/**
 * test-p3-edge-cases.js
 * 
 * 山語 Villa - P3 極端業務與現場營運情境自動化驗證測試套件
 * 包含：
 * 1. TC-P3-01a: 天災因素取消訂單（停班停課全額退定）與庫存即時釋放
 * 2. TC-P3-01b: 協商延期保留（保留定金權益，釋放原檔期）
 * 3. TC-P3-02a: 現場費用調整新增（加人加床、清潔費、折讓）
 * 4. TC-P3-02b: 現場應收尾款即時試算驗證 (原總額 + 調整 - 定金 = 尾款)
 * 5. TC-P3-02c: 費用調整項目移除與動態重算
 * 6. TC-P3-02d: 費用調整輸入防呆 (空名稱、非數字金額)
 */

import { DatabaseSync } from 'node:sqlite';
import { onRequestPatch as updateAdminBooking } from '../functions/api/admin/bookings/[id].js';
import {
  onRequestGet as getAdjustments,
  onRequestPost as addAdjustment,
  onRequestDelete as deleteAdjustment
} from '../functions/api/admin/bookings/[id]/adjustments.js';

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

let passed = 0;
let failed = 0;

function assert(description, condition, extraInfo = '') {
  if (condition) {
    console.log(`✅ [PASS] ${description} ${extraInfo}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${description} ${extraInfo}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('山語 Villa - P3 極端業務與現場營運情境自動化驗證測試套件');
  console.log('====================================================\n');

  const mockD1 = createMockD1();
  const db = mockD1.db;
  const mockEnv = { DB: mockD1 };
  const mockAdminContext = {
    env: mockEnv,
    data: { adminUser: { username: 'test-admin', displayName: '測試管家' } }
  };

  const testIdA = 'TEST-ORDER-P3-TYPHOON';
  const testIdB = 'TEST-ORDER-P3-HOLD';
  const testIdC = 'TEST-ORDER-P3-ADJUST';

  // 清理舊測試資料
  db.exec(`
    DELETE FROM bookings WHERE id IN ('${testIdA}', '${testIdB}', '${testIdC}');
    DELETE FROM room_daily_inventory WHERE booking_id IN ('${testIdA}', '${testIdB}', '${testIdC}');
    DELETE FROM booking_adjustments WHERE booking_id IN ('${testIdA}', '${testIdB}', '${testIdC}');
  `);

  // 1. 建立測試訂單 A (天災取消情境)
  db.exec(`
    INSERT INTO bookings (
      id, room_id, guest_name, guest_phone, guest_email, guest_count,
      check_in, check_out, nights, total_amount, deposit_amount,
      deposit_status, status, source
    ) VALUES (
      '${testIdA}', 'villa-full', '天災旅客', '0911223344', 'typhoon@example.com', 14,
      '2027-03-25', '2027-03-27', 2, 40000, 20000,
      'PAID', 'CONFIRMED', 'OFFICIAL'
    );
    INSERT INTO room_daily_inventory (room_id, occupy_date, booking_id, source)
    VALUES ('villa-full', '2027-03-25', '${testIdA}', 'BOOKING'),
           ('villa-full', '2027-03-26', '${testIdA}', 'BOOKING');
  `);

  // TC-P3-01a: 天災因素取消訂單（停班停課全額退定）
  {
    const req = new Request(`http://localhost/api/admin/bookings/${testIdA}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'CANCELLED',
        cancelReasonCategory: 'FORCE_MAJEURE',
        cancelReasonNote: '凱米颱風南投縣政府公告停班停課，已電聯旅客並全額退還定金'
      })
    });

    const res = await updateAdminBooking({ ...mockAdminContext, params: { id: testIdA }, request: req });
    const data = await res.json();

    const row = db.prepare('SELECT status, cancel_reason_category, cancel_reason_note FROM bookings WHERE id = ?').get(testIdA);
    const invCount = db.prepare('SELECT COUNT(*) AS c FROM room_daily_inventory WHERE booking_id = ?').get(testIdA).c;
    const auditLog = db.prepare("SELECT summary FROM admin_audit_logs WHERE target_id = ? AND action = 'CANCEL_BOOKING' ORDER BY created_at DESC LIMIT 1").get(testIdA);

    assert('TC-P3-01a1 天災因素取消訂單放行 (200 OK)', res.status === 200 && data.success);
    assert('TC-P3-01a2 訂單註記 FORCE_MAJEURE 與備註', row.status === 'CANCELLED' && row.cancel_reason_category === 'FORCE_MAJEURE' && row.cancel_reason_note.includes('凱米颱風'));
    assert('TC-P3-01a3 每日排他庫存已物理釋放為空房', invCount === 0);
    assert('TC-P3-01a4 審計日誌高亮記錄天災不可抗力原因', auditLog && auditLog.summary.includes('天災因素（停班停課全額退定）'));
  }

  // 2. 建立測試訂單 B (協商延期保留情境)
  db.exec(`
    INSERT INTO bookings (
      id, room_id, guest_name, guest_phone, guest_email, guest_count,
      check_in, check_out, nights, total_amount, deposit_amount,
      deposit_status, status, source
    ) VALUES (
      '${testIdB}', 'villa-full', '延期貴賓', '0922334455', 'hold@example.com', 14,
      '2027-03-27', '2027-03-29', 2, 40000, 20000,
      'PAID', 'CONFIRMED', 'OFFICIAL'
    );
    INSERT INTO room_daily_inventory (room_id, occupy_date, booking_id, source)
    VALUES ('villa-full', '2027-03-27', '${testIdB}', 'BOOKING'),
           ('villa-full', '2027-03-28', '${testIdB}', 'BOOKING');
  `);

  // TC-P3-01b: 協商延期保留（保留定金權益，釋放原檔期）
  {
    const req = new Request(`http://localhost/api/admin/bookings/${testIdB}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'CANCELLED',
        cancelReasonCategory: 'RESCHEDULE_HOLD',
        cancelReasonNote: '旅客因工作出差協商延期，20000元定金全額保留，原檔期釋放'
      })
    });

    const res = await updateAdminBooking({ ...mockAdminContext, params: { id: testIdB }, request: req });
    const data = await res.json();

    const row = db.prepare('SELECT status, cancel_reason_category, deposit_status FROM bookings WHERE id = ?').get(testIdB);
    const invCount = db.prepare('SELECT COUNT(*) AS c FROM room_daily_inventory WHERE booking_id = ?').get(testIdB).c;
    const auditLog = db.prepare("SELECT summary FROM admin_audit_logs WHERE target_id = ? AND action = 'CANCEL_BOOKING' ORDER BY created_at DESC LIMIT 1").get(testIdB);

    assert('TC-P3-01b1 協商延期保留標記 RESCHEDULE_HOLD', row.status === 'CANCELLED' && row.cancel_reason_category === 'RESCHEDULE_HOLD');
    assert('TC-P3-01b2 原檔期排他庫存立即釋放供新客預訂', invCount === 0);
    assert('TC-P3-01b3 原 50% 定金狀態保持 PAID 不沒入', row.deposit_status === 'PAID');
    assert('TC-P3-01b4 審計日誌明確載明保留定金權益', auditLog && auditLog.summary.includes('協商延期保留'));
  }

  // 3. 建立測試訂單 C (現場費用調整與尾款試算情境)
  db.exec(`
    INSERT INTO bookings (
      id, room_id, guest_name, guest_phone, guest_email, guest_count,
      check_in, check_out, nights, total_amount, deposit_amount,
      deposit_status, status, source
    ) VALUES (
      '${testIdC}', 'villa-full', '現場入住貴賓', '0933445566', 'adjust@example.com', 14,
      '2027-03-20', '2027-03-22', 2, 40000, 20000,
      'PAID', 'CONFIRMED', 'OFFICIAL'
    );
  `);

  let addedAdjIdClean = '';

  // TC-P3-02a: 現場費用調整新增（加床 +2000、清潔費 +1000、折讓 -500）
  {
    // 1. 加床 +2000
    const req1 = new Request(`http://localhost/api/admin/bookings/${testIdC}/adjustments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '現場加床 2 位', amount: 2000, note: '旅客現場追加 2 位含備品與早餐' })
    });
    const res1 = await addAdjustment({ ...mockAdminContext, params: { id: testIdC }, request: req1 });
    const data1 = await res1.json();

    // 2. 清潔費 +1000
    const req2 = new Request(`http://localhost/api/admin/bookings/${testIdC}/adjustments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '烤肉場地清潔費', amount: 1000, note: '使用戶外烤肉區' })
    });
    const res2 = await addAdjustment({ ...mockAdminContext, params: { id: testIdC }, request: req2 });
    const data2 = await res2.json();
    addedAdjIdClean = data2.adjustment.id;

    // 3. 折讓優惠 -500
    const req3 = new Request(`http://localhost/api/admin/bookings/${testIdC}/adjustments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '管家特惠折讓', amount: -500, note: '連住專屬現場折扣' })
    });
    const res3 = await addAdjustment({ ...mockAdminContext, params: { id: testIdC }, request: req3 });
    const data3 = await res3.json();

    assert('TC-P3-02a 3 筆現場調整項目成功新增 (201 Created)', res1.status === 201 && res2.status === 201 && res3.status === 201);
  }

  // TC-P3-02b: 現場應收尾款即時試算驗證
  {
    const req = new Request(`http://localhost/api/admin/bookings/${testIdC}/adjustments`, { method: 'GET' });
    const res = await getAdjustments({ ...mockAdminContext, params: { id: testIdC }, request: req });
    const data = await res.json();
    const sum = data.summary;

    assert('TC-P3-02b1 原總額為 NT$ 40,000', sum.originalTotal === 40000);
    assert('TC-P3-02b2 現場調整合計為 +NT$ 2,500 (2000+1000-500)', sum.totalAdjustments === 2500);
    assert('TC-P3-02b3 調整後最終總金額為 NT$ 42,500', sum.finalTotal === 42500);
    assert('TC-P3-02b4 現場應收尾款精準為 NT$ 22,500 (42500 - 20000定金)', sum.balanceDue === 22500);
  }

  // TC-P3-02c: 現場費用調整項目移除與動態重算
  {
    const req = new Request(`http://localhost/api/admin/bookings/${testIdC}/adjustments?adjId=${addedAdjIdClean}`, {
      method: 'DELETE'
    });
    const res = await deleteAdjustment({ ...mockAdminContext, params: { id: testIdC }, request: req });
    const data = await res.json();

    const getReq = new Request(`http://localhost/api/admin/bookings/${testIdC}/adjustments`, { method: 'GET' });
    const getRes = await getAdjustments({ ...mockAdminContext, params: { id: testIdC }, request: getReq });
    const getData = await getRes.json();
    const sum = getData.summary;

    assert('TC-P3-02c1 移除烤肉清潔費成功', res.status === 200 && data.success);
    assert('TC-P3-02c2 調整合計動態重算為 +NT$ 1,500 (2000-500)', sum.totalAdjustments === 1500);
    assert('TC-P3-02c3 現場應收尾款動態重算為 NT$ 21,500 (41500 - 20000)', sum.balanceDue === 21500);
  }

  // TC-P3-02d: 費用調整異常輸入防呆
  {
    // 空名稱
    const req1 = new Request(`http://localhost/api/admin/bookings/${testIdC}/adjustments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '   ', amount: 1000 })
    });
    const res1 = await addAdjustment({ ...mockAdminContext, params: { id: testIdC }, request: req1 });

    // 非數字金額
    const req2 = new Request(`http://localhost/api/admin/bookings/${testIdC}/adjustments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '加床', amount: 'abc' })
    });
    const res2 = await addAdjustment({ ...mockAdminContext, params: { id: testIdC }, request: req2 });

    assert('TC-P3-02d 費用調整空名稱與無效金額防呆阻擋 (HTTP 400)', res1.status === 400 && res2.status === 400);
  }

  // 清理測試資料
  db.exec(`
    DELETE FROM bookings WHERE id IN ('${testIdA}', '${testIdB}', '${testIdC}');
    DELETE FROM room_daily_inventory WHERE booking_id IN ('${testIdA}', '${testIdB}', '${testIdC}');
    DELETE FROM booking_adjustments WHERE booking_id IN ('${testIdA}', '${testIdB}', '${testIdC}');
  `);

  console.log('\n====================================================');
  console.log(`測試執行總結: 共 ${passed + failed} 項測試，通過: ${passed}，失敗: ${failed}`);
  console.log('====================================================');

  if (failed === 0) {
    console.log('🎉 所有 P3 極端業務與現場營運情境極限驗證 100% 全數通過！');
    process.exit(0);
  } else {
    console.error('⚠️ 部分測試失敗，請檢查上述錯誤訊息！');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('測試腳本執行異常崩潰:', err);
  process.exit(1);
});
