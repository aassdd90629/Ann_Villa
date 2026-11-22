<script setup>
import { ref, onMounted } from 'vue'
import { getAdminBookings, updateAdminBooking, clearTestBookings } from '../../services/adminService'
import { usePagination } from '../../composables/usePagination'
import { 
  RefreshCw, 
  Trash2,
  CheckCircle2
} from 'lucide-vue-next'
import AdminBookingsTable from '../../components/admin/AdminBookingsTable.vue'
import AdminOrderDetailModal from '../../components/admin/AdminOrderDetailModal.vue'
import Pagination from '../../components/common/Pagination.vue'

const bookings = ref([])
const isLoading = ref(false)
const selectedBooking = ref(null)
const isDetailModalOpen = ref(false)
const statusMessage = ref('')

// 通用 10 筆分頁邏輯
const {
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  paginatedItems,
  startIndex,
  endIndex
} = usePagination(bookings, 10)

const fetchBookings = async () => {
  isLoading.value = true
  try {
    const res = await getAdminBookings()
    bookings.value = res.bookings || []
  } catch (err) {
    console.error('取得訂單失敗:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchBookings()
})

const openDetail = (b) => {
  selectedBooking.value = b
  isDetailModalOpen.value = true
}

const handleMarkDepositPaid = async (b) => {
  if (!confirm(`確定已確認收到旅客【${b.guest_name}】的 50% 定金 (NT$ ${Number(b.deposit_amount).toLocaleString()}) 嗎？\n系統將自動把訂單狀態轉為【已確認 (CONFIRMED)】。`)) {
    return
  }

  try {
    await updateAdminBooking(b.id, {
      depositStatus: 'PAID',
      status: 'CONFIRMED'
    })
    statusMessage.value = `訂單 ${b.id} 定金已成功核銷，狀態轉為正式確認！`
    if (selectedBooking.value && selectedBooking.value.id === b.id) {
      selectedBooking.value.deposit_status = 'PAID'
      selectedBooking.value.status = 'CONFIRMED'
    }
    await fetchBookings()
  } catch (err) {
    alert('更新失敗: ' + err.message)
  }
}

const handleClearTestBookings = async () => {
  if (!confirm('⚠️ 警告：這將會清除「所有直訂測試單」並將檔期恢復為空房！\n通常用於 Demo 驗收完畢後還原乾淨日曆，確定要清除嗎？')) {
    return
  }

  try {
    const res = await clearTestBookings()
    statusMessage.value = `測試資料清理成功！已清除 ${res.deletedCount || 0} 筆測試訂單，日曆已全面還原純淨！`
    await fetchBookings()
  } catch (err) {
    alert('清理失敗: ' + err.message)
  }
}
</script>

<template>
  <div class="admin-bookings-view">
    <div class="view-header">
      <div>
        <h1 class="view-title">直訂單管理與定金核銷</h1>
        <p class="view-desc">審核線上預約直訂單、核對匯款後五碼並確認 50% 定金到帳</p>
      </div>

      <div class="header-actions">
        <!-- 專屬 Demo 驗收清理按鈕 -->
        <button class="btn-clear-test" @click="handleClearTestBookings" title="Demo 結束後一鍵清空測試預約">
          <Trash2 :size="15" />
          <span>Demo 結束一鍵清空測試單</span>
        </button>

        <button class="btn-refresh" @click="fetchBookings" :disabled="isLoading">
          <RefreshCw :size="15" :class="{ 'spin-anim': isLoading }" />
          <span>重新整理</span>
        </button>
      </div>
    </div>

    <!-- 成功提示條 -->
    <div v-if="statusMessage" class="alert-success">
      <CheckCircle2 :size="16" />
      <span>{{ statusMessage }}</span>
    </div>

    <!-- 直訂單表格組件 -->
    <AdminBookingsTable
      :bookings="paginatedItems"
      :total-count="bookings.length"
      :is-loading="isLoading"
      @open-detail="openDetail"
      @confirm-paid="handleMarkDepositPaid"
    >
      <template #pagination>
        <Pagination
          v-model:current-page="currentPage"
          :total-pages="totalPages"
          :total-items="totalItems"
          :page-size="pageSize"
          :start-index="startIndex"
          :end-index="endIndex"
        />
      </template>
    </AdminBookingsTable>

    <!-- 訂單詳細彈窗 -->
    <AdminOrderDetailModal 
      v-model="isDetailModalOpen" 
      :booking="selectedBooking" 
      @confirm-paid="handleMarkDepositPaid" 
    />
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-bookings-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;

  .view-title {
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--admin-text-main, #f8fafc);
    margin: 0 0 0.35rem 0;
  }
  .view-desc {
    font-size: 0.85rem;
    color: var(--admin-text-sub, #94a3b8);
    margin: 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .btn-clear-test {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 0.95rem;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
      &:hover { background: rgba(239, 68, 68, 0.25); }
    }

    .btn-refresh {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 1rem;
      background: var(--admin-btn-secondary-bg, rgba(255, 255, 255, 0.05));
      border: 1px solid var(--admin-border, rgba(255, 255, 255, 0.2));
      color: var(--admin-text-main, #e2e8f0);
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      &:hover:not(:disabled) { 
        border-color: var(--gold-primary);
        color: var(--gold-primary);
      }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
  }
}

.alert-success {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
  border-radius: 6px;
  font-size: 0.85rem;
}

.spin-anim {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.85rem;

    .view-title {
      font-size: 1.25rem;
    }

    .header-actions {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.5rem;

      .btn-clear-test,
      .btn-refresh {
        justify-content: center;
        padding: 0.6rem 0.5rem;
        font-size: 0.82rem;
      }
    }
  }
}
</style>
