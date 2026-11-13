/**
 * GET /api/admin/sync/logs - 查詢近期同步日誌
 */
export async function onRequestGet(context) {
  const { env } = context;

  if (!env.DB) {
    return Response.json({ success: false, message: 'DB not bound' }, { status: 500 });
  }

  try {
    const { results } = await env.DB.prepare(`
      SELECT id, channel, status, events_count, message, created_at 
      FROM sync_logs 
      ORDER BY created_at DESC 
      LIMIT 30
    `).all();

    return Response.json({
      success: true,
      logs: results || []
    });
  } catch (err) {
    return Response.json(
      { success: false, message: '查詢同步日誌失敗: ' + err.message },
      { status: 500 }
    );
  }
}
