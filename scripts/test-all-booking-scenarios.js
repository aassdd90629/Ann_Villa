/**
 * 全面自動化測試腳本：前台直訂全情境測試 (test-all-booking-scenarios.js)
 * 涵蓋：正常下訂、平假日階梯定價、連假、防撞期重疊判定、邊界連續入住、異常輸入、金流防竄改、取消釋放與清理。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 1. 初始化 SQLite 模擬 D1 資料庫環境
console.log('📦 正在初始化 D1 本地 SQLite 資料庫結構與種子資料...');
const db = new DatabaseSync(':memory:');
const migrationsDir = path.join(projectRoot, 'migrations');
const sqlFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

for (const file of sqlFiles) {
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  db.exec(sql);
}
console.log(`✅ 成功載入 ${sqlFiles.length} 個遷移與種子腳本！\n`);

// 2. 建構 D1 API 封裝器 (完全相容 Cloudflare D1 規範)
class D1Mock {
  constructor(database) {
    this.db = database;
  }
  prepare(sql) {
    return new D1PreparedStatement(this.db, sql);
  }
  async batch(statements) {
    this.db.exec('BEGIN TRANSACTION');
    try {
      const results = [];
      for (const stmt of statements) {
        results.push(await stmt.run());
      }
      this.db.exec('COMMIT');
      return results;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }
}

class D1PreparedStatement {
  constructor(database, sql, params = []) {
    this.db = database;
    this.sql = sql;
    this.params = params;
  }
  bind(...params) {
    return new D1PreparedStatement(this.db, this.sql, params);
  }
  async first(colName) {
    const stmt = this.db.prepare(this.sql);
    const row = stmt.get(...this.params);
    if (!row) return null;
    if (colName) return row[colName];
    return row;
  }
  async all() {
    const stmt = this.db.prepare(this.sql);
    const rows = stmt.all(...this.params);
    return { results: rows, success: true };
  }
  async run() {
    const stmt = this.db.prepare(this.sql);
    const info = stmt.run(...this.params);
    return {
      success: true,
      meta: {
        changes: info.changes,
        last_row_id: Number(info.lastInsertRowid)
      }
    };
  }
}

const env = {
  DB: new D1Mock(db),
  ENVIRONMENT: 'test',
  ADMIN_PASSWORD: 'testpassword123'
};

// 引入後端 API 處理函式
const { onRequestPost: createBooking } = await import('../functions/api/bookings/index.js');
const { onRequestGet: getAvailability } = await import('../functions/api/availability.js');
const { onRequestPost: clearTestBookings } = await import('../functions/api/admin/bookings/clear-test.js');

function mockPostContext(body) {
  return {
    env,
    request: {
      method: 'POST',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => body
    }
  };
}

function mockGetContext() {
  return {
    env,
    request: {
      method: 'GET',
      headers: new Headers()
    }
  };
}

let passCount = 0;
let failCount = 0;

function assert(description, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${description} ${detail ? '(' + detail + ')' : ''}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${description} ${detail ? '(' + detail + ')' : ''}`);
    failCount++;
  }
}

async function runAllTests() {
  console.log('🚀 ========== 開始執行前台直訂全情境自動化測試 ========== \n');

  // --------------------------------------------------------------------------
  // 階段 1：正常下訂與平假日階梯計價 (Happy Paths)
  // --------------------------------------------------------------------------
  console.log('【階段 1】正常下訂與平假日階梯計價測試');

  // Case 1: 平日 8 人 (<=10人梯次: 20,000 / 10,000)
  {
    const res = await createBooking(mockPostContext({
      roomId: 'villa-full',
      guestName: '陳大文',
      guestPhone: '0912-345-678',
      guestEmail: 'chen@example.com',
      guestCount: 8,
      checkIn: '2026-12-01', // 週二
      checkOut: '2026-12-02', // 週三 (1晚)
      specialRequests: '素食早餐2客'
    }));
    const data = await res.json();
    assert('平日 <=10人 下訂成功', res.status === 201 && data.success === true);
    assert('平日 <=10人 總額與定金計算正確', data.booking.totalAmount === 20000 && data.booking.depositAmount === 10000, `總額:${data.booking?.totalAmount}, 定金:${data.booking?.depositAmount}`);
    assert('訂單編號符合 SY-YYYYMMDD-XXXX 規範', /^SY-20261201-\d{4}$/.test(data.booking.id), data.booking.id);
  }

  // Case 2: 平日 12 人 (11~14人梯次: 25,000 / 12,500)
  {
    const res = await createBooking(mockPostContext({
      roomId: 'villa-full',
      guestName: '林小姐',
      guestPhone: '0922-111-222',
      guestEmail: 'lin@example.com',
      guestCount: 12,
      checkIn: '2026-12-08', // 週二
      checkOut: '2026-12-09'  // 週三 (1晚)
    }));
    const data = await res.json();
    assert('平日 11~14人 下訂成功', res.status === 201);
    assert('平日 11~14人 總額 25,000 / 定金 12,500', data.booking.totalAmount === 25000 && data.booking.depositAmount === 12500);
  }

  // Case 3: 平日 18 人 (15~18人梯次: 30,000 / 15,000)
  {
    const res = await createBooking(mockPostContext({
      roomId: 'villa-full',
      guestName: '張先生',
      guestPhone: '0933-444-555',
      guestEmail: 'chang@example.com',
      guestCount: 18,
      checkIn: '2026-12-15', // 週二
      checkOut: '2026-12-16'  // 週三 (1晚)
    }));
    const data = await res.json();
    assert('平日 15~18人 下訂成功', res.status === 201);
    assert('平日 15~18人 總額 30,000 / 定金 15,000', data.booking.totalAmount === 30000 && data.booking.depositAmount === 15000);
  }

  // Case 4: 週末五六日包棟 (假日定價: 35,000 / 17,500)
  {
    const res = await createBooking(mockPostContext({
      roomId: 'villa-full',
      guestName: '黃先生',
      guestPhone: '0955-666-777',
      guestEmail: 'huang@example.com',
      guestCount: 14,
      checkIn: '2026-12-18', // 週五
      checkOut: '2026-12-19'  // 週六 (1晚)
    }));
    const data = await res.json();
    assert('週末週五單晚 下訂成功', res.status === 201);
    assert('週末假日總額 35,000 / 定金 17,500', data.booking.totalAmount === 35000 && data.booking.depositAmount === 17500);
  }

  // Case 5: 跨平假日 2 晚 (非連假週: 週四平日 20000 + 週五假日 35000 = 55,000，定金 27,500)
  {
    const res = await createBooking(mockPostContext({
      roomId: 'villa-full',
      guestName: '郭董',
      guestPhone: '0977-888-999',
      guestEmail: 'kuo@example.com',
      guestCount: 10,
      checkIn: '2026-12-10', // 週四 (平日)
      checkOut: '2026-12-12'  // 週六 (2晚: 週四20k + 週五35k)
    }));
    const data = await res.json();
    assert('跨平假日連續 2 晚 下訂成功', res.status === 201);
    assert('跨平假日金額核算正確 (平日20k+假日35k = 55k / 定金27.5k)', data.booking.totalAmount === 55000 && data.booking.depositAmount === 27500, `實際金額:${data.booking?.totalAmount}`);
  }

  // Case 5b: 國定連續假期專案價 (2026 聖誕連假 12-24 ~ 12-25 單晚 47,000 / 定金 23,500)
  {
    const res = await createBooking(mockPostContext({
      roomId: 'villa-full',
      guestName: '聖誕貴賓',
      guestPhone: '0988-888-888',
      guestEmail: 'xmas@example.com',
      guestCount: 10,
      checkIn: '2026-12-24',
      checkOut: '2026-12-25'
    }));
    const data = await res.json();
    assert('聖誕國定連假專案價下訂成功', res.status === 201);
    assert('連假專案價金額核算正確 (單晚47k / 定金23.5k)', data.booking.totalAmount === 47000 && data.booking.depositAmount === 23500, `實際金額:${data.booking?.totalAmount}`);
  }

  // --------------------------------------------------------------------------
  // 階段 2：防撞期衝突檢核 (Overlap Conflict Protection)
  // --------------------------------------------------------------------------
  console.log('\n【階段 2】防撞期重疊鎖房檢核測試');

  // Case 6: 完全重疊相同日期 (已訂 2026-12-01 ~ 2026-12-02)
  {
    const res = await createBooking(mockPostContext({
      roomId: 'villa-full',
      guestName: '撞期測試者A',
      guestPhone: '0900-000-001',
      guestEmail: 'c1@example.com',
      guestCount: 10,
      checkIn: '2026-12-01',
      checkOut: '2026-12-02'
    }));
    const data = await res.json();
    assert('完全相同日期撞期阻擋', res.status === 409 && data.success === false, data.message);
  }

  // Case 7: 包含重疊 (新訂單 11-30 ~ 12-03 包住 12-01 ~ 12-02)
  {
    const res = await createBooking(mockPostContext({
      roomId: 'villa-full',
      guestName: '撞期測試者B',
      guestPhone: '0900-000-002',
      guestEmail: 'c2@example.com',
      guestCount: 10,
      checkIn: '2026-11-30',
      checkOut: '2026-12-03'
    }));
    const data = await res.json();
    assert('外擴大範圍包含現有訂單撞期阻擋', res.status === 409 && data.success === false, data.message);
  }

  // Case 8: 前半部重疊 (新訂單 11-30 ~ 12-02，退房落在訂單中)
  {
    const res = await createBooking(mockPostContext({
      roomId: 'villa-full',
      guestName: '撞期測試者C',
      guestPhone: '0900-000-003',
      guestEmail: 'c3@example.com',
      guestCount: 10,
      checkIn: '2026-11-30',
      checkOut: '2026-12-02'
    }));
    const data = await res.json();
    assert('前半部跨界重疊撞期阻擋', res.status === 409 && data.success === false);
  }

  // Case 9: 後半部重疊 (新訂單 12-01 ~ 12-03，入住落在訂單中)
  {
    const res = await createBooking(mockPostContext({
      roomId: 'villa-full',
      guestName: '撞期測試者D',
      guestPhone: '0900-000-004',
      guestEmail: 'c4@example.com',
      guestCount: 10,
      checkIn: '2026-12-01',
      checkOut: '2026-12-03'
    }));
    const data = await res.json();
    assert('後半部跨界重疊撞期阻擋', res.status === 409 && data.success === false);
  }

  // Case 10: 與管家自主鎖房 (availability_blocks) 重疊
  // (seed_data 中有 2026-11-28 ~ 2026-11-29 園區保養鎖房)
  {
    const res = await createBooking(mockPostContext({
      roomId: 'villa-full',
      guestName: '管家鎖房測試客',
      guestPhone: '0900-000-005',
      guestEmail: 'lock@example.com',
      guestCount: 10,
      checkIn: '2026-11-28',
      checkOut: '2026-11-29'
    }));
    const data = await res.json();
    assert('與管家自主關閉鎖房檔期重疊阻擋', res.status === 409 && data.success === false, data.message);
  }

  // --------------------------------------------------------------------------
  // 階段 3：邊界連續入住檢核 (Boundary Check - 零撞期互斥標準)
  // --------------------------------------------------------------------------
  console.log('\n【階段 3】邊界相鄰連續入住檢核 (無衝突邊界)');

  // 已有訂單：2026-12-01 ~ 2026-12-02
  // Case 11: 前組退房當日即為新客入住日 (2026-12-02 入住 ~ 2026-12-03 退房)
  {
    const res = await createBooking(mockPostContext({
      roomId: 'villa-full',
      guestName: '接續入住貴賓',
      guestPhone: '0966-777-888',
      guestEmail: 'next@example.com',
      guestCount: 10,
      checkIn: '2026-12-02', // 前組退房日
      checkOut: '2026-12-03'
    }));
    const data = await res.json();
    assert('前組退房日作為新組入住日 (12-02) 允許預訂無衝突', res.status === 201 && data.success === true, `訂單ID: ${data.booking?.id}`);
  }

  // Case 12: 新客退房日即為後組入住日 (2026-11-30 入住 ~ 2026-12-01 退房)
  {
    const res = await createBooking(mockPostContext({
      roomId: 'villa-full',
      guestName: '前置退房貴賓',
      guestPhone: '0966-999-000',
      guestEmail: 'prev@example.com',
      guestCount: 10,
      checkIn: '2026-11-30',
      checkOut: '2026-12-01' // 後組入住日
    }));
    const data = await res.json();
    assert('新組退房日作為後組入住日 (12-01) 允許預訂無衝突', res.status === 201 && data.success === true, `訂單ID: ${data.booking?.id}`);
  }

  // --------------------------------------------------------------------------
  // 階段 4：輸入校驗與異常邊界防呆 (Input Validation & Edge Cases)
  // --------------------------------------------------------------------------
  console.log('\n【階段 4】輸入校驗與邊界防呆測試');

  // Case 13: 缺姓名
  {
    const res = await createBooking(mockPostContext({
      roomId: 'villa-full',
      guestPhone: '0912345678',
      guestEmail: 'test@example.com',
      checkIn: '2026-12-10',
      checkOut: '2026-12-11'
    }));
    const data = await res.json();
    assert('缺少姓名拒絕送單 (HTTP 400)', res.status === 400 && data.success === false, data.message);
  }

  // Case 14: 缺電話
  {
    const res = await createBooking(mockPostContext({
      roomId: 'villa-full',
      guestName: '無名者',
      guestEmail: 'test@example.com',
      checkIn: '2026-12-10',
      checkOut: '2026-12-11'
    }));
    assert('缺少電話拒絕送單 (HTTP 400)', res.status === 400);
  }

  // Case 15: 缺 Email
  {
    const res = await createBooking(mockPostContext({
      roomId: 'villa-full',
      guestName: '無名者',
      guestPhone: '0912345678',
      checkIn: '2026-12-10',
      checkOut: '2026-12-11'
    }));
    assert('缺少 Email 拒絕送單 (HTTP 400)', res.status === 400);
  }

  // Case 16: 同日退房 (checkIn == checkOut，0 晚)
  {
    const res = await createBooking(mockPostContext({
      roomId: 'villa-full',
      guestName: '同日客',
      guestPhone: '0912345678',
      guestEmail: 'test@example.com',
      checkIn: '2026-12-10',
      checkOut: '2026-12-10'
    }));
    const data = await res.json();
    assert('入住與退房同日拒絕送單 (HTTP 400)', res.status === 400 && data.success === false, data.message);
  }

  // Case 17: 日期逆轉 (退房比入住早)
  {
    const res = await createBooking(mockPostContext({
      roomId: 'villa-full',
      guestName: '時光旅人',
      guestPhone: '0912345678',
      guestEmail: 'test@example.com',
      checkIn: '2026-12-12',
      checkOut: '2026-12-10'
    }));
    const data = await res.json();
    assert('退房日早於入住日拒絕送單 (HTTP 400)', res.status === 400 && data.success === false, data.message);
  }

  // Case 18: 人數超額 (19人，上限 18人)
  {
    const res = await createBooking(mockPostContext({
      roomId: 'villa-full',
      guestName: '超額團體',
      guestPhone: '0912345678',
      guestEmail: 'test@example.com',
      guestCount: 19,
      checkIn: '2026-12-10',
      checkOut: '2026-12-11'
    }));
    const data = await res.json();
    assert('人數超額拒絕送單 (HTTP 400)', res.status === 400 && data.message.includes('18 人'), data.message);
  }

  // Case 19: 房型不存在
  {
    const res = await createBooking(mockPostContext({
      roomId: 'non-existent-villa',
      guestName: '異次元旅客',
      guestPhone: '0912345678',
      guestEmail: 'test@example.com',
      guestCount: 4,
      checkIn: '2026-12-10',
      checkOut: '2026-12-11'
    }));
    const data = await res.json();
    assert('非現存房型拒絕送單 (HTTP 404)', res.status === 404 && data.success === false, data.message);
  }

  // --------------------------------------------------------------------------
  // 階段 5：金流防竄改檢核 (Anti-Tampering Verification)
  // --------------------------------------------------------------------------
  console.log('\n【階段 5】金流防竄改檢核 (前端傳入惡意低價)');

  // Case 20: 惡意竄改金額 (前端送入 totalAmount: 100, depositAmount: 50)
  {
    const res = await createBooking(mockPostContext({
      roomId: 'villa-full',
      guestName: '惡意駭客',
      guestPhone: '0900-999-999',
      guestEmail: 'hacker@example.com',
      guestCount: 18,
      checkIn: '2026-12-22', // 週二平日 18人應為 30,000 / 15,000
      checkOut: '2026-12-23',
      totalAmount: 100,
      depositAmount: 50
    }));
    const data = await res.json();
    assert('後端強制覆寫計算，無視前端惡意竄改金額', data.booking.totalAmount === 30000 && data.booking.depositAmount === 15000, `後端核定總額: ${data.booking.totalAmount}, 定金: ${data.booking.depositAmount}`);
    
    // 驗證資料庫實際寫入值
    const dbRow = db.prepare('SELECT total_amount, deposit_amount FROM bookings WHERE id = ?').get(data.booking.id);
    assert('資料庫落庫金額防竄改生效', dbRow.total_amount === 30000 && dbRow.deposit_amount === 15000, `DB總額: ${dbRow.total_amount}`);
  }

  // --------------------------------------------------------------------------
  // 階段 6：前台即時房態連動與訂單生命週期 (Availability & Lifecycle)
  // --------------------------------------------------------------------------
  console.log('\n【階段 6】房態連動與取消釋放測試');

  // Case 21: /api/availability 能即時查出剛剛的已佔用訂單
  {
    const availRes = await getAvailability(mockGetContext());
    const availData = await availRes.json();
    assert('/api/availability 取得房態成功', availRes.status === 200 && availData.success === true);
    
    const found = availData.bookedRanges.some(r => r.startDate === '2026-12-01' && r.endDate === '2026-12-02');
    assert('前台查詢房態已即時包含剛送出的直訂單', found);
  }

  // Case 22: 訂單取消後檔期自動釋放
  {
    // 將 12-01 ~ 12-02 訂單改為 CANCELLED
    db.prepare(`UPDATE bookings SET status = 'CANCELLED' WHERE check_in = '2026-12-01'`).run();

    // 重新以 12-01 ~ 12-02 預約，預期成功！
    const rebookRes = await createBooking(mockPostContext({
      roomId: 'villa-full',
      guestName: '重新接替旅客',
      guestPhone: '0988-123-456',
      guestEmail: 'rebook@example.com',
      guestCount: 10,
      checkIn: '2026-12-01',
      checkOut: '2026-12-02'
    }));
    const rebookData = await rebookRes.json();
    assert('訂單取消後，相同檔期立即釋放並允許新旅客預訂成功', rebookRes.status === 201 && rebookData.success === true, rebookData.booking?.id);
  }

  // --------------------------------------------------------------------------
  // 階段 7：一鍵清理測試資料 (Clear Test Bookings)
  // --------------------------------------------------------------------------
  console.log('\n【階段 7】清理測試訂單');
  {
    const clearRes = await clearTestBookings(mockPostContext({}));
    const clearData = await clearRes.json();
    assert('一鍵清理測試訂單執行成功', clearRes.status === 200 && clearData.success === true, clearData.message);

    const remaining = db.prepare('SELECT COUNT(*) as cnt FROM bookings').get();
    assert('資料庫訂單已完全清空，還原乾淨房態', remaining.cnt === 0, `剩餘訂單數: ${remaining.cnt}`);
  }

  // --------------------------------------------------------------------------
  // 測試總結
  // --------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`📊 測試總結：共 ${passCount + failCount} 項測試 | 通過: ${passCount} | 失敗: ${failCount}`);
  if (failCount === 0) {
    console.log('🎉 恭喜！前台下訂核心機制、金流防竄改與防撞期防呆全部 100% 驗證通過！');
  } else {
    console.error('❌ 有部分測試未通過，請檢查詳細錯誤訊息！');
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('執行測試過程中發生未預期錯誤:', err);
  process.exit(1);
});
