import siteData from '../data/site.json';

/**
 * 預約行為處理器 (Phase 1 為 Phase 2 鋪路規範)
 * 
 * 組件內嚴禁直接 hardcode 跳轉連結，一律透過此函式處理預約行為。
 * 
 * @param {Object} options
 * @param {string} [options.roomId] 房型 ID (例如: room-01)
 * @param {string} [options.roomTitle] 房型名稱
 * @param {string} [options.checkIn] 入住日 (標準格式: YYYY-MM-DD)
 * @param {string} [options.checkOut] 退房日 (標準格式: YYYY-MM-DD)
 * @param {number} [options.guests] 入住人數
 */
export function handleBookingAction(options = {}) {
  // 🚀 Phase 1 (純前端先行版): 組裝 LINE 洽詢範本並開啟 LINE
  const roomName = options.roomTitle || options.roomId || '全區尊榮包棟';
  const dates = options.checkIn ? `${options.checkIn} 至 ${options.checkOut || ''}` : '檔期洽詢';
  const guests = options.guests ? `${options.guests} 位` : '依方案人數';

  const text = `您好，我想洽詢山語 Villa 預約諮詢：\n【諮詢項目】：${roomName}\n【預計入住日期】：${dates}\n【預計入住人數】：${guests}`;
  const targetUrl = `${siteData.lineUrl}?text=${encodeURIComponent(text)}`;

  window.open(targetUrl, '_blank', 'noopener,noreferrer');

  // ⚙️ Phase 2 (第二版擴充): 直接切換為送出 API 或開啟即時訂房 Modal
  // return submitOnlineBooking(options);
}
