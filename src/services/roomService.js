import roomsData from '../data/rooms.json';

/**
 * 房型資料存取層 (Phase 1 為 Phase 2 鋪路規範)
 * 
 * Vue 組件端一律透過此 Service 異步取得房型資料。
 * 第二版串接 Cloudflare Pages Functions (/api/rooms) 時，所有組件端零改動。
 */
export async function getRooms() {
  // 🚀 Phase 1 (純前端先行版): 回傳靜態 JSON Promise
  return Promise.resolve(roomsData);

  // ⚙️ Phase 2 (第二版擴充): 解開下方即可無縫切換為真實 API
  // const res = await fetch('/api/rooms');
  // if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
  // return await res.json();
}

/**
 * 取得特定房型詳情
 * @param {string} id 房型 ID
 */
export async function getRoomById(id) {
  const rooms = await getRooms();
  return rooms.find(room => room.id === id) || null;
}
