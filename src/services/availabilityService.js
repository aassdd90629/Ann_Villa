import availabilityData from '../data/availability.json';

/**
 * 房態與預約檔期資料存取層 (Phase 1 為 Phase 2 後端接軌規範)
 * 
 * Vue 組件一律透過此 Service 異步取得即時房態。
 * 未來接入 Cloudflare Pages Functions (/functions/api/availability) 或 OTA iCal 同步時，
 * 前端組件完全不需修改，只需在此切換為真實 fetch API！
 */

/**
 * 取得已被預約的日期區間清單
 * 
 * 優先順序:
 * 1. 呼叫 Cloudflare Pages Functions 邊緣 API (/api/availability) 讀取 D1 即時房態
 * 2. 若 API 無法連線 (例如單純執行 vite dev 靜態預覽)，自動 fallback 至本地靜態 availability.json
 * 
 * @returns {Promise<Array<{startDate: string, endDate: string, source: string, type: string, status: string}>>}
 */
export async function getBookedRanges() {
  try {
    const res = await fetch('/api/availability');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.bookedRanges)) {
        return data.bookedRanges;
      }
    }
  } catch (err) {
    // 靜態模式或離線狀態，平滑降級使用快照 JSON
    console.info('[AvailabilityService] 邊緣 API 離線，切換為本地快照房態資料');
  }

  return availabilityData.bookedRanges || [];
}

