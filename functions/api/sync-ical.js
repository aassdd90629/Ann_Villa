/**
 * /api/sync-ical - 外部 iCal 邊緣定時與手動同步端點 (目前外部匯入已停用)
 */

export async function syncIcalCalendar(env, customUrl = null) {
  return {
    success: true,
    message: '目前外部行事曆同步功能已停用，全館房態以自營直訂與管家自主關閉為主。',
    count: 0,
    eventsCount: 0,
    syncedAt: new Date().toISOString(),
    events: []
  };
}

export async function onRequest(context) {
  return Response.json({
    success: true,
    message: '目前外部行事曆同步功能已停用，全館房態以自營直訂與管家自主關閉為主。',
    count: 0,
    eventsCount: 0,
    syncedAt: new Date().toISOString(),
    events: []
  });
}
