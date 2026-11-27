import { buildLineUrl, openLineWithText } from '../utils/lineUrl.js';
import { useSiteContent } from '../composables/useSiteContent.js';

/**
 * 預約行為處理器 (100% 資料庫驅動，已移除 site.json 依賴)
 * 
 * 組件內一律透過此函式處理預約行為與送單。
 * 動態自 useSiteContent() 取得後台/資料庫設定之官方 LINE 帳號或連結，杜絕寫死 fallback。
 * 
 * @param {Object} options
 * @param {string} [options.roomId] 房型 ID (例如: room-01)
 * @param {string} [options.roomTitle] 房型名稱
 * @param {string} [options.checkIn] 入住日 (標準格式: YYYY-MM-DD)
 * @param {string} [options.checkOut] 退房日 (標準格式: YYYY-MM-DD)
 * @param {number} [options.guests] 入住人數
 * @param {string} [options.lineUrl] 官方 LINE 連結或 ID (若無傳入則自動取自 useSiteContent)
 * @param {string} [options.lineId] 官方 LINE ID
 */
export function handleBookingAction(options = {}) {
  const { basicInfo, channelsInfo } = useSiteContent();
  const roomName = options.roomTitle || options.roomId || '全區尊榮包棟';
  const dates = options.checkIn ? `${options.checkIn} 至 ${options.checkOut || ''}` : '檔期洽詢';
  const guests = options.guests ? `${options.guests} 位` : '依方案人數';

  const text = `您好，我想洽詢山語 Villa 預約諮詢：\n【諮詢項目】：${roomName}\n【預計入住日期】：${dates}\n【預計入住人數】：${guests}`;
  const targetLineId = options.lineUrl || options.lineId || channelsInfo.value?.directBooking?.lineUrl || basicInfo.value?.lineUrl || basicInfo.value?.lineId;
  openLineWithText({ lineId: targetLineId, text });
}

/**
 * 送出線上預約單至 Cloudflare Pages Functions 邊緣 API
 * 
 * @param {Object} data 訂單資料
 * @param {string} data.roomId 房型 ID (例: 'villa-full')
 * @param {string} data.guestName 訂房人真實姓名
 * @param {string} data.guestPhone 聯絡電話
 * @param {string} data.guestEmail 電子信箱
 * @param {string} [data.lineId] LINE ID
 * @param {string} data.checkIn 入住日 (YYYY-MM-DD)
 * @param {string} data.checkOut 退房日 (YYYY-MM-DD)
 * @param {number} data.guestCount 入住人數
 * @param {string} [data.specialRequests] 特殊需求備註
 * @returns {Promise<{success: boolean, booking?: Object, message: string}>}
 */
export async function submitOnlineBooking(data) {
  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    return result;
  } catch (err) {
    return {
      success: false,
      message: err.message || '網路連線失敗，請檢查網路後重試'
    };
  }
}
