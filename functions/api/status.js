/**
 * GET /api/status - 系統與資料庫健康檢查 API
 */
export async function onRequestGet(context) {
  const { env } = context;

  try {
    let dbStatus = 'disconnected';
    let roomsCount = 0;
    let blocksCount = 0;

    if (env.DB) {
      const roomRow = await env.DB.prepare('SELECT COUNT(*) as count FROM rooms').first();
      roomsCount = roomRow ? roomRow.count : 0;

      const blockRow = await env.DB.prepare('SELECT COUNT(*) as count FROM availability_blocks').first();
      blocksCount = blockRow ? blockRow.count : 0;

      dbStatus = 'connected (Cloudflare D1)';
    }

    return Response.json({
      status: 'ok',
      service: '山語 Villa 邊緣後端服務 (Cloudflare Pages Functions)',
      database: dbStatus,
      metrics: {
        totalRooms: roomsCount,
        activeBlocks: blocksCount
      },
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  } catch (err) {
    return Response.json({
      status: 'error',
      message: err.message
    }, { status: 500 });
  }
}

