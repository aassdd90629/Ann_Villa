/**
 * src/composables/useAdminMediaManager.js
 * 
 * 媒體庫、客房空間與公共設施全生命週期管理 Composable
 */

import { ref } from 'vue'

export function useAdminMediaManager() {
  const isLoading = ref(false)
  const feedbackMessage = ref('')
  const feedbackType = ref('success')

  const hasR2 = ref(false)
  const counts = ref({ hero: 0, room: 0, facility: 0, total: 0 })
  const heroSlides = ref([])
  const roomAssets = ref([])
  const facilityAssets = ref([])

  const dbRooms = ref([])
  const dbFacilities = ref([])

  const fetchAllData = async () => {
    isLoading.value = true
    feedbackMessage.value = ''
    try {
      const token = localStorage.getItem('shanyu_admin_token')
      const headers = { 'Authorization': `Bearer ${token}` }

      const [mediaRes, roomsRes, facsRes] = await Promise.all([
        fetch('/api/admin/media', { headers }),
        fetch('/api/admin/rooms', { headers }),
        fetch('/api/admin/facilities', { headers })
      ])

      const mediaData = await mediaRes.json()
      if (mediaRes.ok && mediaData.success) {
        hasR2.value = Boolean(mediaData.hasR2)
        counts.value = mediaData.counts || {}
        heroSlides.value = mediaData.hero || []
        roomAssets.value = mediaData.room || []
        facilityAssets.value = mediaData.facility || []
      }

      const roomsData = await roomsRes.json()
      if (roomsRes.ok && roomsData.success) {
        dbRooms.value = roomsData.rooms || []
      }

      const facsData = await facsRes.json()
      if (facsRes.ok && facsData.success) {
        dbFacilities.value = facsData.facilities || []
      }
    } catch (err) {
      feedbackMessage.value = err.message || '讀取資料失敗'
      feedbackType.value = 'error'
    } finally {
      isLoading.value = false
    }
  }

  const togglePhotoActive = async (asset) => {
    const nextActive = !asset.isActive
    try {
      const token = localStorage.getItem('shanyu_admin_token')
      const res = await fetch('/api/admin/media', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'toggle_active',
          id: asset.id,
          isActive: nextActive
        })
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || '狀態切換失敗')
      asset.isActive = nextActive
      feedbackMessage.value = `圖片「${asset.titleZh}」已成功${nextActive ? '上架顯示' : '轉為草稿'}！`
      feedbackType.value = 'success'
    } catch (err) {
      feedbackMessage.value = err.message
      feedbackType.value = 'error'
    }
  }

  const deletePhoto = async (asset) => {
    try {
      const token = localStorage.getItem('shanyu_admin_token')
      const res = await fetch(`/api/admin/media?id=${encodeURIComponent(asset.id)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || '刪除失敗')
      feedbackMessage.value = `已成功刪除圖片「${asset.titleZh}」！`
      feedbackType.value = 'success'
      await fetchAllData()
      return true
    } catch (err) {
      feedbackMessage.value = err.message
      feedbackType.value = 'error'
      return false
    }
  }

  const deleteRoom = async (room) => {
    try {
      const token = localStorage.getItem('shanyu_admin_token')
      const res = await fetch(`/api/admin/rooms?id=${encodeURIComponent(room.id)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || '刪除客房失敗')
      feedbackMessage.value = data.message || '客房已刪除'
      feedbackType.value = 'success'
      await fetchAllData()
      return true
    } catch (err) {
      feedbackMessage.value = err.message
      feedbackType.value = 'error'
      return false
    }
  }

  const deleteFacility = async (fac) => {
    try {
      const token = localStorage.getItem('shanyu_admin_token')
      const res = await fetch(`/api/admin/facilities?id=${encodeURIComponent(fac.id)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || '刪除公設失敗')
      feedbackMessage.value = data.message || '公設已刪除'
      feedbackType.value = 'success'
      await fetchAllData()
      return true
    } catch (err) {
      feedbackMessage.value = err.message
      feedbackType.value = 'error'
      return false
    }
  }

  const reorderHero = async (orderedList) => {
    try {
      const token = localStorage.getItem('shanyu_admin_token')
      const items = orderedList.map((item, index) => ({ id: item.id, sortOrder: index + 1 }))
      await fetch('/api/admin/media', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'reorder', items })
      })
      heroSlides.value = orderedList
      feedbackMessage.value = 'Hero 輪播順序更新成功！'
      feedbackType.value = 'success'
    } catch (err) {
      feedbackMessage.value = err.message
      feedbackType.value = 'error'
    }
  }

  return {
    isLoading,
    feedbackMessage,
    feedbackType,
    hasR2,
    counts,
    heroSlides,
    roomAssets,
    facilityAssets,
    dbRooms,
    dbFacilities,
    fetchAllData,
    togglePhotoActive,
    deletePhoto,
    deleteRoom,
    deleteFacility,
    reorderHero
  }
}
