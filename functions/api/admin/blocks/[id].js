/**
 * DELETE /api/admin/blocks/:id - 解除管家手動鎖房或外部匯入檔期
 * 遵守後端規範：參數化綁定、安全審計日誌
 */
export async function onRequestDelete(context) {
  const { params, env } = context;
  const blockId = params.id;

  if (!env.DB) {
    return Response.json({ success: false, message: 'DB not bound' }, { status: 500 });
  }

  try {
    // 檢查該筆鎖房或佔用記錄是否存在 (比對 id 或 external_uid，防範 SQLite 型態不匹配)
    const isNumeric = /^\d+$/.test(String(blockId).trim());
    const numId = isNumeric ? parseInt(blockId, 10) : -1;

    let existing;
    if (isNumeric) {
      existing = await env.DB.prepare(`
        SELECT id, start_date, end_date, summary, source, external_uid 
        FROM availability_blocks 
        WHERE id = ? OR external_uid = ?
      `).bind(numId, String(blockId)).first();
    } else {
      existing = await env.DB.prepare(`
        SELECT id, start_date, end_date, summary, source, external_uid 
        FROM availability_blocks 
        WHERE external_uid = ?
      `).bind(String(blockId)).first();
    }

    if (!existing) {
      return Response.json(
        { success: false, message: '找不到該筆鎖房或佔用檔期識別碼: ' + blockId },
        { status: 404 }
      );
    }

    // 執行刪除
    if (isNumeric) {
      await env.DB.prepare(`
        DELETE FROM availability_blocks 
        WHERE id = ? OR external_uid = ?
      `).bind(numId, String(blockId)).run();
    } else {
      await env.DB.prepare(`
        DELETE FROM availability_blocks 
        WHERE external_uid = ?
      `).bind(String(blockId)).run();
    }

    // 寫入審計日誌
    try {
      const currentAdmin = context.data?.adminUser;
      const operatorTag = currentAdmin?.displayName 
        ? `${currentAdmin.displayName} (${currentAdmin.username})` 
        : 'admin';

      const sourceDesc = existing.source === 'AIRBNB' ? 'Airbnb 外部匯入' : '管家自主鎖房';
      const summaryText = `管家解除【${existing.start_date} ~ ${existing.end_date}】之${sourceDesc}檔期（${existing.summary || '保留'}），前台月曆已重新開放預訂`;

      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('calendar', 'UNLOCK', ?, ?, ?, ?)
      `).bind(
        String(existing.id),
        summaryText,
        JSON.stringify({
          blockId,
          source: existing.source,
          startDate: existing.start_date,
          endDate: existing.end_date,
          summary: existing.summary
        }),
        operatorTag
      ).run();
    } catch (logErr) {
      console.warn('寫入 blocks delete audit log 警告:', logErr.message);
    }

    return Response.json({
      success: true,
      message: '已成功解除該檔期之佔用鎖定，前台日曆已即刻重新開放預訂！'
    });
  } catch (err) {
    return Response.json(
      { success: false, message: '解除鎖房失敗: ' + err.message },
      { status: 500 }
    );
  }
}
