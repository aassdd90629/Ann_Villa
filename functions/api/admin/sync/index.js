/**
 * POST /api/admin/sync - 管家從後台一鍵立即同步 Airbnb
 */
import { onRequest as syncIcalHandler } from '../../sync-ical.js';

export async function onRequest(context) {
  return await syncIcalHandler(context);
}

export async function onRequestPost(context) {
  return await syncIcalHandler(context);
}
