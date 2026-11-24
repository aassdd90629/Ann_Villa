/**
 * 房態與預約檔期資料存取層 (100% 資料庫驅動，已移除 availability.json 依賴)
 * 
 * Vue 組件一律透過此 Service 異步取得即時房態。
 * 呼叫 Cloudflare Pages Functions 邊緣 API (/api/availability) 讀取 D1 即時房態 (含 Airbnb iCal 同步檔期)。
 */

let cachedBookedRanges = null;

/**
 * 清除本地房態快取，確保下次查詢取得最新 D1 狀態
 */
export function clearBookedRangesCache() {
  cachedBookedRanges = null;
}

/**
 * 取得已被預約的日期區間清單
 * @param {boolean} force 是否強制跳過快取並發送新請求 (預設 false)
 * @returns {Promise<Array<{startDate: string, endDate: string, source: string, type: string, status: string}>>}
 */
export async function getBookedRanges(force = false) {
  if (cachedBookedRanges && !force) {
    return cachedBookedRanges;
  }

  try {
    const url = force ? `/api/availability?_t=${Date.now()}` : '/api/availability';
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
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
