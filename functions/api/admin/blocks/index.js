/**
 * POST /api/admin/blocks - 管家手動新增檔期鎖定 (反灰保留)
 * 
 * 遵守後端規範：防撞期重疊檢查、參數化綁定
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
      startDate,
      endDate,
      summary = '管家手動保留'
    } = body;

    if (!startDate || !endDate) {
      return Response.json(
        { success: false, message: '請指定鎖定之起始日期與結束日期 (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return Response.json(
        { success: false, message: '結束日期必須晚於起始日期' },
        { status: 400 }
      );
    }

    // 產生唯一識別碼與 external_uid
    const blockId = 'block-' + Date.now();
    const externalUid = 'manual-lock-' + Date.now() + '@shanyu-villa';

    // 寫入 availability_blocks 表
    await env.DB.prepare(`
      INSERT INTO availability_blocks (
        id, room_id, start_date, end_date, summary, source, external_uid
      ) VALUES (?, ?, ?, ?, ?, 'MANUAL_LOCK', ?)
    `).bind(
      blockId,
      roomId,
      startDate,
      endDate,
      summary.trim(),
      externalUid
    ).run();

    // 寫入審計日誌
    try {
      const currentAdmin = context.data?.adminUser;
      const operatorTag = currentAdmin?.displayName 
        ? `${currentAdmin.displayName} (${currentAdmin.username})` 
        : 'admin';

      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('calendar', 'MANUAL_LOCK', ?, ?, ?, ?)
      `).bind(
        blockId,
        `管家手動自訂關房：${startDate} ~ ${endDate}（${summary.trim()}）`,
        JSON.stringify({ startDate, endDate, roomId, summary: summary.trim(), blockId }),
        operatorTag
      ).run();
    } catch (logErr) {
      console.warn('寫入 blocks audit log 警告:', logErr.message);
    }

    return Response.json({
      success: true,
      message: '檔期鎖定成功，官網日曆已即刻反灰',
      block: {
        id: blockId,
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

