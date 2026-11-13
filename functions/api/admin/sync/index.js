/**
 * POST /api/admin/sync - 管家從後台一鍵立即同步 Airbnb
 */
import { onRequest as syncIcalHandler } from '../../sync-ical.js';

export async function onRequestPost(context) {
  // 直接調用既有通過嚴密驗證之 sync-ical 端點邏輯
  return await syncIcalHandler(context);
}
