/**
 * 房型資料存取層 (100% 資料庫驅動，已移除本地靜態 rooms.json 依賴)
 * 
 * Vue 組件端一律透過此 Service 異步取得房型資料。
 * 完整房型規格、實景多角度相片圖集、平假日價格皆由 /api/rooms 即時自 D1 讀取。
 */

let cachedRooms = null;

export async function getRooms(force = false) {
  if (cachedRooms && !force) {
    return cachedRooms;
  }

  try {
    const res = await fetch('/api/rooms');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.rooms)) {
        cachedRooms = data.rooms;
        return cachedRooms;
      }
    }
  } catch (err) {
    console.warn('[RoomService] 讀取邊緣 /api/rooms 房型失敗:', err.message);
  }

  return cachedRooms || [];
}

/**
 * 取得特定房型詳情
 * @param {string} id 房型 ID
 */
export async function getRoomById(id) {
  const rooms = await getRooms();
  return rooms.find(room => room.id === id) || null;
}
