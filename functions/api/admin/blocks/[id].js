/**
 * DELETE /api/admin/blocks/:id - 解除管家手動鎖房
 */
export async function onRequestDelete(context) {
  const { params, env } = context;
  const blockId = params.id;

  if (!env.DB) {
    return Response.json({ success: false, message: 'DB not bound' }, { status: 500 });
  }

  try {
    // 只能解除 source = 'MANUAL_LOCK' 或以 id/external_uid 比對
    const res = await env.DB.prepare(`
      DELETE FROM availability_blocks 
      WHERE (id = ? OR external_uid = ?) AND source = 'MANUAL_LOCK'
    `).bind(blockId, blockId).run();

    // 寫入審計日誌
    try {
      const currentAdmin = context.data?.adminUser;
      const operatorTag = currentAdmin?.displayName 
        ? `${currentAdmin.displayName} (${currentAdmin.username})` 
        : 'admin';

      await env.DB.prepare(`
        INSERT INTO admin_audit_logs (category, action, target_id, summary, details_json, operator)
        VALUES ('calendar', 'UNLOCK', ?, ?, ?, ?)
      `).bind(
        blockId,
        `解除手動鎖房檔期（${blockId}），重新開放官網預訂`,
        JSON.stringify({ blockId }),
        operatorTag
      ).run();
    } catch (logErr) {
      console.warn('寫入 blocks delete audit log 警告:', logErr.message);
    }

    return Response.json({
      success: true,
      message: '已成功解除該檔期之手動鎖定，前台日曆已重新開放預訂'
    });
  } catch (err) {
    return Response.json(
      { success: false, message: '解除鎖房失敗: ' + err.message },
      { status: 500 }
    );
  }
}

