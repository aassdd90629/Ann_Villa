import roomsData from '../data/rooms.json';

/**
 * 房型資料存取層 (Phase 1 為 Phase 2 鋪路規範)
 * 
 * Vue 組件端一律透過此 Service 異步取得房型資料。
 * 第二版串接 Cloudflare Pages Functions (/api/rooms) 時，所有組件端零改動。
 */
export async function getRooms() {
  try {
    const res = await fetch('/api/rooms');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.rooms)) {
        // 將 D1 資料庫即時價格與房型動態合併至前端靜態詳細欄位 (含圖檔與多角度介紹)
        return roomsData.map(room => {
          const liveRoom = data.rooms.find(r => r.id === room.id);
          if (liveRoom) {
            return {
              ...room,
              basePrice: liveRoom.basePrice,
              holidayPrice: liveRoom.holidayPrice,
              capacityMax: liveRoom.capacityMax
            };
          }
          return room;
        });
      }
    }
  } catch (err) {
    console.info('[RoomService] 邊緣 API 離線，切換為本地靜態房型資料');
  }

  return roomsData;
}

/**
 * 取得特定房型詳情
 * @param {string} id 房型 ID
 */
export async function getRoomById(id) {
  const rooms = await getRooms();
  return rooms.find(room => room.id === id) || null;
}
