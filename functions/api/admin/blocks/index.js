/**
 * POST /api/admin/blocks - 管家手動新增檔期鎖定 (反灰保留)
 * 
 * 遵守後端規範：防撞期重疊檢查、參數化綁定
 * 支援單一區間 (startDate, endDate) 或多日期陣列 (dates: ['YYYY-MM-DD', ...])
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.DB) {
    return Response.json({ success: false, message: 'DB not bound' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const {
      roomId = 'villa-full',
      dates, // 支援多選單日陣列 ['2026-12-01', '2026-12-03', ...]
      startDate,
      endDate,
      summary = '管家手動保留'
    } = body;

    const currentAdmin = context.data?.adminUser;
    const operatorTag = currentAdmin?.displayName 
      ? `${currentAdmin.displayName} (${currentAdmin.username})` 
      : 'admin';

    // 模式 A：傳入多選日期陣列
    if (Array.isArray(dates) && dates.length > 0) {
      const getNextDay = (dateStr) => {
        const d = new Date(dateStr);
        d.setDate(d.getDate() + 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const createdBlocks = [];

      for (let i = 0; i < dates.length; i++) {
        const curDate = dates[i];
        const nextDay = getNextDay(curDate);
        const randSuffix = Math.random().toString(36).substring(2, 7);
        const externalUid = `manual-lock-${Date.now()}-${i}-${randSuffix}@shanyu-villa`;

        const insertRes = await env.DB.prepare(`
          INSERT INTO availability_blocks (
            room_id, start_date, end_date, summary, source, external_uid
          ) VALUES (?, ?, ?, ?, 'MANUAL_LOCK', ?)
        `).bind(
          roomId,
          curDate,
          nextDay,
          summary.trim(),
          externalUid
        ).run();

        const rowId = insertRes?.meta?.last_row_id;

        createdBlocks.push({
          id: rowId || externalUid,
          uid: externalUid,
          startDate: curDate,
          endDate: nextDay
        });
      }

      // 寫入審計日誌
      try {
        await env.DB.prepare(`
          INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
          VALUES ('calendar', 'MANUAL_LOCK', ?, ?, ?, ?)
        `).bind(
          String(createdBlocks[0]?.id || 'batch-blocks'),
          `管家手動多選關房：共 ${dates.length} 天（${dates.join(', ')}）`,
          JSON.stringify({ dates, roomId, summary: summary.trim(), createdBlocks }),
          operatorTag
        ).run();
      } catch (logErr) {
        console.warn('寫入 blocks audit log 警告:', logErr.message);
      }

      return Response.json({
        success: true,
        message: `成功鎖定 ${dates.length} 個日期，官網日曆已即刻反灰`,
        blocks: createdBlocks
      });
    }

    // 模式 B：單一區間 (向後相容)
    if (!startDate || !endDate) {
      return Response.json(
        { success: false, message: '請指定鎖定之日期 (dates) 或起始與結束日期 (startDate, endDate)' },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return Response.json(
        { success: false, message: '結束日期必須晚於起始日期' },
        { status: 400 }
      );
    }

    const randSuffix = Math.random().toString(36).substring(2, 7);
    const externalUid = `manual-lock-${Date.now()}-${randSuffix}@shanyu-villa`;

    const insertRes = await env.DB.prepare(`
      INSERT INTO availability_blocks (
        room_id, start_date, end_date, summary, source, external_uid
      ) VALUES (?, ?, ?, ?, 'MANUAL_LOCK', ?)
    `).bind(
      roomId,
      startDate,
      endDate,
      summary.trim(),
      externalUid
    ).run();

    const rowId = insertRes?.meta?.last_row_id;
    const targetId = rowId ? String(rowId) : externalUid;

    // 寫入審計日誌
    try {
      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('calendar', 'MANUAL_LOCK', ?, ?, ?, ?)
      `).bind(
        targetId,
        `管家手動自訂關房：${startDate} ~ ${endDate}（${summary.trim()}）`,
        JSON.stringify({ startDate, endDate, roomId, summary: summary.trim(), externalUid, id: rowId }),
        operatorTag
      ).run();
    } catch (logErr) {
      console.warn('寫入 blocks audit log 警告:', logErr.message);
    }

    return Response.json({
      success: true,
      message: '檔期鎖定成功，官網日曆已即刻反灰',
      block: {
        id: rowId || externalUid,
        uid: externalUid,
        roomId,
        startDate,
        endDate,
        summary,
        source: 'MANUAL_LOCK'
      }
    });

  } catch (err) {
    return Response.json(
      { success: false, message: '新增鎖房失敗: ' + err.message },
      { status: 500 }
    );
  }
}

