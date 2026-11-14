import { ref, computed, watch, toValue } from 'vue'

/**
 * 山語 Villa 後台通用分頁 Composable
 * 
 * @param {import('vue').Ref<Array> | Array | Function} itemsSource - 資料來源（支援 Ref、陣列或 Getter）
 * @param {number} [defaultPageSize=10] - 每頁筆數，預設為 10 筆
 * @returns {object} 分頁狀態與操作方法
 */
export function usePagination(itemsSource, defaultPageSize = 10) {
  const currentPage = ref(1)
  const pageSize = ref(defaultPageSize)

  // 取得最新陣列資料
  const items = computed(() => {
    const val = toValue(itemsSource)
    if (Array.isArray(val)) return val
    if (val && Array.isArray(val.value)) return val.value
    return []
  })

  // 總筆數
  const totalItems = computed(() => items.value.length)

  // 總頁數（至少 1 頁）
  const totalPages = computed(() => {
    return Math.max(1, Math.ceil(totalItems.value / pageSize.value))
  })

  // 當前頁切片資料
  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return items.value.slice(start, end)
  })

  // 當前頁起始序號 (1-based)
  const startIndex = computed(() => {
    if (totalItems.value === 0) return 0
    return (currentPage.value - 1) * pageSize.value + 1
  })

  // 當前頁結束序號 (1-based)
  const endIndex = computed(() => {
    return Math.min(currentPage.value * pageSize.value, totalItems.value)
  })

  // 是否有上一頁 / 下一頁
  const hasPrev = computed(() => currentPage.value > 1)
  const hasNext = computed(() => currentPage.value < totalPages.value)

  // 跳轉指定頁
  function goToPage(page) {
    const target = Math.max(1, Math.min(Number(page) || 1, totalPages.value))
    currentPage.value = target
  }

  // 上一頁
  function prevPage() {
    if (hasPrev.value) {
      goToPage(currentPage.value - 1)
    }
  }

  // 下一頁
  function nextPage() {
    if (hasNext.value) {
      goToPage(currentPage.value + 1)
    }
  }

  // 重置回第一頁（通常用於搜尋條件變更或刷新）
  function resetPage() {
    currentPage.value = 1
  }

  // 監聽總頁數變動，若刪除或過濾導致當前頁超出範圍，自動校正回最後一頁
  watch(totalPages, (newTotal) => {
    if (currentPage.value > newTotal) {
      currentPage.value = Math.max(1, newTotal)
    }
  })

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    paginatedItems,
    startIndex,
    endIndex,
    hasPrev,
    hasNext,
    goToPage,
    prevPage,
    nextPage,
    resetPage
  }
}
