/**
 * POST /api/admin/bookings/clear-test
 * 
 * 專屬 Demo 驗收輔助：一鍵清除所有測試直訂單
 * 讓管家/開發者在向客戶展示完直訂功能後，能一鍵將測試資料清空，還原乾淨日曆。
 */
export async function onRequestPost(context) {
  const { env } = context;

  if (!env.DB) {
    return Response.json({ success: false, message: 'DB not bound' }, { status: 500 });
  }

  try {
    // 查詢現有訂單筆數
    const countRes = await env.DB.prepare('SELECT COUNT(*) AS total FROM bookings').first();
    const totalBookings = countRes?.total || 0;

    // 清空 bookings 表
    await env.DB.prepare('DELETE FROM bookings').run();

    return Response.json({
      success: true,
      message: '已成功清理所有測試訂單',
      deletedCount: totalBookings
    });
  } catch (err) {
    return Response.json(
      { success: false, message: '清理測試訂單失敗: ' + err.message },
      { status: 500 }
    );
  }
}

