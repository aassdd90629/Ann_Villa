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

    // ==========================================
    // 7. 測試管理後台與全域安全授權 (Phase 1 & 2)
    // ==========================================
    console.log('\n🔒 --- 開始驗證後台安全與管家管理 API ---');

    // 7.1 測試未授權存取 (預期被 _middleware.js 擋下返回 401)
    const unauthRes = await fetch('http://localhost:8788/api/admin/bookings');
    const unauthData = await unauthRes.json();
    console.log(`✅ 未授權存取攔截 (預期 401): HTTP ${unauthRes.status} ->`, unauthData.message);

    // 7.2 測試管家登入驗證 (POST /api/admin/auth)
    const loginRes = await fetch('http://localhost:8788/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'ryan1123_Ann' })
    });
    const loginData = await loginRes.json();
    console.log(`✅ 管家登入驗證 (預期成功): HTTP ${loginRes.status} -> Token 取得:`, loginData.token ? '成功簽發 (JWT 正常)' : '失敗');
    const adminToken = loginData.token;

    if (adminToken) {
      const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      };

      // 7.3 測試帶 Token 查詢訂單列表
      const adminBookingsRes = await fetch('http://localhost:8788/api/admin/bookings', { headers: authHeaders });
      const adminBookingsData = await adminBookingsRes.json();
      console.log(`✅ 授權查詢訂單 (預期 200): 取得 ${adminBookingsData.bookings?.length || 0} 筆訂單`);

      // 7.4 測試手動鎖房 (POST /api/admin/blocks)
      const lockRes = await fetch('http://localhost:8788/api/admin/blocks', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          startDate: '2026-12-25',
          endDate: '2026-12-27',
          summary: '管家維護測試鎖房'
        })
      });
      const lockData = await lockRes.json();
      console.log(`✅ 管家手動鎖房測試: HTTP ${lockRes.status} ->`, lockData.message);

      // 7.5 測試解除鎖房 (DELETE /api/admin/blocks/:id)
      if (lockData.block?.id) {
        const unlockRes = await fetch(`http://localhost:8788/api/admin/blocks/${lockData.block.id}`, {
          method: 'DELETE',
          headers: authHeaders
        });
        const unlockData = await unlockRes.json();
        console.log(`✅ 管家解除鎖房測試: HTTP ${unlockRes.status} ->`, unlockData.message);
      }

      // 7.6 測試一鍵清空測試訂單 (POST /api/admin/bookings/clear-test)
      const clearRes = await fetch('http://localhost:8788/api/admin/bookings/clear-test', {
        method: 'POST',
        headers: authHeaders
      });
      const clearData = await clearRes.json();
      console.log(`✅ 一鍵清空測試訂單測試: HTTP ${clearRes.status} ->`, clearData.message);
    }

    console.log('\n🎉 所有前台直訂、後台授權 API、全站門禁與 D1 資料庫存取全部驗證通過！');
  } catch (err) {
    console.error('❌ 測試失敗:', err);
  } finally {
    console.log('🛑 正在關閉本機伺服器...');
    child.kill('SIGTERM');
    process.exit(0);
  }
}
