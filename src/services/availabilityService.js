/**
 * 房態與預約檔期資料存取層 (100% 資料庫驅動，已移除 availability.json 依賴)
 * 
 * Vue 組件一律透過此 Service 異步取得即時房態。
 * 呼叫 Cloudflare Pages Functions 邊緣 API (/api/availability) 讀取 D1 即時房態 (含 Airbnb iCal 同步檔期)。
 */

let cachedBookedRanges = null;

/**
 * 取得已被預約的日期區間清單
 * @returns {Promise<Array<{startDate: string, endDate: string, source: string, type: string, status: string}>>}
 */
export async function getBookedRanges(force = false) {
  if (cachedBookedRanges && !force) {
    return cachedBookedRanges;
  }

  try {
    const res = await fetch('/api/availability');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.bookedRanges)) {
        cachedBookedRanges = data.bookedRanges;
        return cachedBookedRanges;
      }
    }
  } catch (err) {
    console.warn('[AvailabilityService] 取得房態失敗:', err.message);
  }

  return cachedBookedRanges || [];
}
