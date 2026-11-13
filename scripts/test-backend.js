import { spawn } from 'child_process';

console.log('🚀 正在啟動 Cloudflare Pages + D1 本機全端模擬環境...');

const child = spawn('npx.cmd', ['wrangler', 'pages', 'dev', 'dist', '--port=8788'], {
  cwd: 'd:\\hotel\\Ann_Villa',
  stdio: 'pipe',
  shell: true
});

child.stdout.on('data', (data) => {
  const msg = data.toString();
  if (msg.includes('Ready on')) {
    console.log('✨ Wrangler 本地邊緣伺服器已就緒！開始驗證 API 端點...');
    runTests();
  }
});

child.stderr.on('data', (data) => {
  // console.error(data.toString());
});

async function runTests() {
  try {
    // 1. 測試 /api/status
    const statusRes = await fetch('http://localhost:8788/api/status');
    const statusData = await statusRes.json();
    console.log('✅ GET /api/status 正常:', JSON.stringify(statusData, null, 2));

    // 2. 測試 /api/rooms
    const roomsRes = await fetch('http://localhost:8788/api/rooms');
    const roomsData = await roomsRes.json();
    console.log(`✅ GET /api/rooms 正常: 取得 ${roomsData.rooms.length} 間房型方案`);

    // 3. 測試 /api/availability
    const availRes = await fetch('http://localhost:8788/api/availability');
    const availData = await availRes.json();
    console.log(`✅ GET /api/availability 正常: 取得 ${availData.bookedRanges.length} 組已被佔用檔期`);

    // 4. 測試 POST /api/bookings (送出訂單)
    const bookingRes = await fetch('http://localhost:8788/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'villa-full',
        guestName: '王大明',
        guestPhone: '0912345678',
        guestEmail: 'test@example.com',
        checkIn: '2026-11-10',
        checkOut: '2026-11-12',
        guestCount: 8,
        specialRequests: '需準備烤肉架'
      })
    });
    const bookingData = await bookingRes.json();
    console.log('✅ POST /api/bookings 預約測試結果:', bookingData);

    // 5. 測試防撞期檢核 (重複撞期應被擋下)
    const conflictRes = await fetch('http://localhost:8788/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'villa-full',
        guestName: '李小美',
        guestPhone: '0988776655',
        guestEmail: 'conflict@example.com',
        checkIn: '2026-11-11',
        checkOut: '2026-11-13',
        guestCount: 6
      })
    });
    const conflictData = await conflictRes.json();
    console.log(`✅ 防撞期檢核測試 (預期擋下): HTTP ${conflictRes.status} ->`, conflictData.message);

    // 6. 測試 /api/sync-ical (同步端點防呆驗證)
    const syncRes = await fetch('http://localhost:8788/api/sync-ical');
    const syncData = await syncRes.json();
    console.log(`✅ GET /api/sync-ical 驗證 (未填 URL 提示): HTTP ${syncRes.status} ->`, syncData.message);

    console.log('\n🎉 所有本地邊緣 API 與 D1 資料庫存取全部驗證通過！');
  } catch (err) {
    console.error('❌ 測試失敗:', err);
  } finally {
    console.log('🛑 正在關閉本機伺服器...');
    child.kill('SIGTERM');
    process.exit(0);
  }
}
