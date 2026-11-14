/**
 * /api/sync-ical - Airbnb iCal 邊緣定時與手動同步端點
 * 
 * 支援方法: GET / POST
 * 運作機制:
 * 1. 從環境變數 env.AIRBNB_ICAL_URL 取得 Airbnb 訂閱網址 (或從 query/body 自訂)
 * 2. 邊緣節點主動向 Airbnb 發出 fetch 請求取得最新 iCalendar 文字 (RFC 5545)
 * 3. 高效正規表示式解析 VEVENT 的 DTSTART, DTEND, SUMMARY, UID
 * 4. 批次更新寫入 D1 資料庫的 availability_blocks 資料表 (清除已取消/變更之舊檔期，寫入最新檔期)
 * 5. 寫入一筆成功/失敗紀錄至 sync_logs 表供管理員稽核
 */

/**
 * 執行 Airbnb 日曆拉取與 D1 同步之共用函式
 * 可由 /api/sync-ical, /api/admin/sync 或 /api/availability 自動調用
 */
export async function syncAirbnbCalendar(env, customUrl = null) {
  if (!env.DB) {
    throw new Error('資料庫尚未綁定 (env.DB not found)');
  }

  const targetUrl = customUrl || env.AIRBNB_ICAL_URL;

  if (!targetUrl || targetUrl.includes('xxxx.ics')) {
    throw new Error('尚未設定有效的 Airbnb iCal 訂閱專用網址。請至 Cloudflare 後台 Settings -> Variables 設定 AIRBNB_ICAL_URL。');
  }

  // 1. 向 Airbnb 抓取最新日曆內容 (設定 10 秒逾時)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let icsContent = '';
  try {
    const icalRes = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ShanyuVillaBot/1.0; +https://ann-villa.pages.dev)'
      }
    });

    if (!icalRes.ok) {
      throw new Error(`無法自 Airbnb 伺服器下載日曆: HTTP ${icalRes.status} ${icalRes.statusText}`);
    }
    icsContent = await icalRes.text();
  } finally {
    clearTimeout(timeoutId);
  }

  // 2. 解析 iCalendar VEVENT 事件
  const events = [];
  const eventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
  let match;

  while ((match = eventRegex.exec(icsContent)) !== null) {
    const block = match[1];
    const dtstartMatch = block.match(/DTSTART(?:;VALUE=DATE)?:(\d{4})(\d{2})(\d{2})/);
    const dtendMatch = block.match(/DTEND(?:;VALUE=DATE)?:(\d{4})(\d{2})(\d{2})/);
    const summaryMatch = block.match(/SUMMARY:(.*)/);
    const uidMatch = block.match(/UID:(.*)/);

    if (dtstartMatch && dtendMatch) {
      const startDate = `${dtstartMatch[1]}-${dtstartMatch[2]}-${dtstartMatch[3]}`;
      const endDate = `${dtendMatch[1]}-${dtendMatch[2]}-${dtendMatch[3]}`;
      const summary = summaryMatch ? summaryMatch[1].trim() : 'Reserved';
      const uid = uidMatch ? uidMatch[1].trim() : `${startDate}_${endDate}@airbnb.com`;

      events.push({
        startDate,
        endDate,
        summary,
        uid
      });
    }
  }

  // 3. 批次更新 D1 資料庫
  // 先清除既有的 AIRBNB 來源事件（確保被取消的訂單或解除保留之檔期能及時清除，且不影響管家手動鎖房）
  await env.DB.prepare(`DELETE FROM availability_blocks WHERE source = 'AIRBNB'`).run();

  if (events.length > 0) {
    const insertStmt = env.DB.prepare(`
      INSERT INTO availability_blocks (room_id, start_date, end_date, summary, source, external_uid)
      VALUES ('villa-full', ?, ?, ?, 'AIRBNB', ?)
    `);

    const batchStatements = events.map(ev => 
      insertStmt.bind(ev.startDate, ev.endDate, ev.summary, ev.uid)
    );

    await env.DB.batch(batchStatements);
  }

  // 4. 記錄排程日誌
  await env.DB.prepare(`
    INSERT INTO sync_logs (channel, status, events_count, message)
    VALUES ('AIRBNB', 'SUCCESS', ?, ?)
  `).bind(events.length, `成功自 Airbnb 同步 ${events.length} 組檔期區間`).run();

  return {
    success: true,
    message: `已成功同步 ${events.length} 組 Airbnb 檔期事件！`,
    count: events.length,
    eventsCount: events.length,
    syncedAt: new Date().toISOString(),
    events
  };
}

export async function onRequest(context) {
  const { env, request } = context;

  try {
    const urlObj = new URL(request.url);
    const customUrl = urlObj.searchParams.get('url');

    const result = await syncAirbnbCalendar(env, customUrl);
    return Response.json(result);
  } catch (err) {
    // 記錄失敗日誌至 D1
    if (env.DB) {
      try {
        await env.DB.prepare(`
          INSERT INTO sync_logs (channel, status, events_count, message)
          VALUES ('AIRBNB', 'FAILED', 0, ?)
        `).bind(err.message).run();
      } catch (_) {}
    }

    return Response.json({
      success: false,
      error: err.message
    }, { status: 500 });
  }
}
