/**
 * src/services/adminService.js
 * 
 * 山語 Villa 後台專屬 API 服務層
 * 自動於請求 Header 附帶 Bearer Token，並處理 401 登入逾期自動登出。
 */

const TOKEN_KEY = 'shanyu_admin_token'

function getAuthHeaders() {
  const token = localStorage.getItem(TOKEN_KEY) || ''
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
}

async function handleResponse(res) {
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('shanyu_admin_user')
    if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
      window.location.href = '/admin/login?expired=1'
    }
    throw new Error('登入憑證已失效，請重新登入。')
  }

  const data = await res.json()
  if (!res.ok || !data.success) {
    throw new Error(data.message || '請求失敗')
  }
  return data
}

/**
 * 取得後台訂單列表
 */
export async function getAdminBookings(params = {}) {
  const query = new URLSearchParams(params).toString()
  const url = `/api/admin/bookings${query ? `?${query}` : ''}`
  const res = await fetch(url, { headers: getAuthHeaders() })
  return handleResponse(res)
}

/**
 * 更新訂單狀態 (核銷定金、確認訂單、取消訂單)
 */
export async function updateAdminBooking(id, updateData) {
  const res = await fetch(`/api/admin/bookings/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updateData)
  })
  return handleResponse(res)
}

/**
 * 一鍵清理測試訂單 (Demo 完畢後還原乾淨日曆)
 */
export async function clearTestBookings() {
  const res = await fetch('/api/admin/bookings/clear-test', {
    method: 'POST',
    headers: getAuthHeaders()
  })
  return handleResponse(res)
}

/**
 * 手動新增房態鎖定 (維護、保養、親友保留)
 */
export async function createAdminBlock(blockData) {
  const res = await fetch('/api/admin/blocks', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(blockData)
  })
  return handleResponse(res)
}

/**
 * 解除手動鎖房
 */
export async function deleteAdminBlock(id) {
  const res = await fetch(`/api/admin/blocks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  return handleResponse(res)
}

/**
 * 手動強制觸發 Airbnb iCal 同步
 */
export async function triggerAdminSync() {
  const res = await fetch('/api/admin/sync', {
    method: 'POST',
    headers: getAuthHeaders()
  })
  return handleResponse(res)
}
