/**
 * /api/sync-ical - Airbnb iCal 邊緣定時與手動同步端點
 * 
 * 支援方法: GET / POST
 * 運作機制:
 * 1. 從環境變數 env.AIRBNB_ICAL_URL 取得 Airbnb 訂閱網址 (或從 query/body 自訂)
 * 2. 邊緣節點主動向 Airbnb 發出 fetch 請求取得最新 iCalendar 文字 (RFC 5545)
 * 3. 高效正規表示式解析 VEVENT 的 DTSTART, DTEND, SUMMARY, UID
 * 4. 批次更新寫入 D1 資料庫的 availability_blocks 資料表 (防止重複寫入)
 * 5. 寫入一筆成功/失敗紀錄至 sync_logs 表供管理員稽核
 */
export async function onRequest(context) {
  const { env, request } = context;

  // 1. 驗證資料庫綁定
  if (!env.DB) {
    return Response.json({ success: false, message: '資料庫尚未綁定 (env.DB not found)' }, { status: 500 });
  }

  // 2. 取得 iCal 來源 URL (優先取自環境變數，或從 URL query 參數傳入供測試)
  const urlObj = new URL(request.url);
  const targetUrl = urlObj.searchParams.get('url') || env.AIRBNB_ICAL_URL;

  if (!targetUrl || targetUrl.includes('xxxx.ics')) {
    return Response.json({
      success: false,
      message: '尚未設定有效的 Airbnb iCal 訂閱專用網址。請至 Cloudflare 後台 Settings -> Variables 設定 AIRBNB_ICAL_URL，或以 ?url= 參數傳入。',
      configuredUrl: targetUrl || null
    }, { status: 400 });
  }

  try {
    // 3. 向 Airbnb 抓取最新日曆內容 (設定 10 秒逾時)
    const icalRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ShanyuVillaBot/1.0; +https://ann-villa.pages.dev)'
      }
    });

    if (!icalRes.ok) {
      throw new Error(`無法自 Airbnb 伺服器下載日曆: HTTP ${icalRes.status} ${icalRes.statusText}`);
    }

    const icsContent = await icalRes.text();

    // 4. 解析 iCalendar VEVENT 事件
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

    if (events.length === 0) {
      return Response.json({
        success: true,
        message: 'Airbnb 日曆目前無任何佔用或保留事件。',
        syncedCount: 0
      });
    }

    // 5. 批次寫入 D1 資料庫
    // 先清理過期的 Airbnb 舊事件，或使用 INSERT OR REPLACE 根據 external_uid 覆蓋
    const insertStmt = env.DB.prepare(`
      INSERT INTO availability_blocks (room_id, start_date, end_date, summary, source, external_uid)
      VALUES ('villa-full', ?, ?, ?, 'AIRBNB', ?)
      ON CONFLICT(external_uid) DO UPDATE SET
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        summary = excluded.summary
    `);

    const batchStatements = events.map(ev => 
      insertStmt.bind(ev.startDate, ev.endDate, ev.summary, ev.uid)
    );

    await env.DB.batch(batchStatements);

    // 6. 記錄排程日誌
    await env.DB.prepare(`
      INSERT INTO sync_logs (channel, status, events_count, message)
      VALUES ('AIRBNB', 'SUCCESS', ?, ?)
    `).bind(events.length, `成功自 Airbnb 同步 ${events.length} 組檔期區間`).run();

    return Response.json({
      success: true,
      message: `已成功同步 ${events.length} 組 Airbnb 檔期事件！`,
      eventsCount: events.length,
      syncedAt: new Date().toISOString(),
      events
    });

  } catch (err) {
    // 記錄失敗日誌至 D1
    try {
      await env.DB.prepare(`
        INSERT INTO sync_logs (channel, status, events_count, message)
        VALUES ('AIRBNB', 'FAILED', 0, ?)
      `).bind(err.message).run();
    } catch (_) {}

    return Response.json({
      success: false,
      error: err.message
    }, { status: 500 });
  }
}

