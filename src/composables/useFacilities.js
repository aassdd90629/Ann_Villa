/**
 * src/composables/useFacilities.js
 * 
 * 100% 資料庫動態驅動：已完全移除靜態寫死之 INITIAL_FACILITIES。
 * 所有公共設施清單與相片圖集一律由 /api/facilities 異步讀取。
 */
import { ref } from 'vue'

const facilities = ref([])
const isLoaded = ref(false)
const isLoading = ref(false)

export function useFacilities() {
  const fetchFacilities = async (force = false) => {
    if (isLoaded.value && !force) return

    isLoading.value = true
    try {
      const res = await fetch('/api/facilities?t=' + Date.now(), { cache: 'no-cache' })
      if (res.ok) {
        const data = await res.json()
        if (data && data.success && Array.isArray(data.facilities)) {
          facilities.value = data.facilities
          isLoaded.value = true
        }
      }
    } catch (err) {
      console.warn('[useFacilities] 載入公共設施失敗:', err.message)
    } finally {
      isLoading.value = false
    }
  }

  fetchFacilities(false)

  return {
    facilities,
    isLoading,
    isLoaded,
    fetchFacilities
  }
}
