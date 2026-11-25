/**
 * POST /api/admin/sync - 管家手動觸發外部行事曆同步 (目前外部匯入已停用)
 */
import { onRequest as syncIcalHandler } from '../../sync-ical.js';

export async function onRequest(context) {
  return await syncIcalHandler(context);
}

export async function onRequestPost(context) {
  return await syncIcalHandler(context);
}
