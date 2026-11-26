/**
 * POST /api/admin/blocks - 管家手動新增檔期鎖定 (反灰保留)
 * 
 * 遵守後端規範：防撞期重疊檢查、參數化綁定、排他庫存表同步
 * 支援多日期陣列 (dates: ['YYYY-MM-DD', ...]) 或單一區間 (startDate, endDate)
 * 
 * 核心業務防呆 (P1 級別)：
 * ★ 鎖房撞期旅客正式訂單檢核：若所選日期包含有效訂單，阻擋並回報衝突訂單資訊；若 force=true 則允許強制保留覆蓋。
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
      summary = '管家手動保留',
      force = false // 是否強制覆蓋有效訂單
    } = body;

    const currentAdmin = context.data?.adminUser;
    const operatorTag = currentAdmin?.displayName 
      ? `${currentAdmin.displayName} (${currentAdmin.username})` 
      : 'admin';

    // 模式 A：傳入多選日期陣列
    if (Array.isArray(dates) && dates.length > 0) {
      // 1. 防呆檢驗：檢查是否包含旅客有效訂單
      if (!force) {
        const placeholders = dates.map(() => '?').join(',');
        const conflictQuery = `
          SELECT DISTINCT b.id, b.guest_name, b.check_in, b.check_out 
          FROM bookings b
          JOIN room_daily_inventory inv ON b.id = inv.booking_id
          WHERE b.room_id = ?
            AND b.status != 'CANCELLED'
            AND inv.occupy_date IN (${placeholders})
        `;
        const conflictRes = await env.DB.prepare(conflictQuery).bind(roomId, ...dates).all();
        if (conflictRes && conflictRes.results && conflictRes.results.length > 0) {
          const list = conflictRes.results;
          const detailStr = list.map(c => `【${c.id}】${c.guest_name}（${c.check_in} ~ ${c.check_out}）`).join('、');
          return Response.json({
            success: false,
            hasConflict: true,
            conflicts: list,
            message: `所選鎖定日期中包含旅客正式訂單：${detailStr}。若確認覆蓋關閉，請確認「強制覆蓋鎖定」。`
          }, { status: 409 });
        }
      }

      const getNextDay = (dateStr) => {
        const parts = String(dateStr).split('-').map(Number);
        if (parts.length === 3) {
          const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + 1));
          const y = d.getUTCFullYear();
          const m = String(d.getUTCMonth() + 1).padStart(2, '0');
          const day = String(d.getUTCDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        }
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

        // 同步寫入每日庫存排他表
        try {
          await env.DB.prepare(`
            INSERT OR REPLACE INTO room_daily_inventory (room_id, occupy_date, booking_id, source)
            VALUES (?, ?, ?, 'MANUAL_LOCK')
          `).bind(roomId, curDate, externalUid).run();
        } catch (_) {}

        createdBlocks.push({
          id: rowId || externalUid,
          uid: externalUid,
          startDate: curDate,
          endDate: nextDay,
          summary: summary.trim(),
          source: 'MANUAL_LOCK',
          type: 'blocked',
          status: 'confirmed'
        });
      }

      // 寫入審計日誌
      try {
        const forceTag = force ? '【管家強制覆蓋鎖定】' : '';
        await env.DB.prepare(`
          INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
          VALUES ('calendar', 'MANUAL_LOCK', ?, ?, ?, ?)
        `).bind(
          String(createdBlocks[0]?.id || 'batch-blocks'),
          `${forceTag}管家手動多選關房：共 ${dates.length} 天（${dates.join(', ')}）`,
          JSON.stringify({ dates, roomId, summary: summary.trim(), force, createdBlocks }),
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

    // 1. 防呆檢驗：檢查是否包含旅客有效訂單
    if (!force) {
      const conflictQuery = `
        SELECT id, guest_name, check_in, check_out 
        FROM bookings 
        WHERE room_id = ? 
          AND status != 'CANCELLED'
          AND NOT (check_out <= ? OR check_in >= ?)
      `;
      const conflictRes = await env.DB.prepare(conflictQuery).bind(roomId, startDate, endDate).all();
      if (conflictRes && conflictRes.results && conflictRes.results.length > 0) {
        const list = conflictRes.results;
        const detailStr = list.map(c => `【${c.id}】${c.guest_name}（${c.check_in} ~ ${c.check_out}）`).join('、');
        return Response.json({
          success: false,
          hasConflict: true,
          conflicts: list,
          message: `所選鎖定區間中包含旅客正式訂單：${detailStr}。若確認覆蓋關閉，請確認「強制覆蓋鎖定」。`
        }, { status: 409 });
      }
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

    // 同步每日庫存排他表
    try {
      let cur = new Date(startDate);
      const endD = new Date(endDate);
      while (cur < endD) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        await env.DB.prepare(`
          INSERT OR REPLACE INTO room_daily_inventory (room_id, occupy_date, booking_id, source)
          VALUES (?, ?, ?, 'MANUAL_LOCK')
        `).bind(roomId, `${y}-${m}-${d}`, externalUid).run();
        cur.setDate(cur.getDate() + 1);
      }
    } catch (_) {}

    // 寫入審計日誌
    try {
      const forceTag = force ? '【管家強制覆蓋鎖定】' : '';
      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('calendar', 'MANUAL_LOCK', ?, ?, ?, ?)
      `).bind(
        targetId,
        `${forceTag}管家手動自訂關房：${startDate} ~ ${endDate}（${summary.trim()}）`,
        JSON.stringify({ startDate, endDate, roomId, summary: summary.trim(), force, externalUid, id: rowId }),
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
