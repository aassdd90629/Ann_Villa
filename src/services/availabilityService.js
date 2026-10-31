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
 * @returns {Promise<Array<{startDate: string, endDate: string, source: string, type: string, status: string}>>}
 */
export async function getBookedRanges() {
  // 🚀 Phase 1 (純前端靜態版): 目前開放全部可選，回傳空陣列（或 availability.json 設定）
  return Promise.resolve(availabilityData.bookedRanges || []);

  // ⚙️ Phase 2 (第二版擴充): 直接切換為邊緣後端 API
  // try {
  //   const res = await fetch('/api/availability');
  //   if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
  //   const data = await res.json();
  //   return data.bookedRanges || [];
  // } catch (err) {
  //   console.error('Failed to fetch live availability from backend:', err);
  //   return availabilityData.bookedRanges || [];
  // }
}

