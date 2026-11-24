<script setup>
import { ref, onMounted } from 'vue'
import { getBookedRanges, clearBookedRangesCache } from '../../services/availabilityService'
import {
  getAdminBookings,
  deleteAdminBlock,
  updateAdminBooking
} from '../../services/adminService'
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-vue-next'
import AdminCloseOccupiedTable from '../../components/admin/AdminCloseOccupiedTable.vue'
import AdminUnlockConfirmModal from '../../components/admin/AdminUnlockConfirmModal.vue'
import AdminOrderDetailModal from '../../components/admin/AdminOrderDetailModal.vue'
import AdminExternalBlockModal from '../../components/admin/AdminExternalBlockModal.vue'

const bookedRanges = ref([])
const bookings = ref([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const statusMessage = ref('')
const errorMessage = ref('')

// 彈窗狀態控制
const isUnlockConfirmModalOpen = ref(false)
const selectedUnlockBlock = ref(null)
const isDetailModalOpen = ref(false)
const selectedBooking = ref(null)
const isExternalModalOpen = ref(false)
const selectedExternalBlock = ref(null)

const fetchData = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const [rangesRes, bookingsRes] = await Promise.all([
      getBookedRanges(true),
      getAdminBookings()
    ])
    bookedRanges.value = rangesRes || []
    bookings.value = bookingsRes?.bookings || []
  } catch (err) {
    console.error('取得檔期與訂單資料失敗:', err)
    errorMessage.value = '載入檔期失敗: ' + err.message
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})

// 點擊「解除」手動關閉 -> 開啟確認彈窗
const handlePromptUnlock = (block) => {
  selectedUnlockBlock.value = block
  isUnlockConfirmModalOpen.value = true
}

// 執行解除手動鎖房
const handleExecuteUnlock = async (block) => {
  const blockId = block.id || block.uid
  const s = block.startDate || block.start_date
  const e = block.endDate || block.end_date

  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await deleteAdminBlock(blockId)

    // 即時樂觀更新：立即將被解除之檔期剔除
    const targetId = block.id
    const targetUid = block.uid || block.external_uid
    bookedRanges.value = bookedRanges.value.filter(b => {
      if (targetId != null && b.id == targetId) return false
      if (targetUid && (b.uid === targetUid || b.external_uid === targetUid)) return false
      if (blockId && (b.id == blockId || b.uid === blockId)) return false
      return true
    })

    statusMessage.value = `已成功解除【${s} 至 ${e}】之鎖定，前台月曆已重新開放預訂！`
    isUnlockConfirmModalOpen.value = false
    selectedUnlockBlock.value = null
    clearBookedRangesCache()
    await fetchData()
  } catch (err) {
    errorMessage.value = '解除失敗: ' + err.message
  } finally {
    isSubmitting.value = false
  }
}

// 開啟訂單詳情或外部檔期彈窗
const handleOpenBooking = (blockInfo) => {
  errorMessage.value = ''
  const uid = blockInfo?.id || blockInfo?.uid
  let target = bookings.value.find(b => b.id === uid)

  if (!target && blockInfo?.startDate && blockInfo?.endDate) {
    target = bookings.value.find(b => b.check_in === blockInfo.startDate && b.check_out === blockInfo.endDate)
  }

  if (target) {
    selectedBooking.value = target
    isDetailModalOpen.value = true
  } else {
    selectedExternalBlock.value = blockInfo
    isExternalModalOpen.value = true
  }
}

// 解除外部匯入檔期 (如 Airbnb)
const handleUnlockExternalBlock = async (block) => {
  const blockId = block.id || block.uid
  const s = block.startDate || block.start_date
  const e = block.endDate || block.end_date

  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await deleteAdminBlock(blockId)

    // 即時樂觀更新
    const targetId = block.id
    const targetUid = block.uid || block.external_uid
    bookedRanges.value = bookedRanges.value.filter(b => {
      if (targetId != null && b.id == targetId) return false
      if (targetUid && (b.uid === targetUid || b.external_uid === targetUid)) return false
      if (blockId && (b.id == blockId || b.uid === blockId)) return false
      return true
    })

    statusMessage.value = `已成功解除【${s} 至 ${e}】之佔用檔期，前台月曆已重新開放預訂！`
    isExternalModalOpen.value = false
    selectedExternalBlock.value = null
    clearBookedRangesCache()
    await fetchData()
  } catch (err) {
    errorMessage.value = '解除失敗: ' + err.message
  } finally {
    isSubmitting.value = false
  }
}

// 訂單管理操作
const handleCancelBooking = async (b) => {
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await updateAdminBooking(b.id, { status: 'CANCELLED' })

    // 即時樂觀更新
    bookedRanges.value = bookedRanges.value.filter(item => item.id !== b.id && item.uid !== b.id)
    const idx = bookings.value.findIndex(item => item.id === b.id)
    if (idx !== -1) {
      bookings.value[idx].status = 'CANCELLED'
    }

    statusMessage.value = `已成功取消【${b.guest_name} 貴賓】之預訂，【${b.check_in} 至 ${b.check_out}】檔期已即刻釋放為空房！`
    isDetailModalOpen.value = false
    clearBookedRangesCache()
    await fetchData()
  } catch (err) {
    errorMessage.value = '取消訂單失敗: ' + err.message
  } finally {
    isSubmitting.value = false
  }
}

const handleSaveBooking = async ({ id, data }) => {
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await updateAdminBooking(id, data)
    const guestLabel = data.guestName ? `${data.guestName} 貴賓` : '旅客'
    statusMessage.value = `【${guestLabel}】之預訂資料與狀態已更新成功！`
    isDetailModalOpen.value = false
    await fetchData()
  } catch (err) {
    errorMessage.value = '儲存修改失敗: ' + err.message
  } finally {
    isSubmitting.value = false
  }
}

const handleMarkDepositPaid = async (b) => {
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await updateAdminBooking(b.id, { depositStatus: 'PAID', status: 'CONFIRMED' })
    statusMessage.value = `【${b.guest_name} 貴賓】之訂單定金已成功核銷，狀態變更為正式已確認！`
    isDetailModalOpen.value = false
    await fetchData()
  } catch (err) {
    errorMessage.value = '核銷定金失敗: ' + err.message
  } finally {
    isSubmitting.value = false
  }
}

const handleReopenBooking = async (b) => {
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await updateAdminBooking(b.id, { status: 'CONFIRMED' })
    statusMessage.value = `【${b.guest_name} 貴賓】之預訂已成功恢復為已確認訂單！`
    isDetailModalOpen.value = false
    await fetchData()
  } catch (err) {
    errorMessage.value = '恢復訂單失敗: ' + err.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="admin-calendar-view">
    <!-- 頂部標題與重新整理 -->
    <div class="view-header">
      <div>
        <h1 class="view-title">檔期佔用與鎖房清單</h1>
        <p class="view-desc">全館佔用檔期清單總覽（官網直訂、管家自主保留與 Airbnb 外部同步）</p>
      </div>

      <div class="header-actions">
        <button class="btn-refresh" @click="fetchData" :disabled="isLoading">
          <RefreshCw :size="14" :class="{ 'spin-anim': isLoading }" />
          <span>重新整理</span>
        </button>
      </div>
    </div>

    <!-- 訊息提示 -->
    <div v-if="statusMessage" class="alert-box alert-success">
      <CheckCircle2 :size="16" />
      <span>{{ statusMessage }}</span>
    </div>

    <div v-if="errorMessage" class="alert-box alert-error">
      <AlertCircle :size="16" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- 檔期佔用清單組件 (支援全部、手動關閉、官網直訂與 Airbnb 匯入切換) -->
    <AdminCloseOccupiedTable
      :booked-ranges="bookedRanges"
      :bookings="bookings"
      :is-loading="isLoading"
      @unlock-block="handlePromptUnlock"
      @open-booking="handleOpenBooking"
      @open-external-block="handleOpenBooking"
    />

    <!-- 彈窗 1：確認解除手動關閉彈窗 -->
    <AdminUnlockConfirmModal
      v-model="isUnlockConfirmModalOpen"
      :block="selectedUnlockBlock"
      :is-submitting="isSubmitting"
      @confirm="handleExecuteUnlock"
    />

    <!-- 彈窗 2：官網直訂單詳細與取消/修改管理彈窗 -->
    <AdminOrderDetailModal
      v-model="isDetailModalOpen"
      :booking="selectedBooking"
      :is-submitting="isSubmitting"
      @cancel-booking="handleCancelBooking"
      @save-booking="handleSaveBooking"
      @confirm-paid="handleMarkDepositPaid"
      @reopen-booking="handleReopenBooking"
    />

    <!-- 彈窗 3：外部匯入或歷史佔用檔期管理彈窗 -->
    <AdminExternalBlockModal
      v-model="isExternalModalOpen"
      :block="selectedExternalBlock"
      :is-submitting="isSubmitting"
      @unlock="handleUnlockExternalBlock"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-calendar-view {
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
    letter-spacing: 1px;
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

    .btn-refresh {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.55rem 0.95rem;
      background: var(--admin-btn-secondary-bg, rgba(255, 255, 255, 0.05));
      border: 1px solid var(--admin-border, rgba(255, 255, 255, 0.2));
      color: var(--admin-text-main, #e2e8f0);
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
      &:hover:not(:disabled) { 
        border-color: var(--gold-primary, #C5A880);
        color: var(--gold-primary, #C5A880);
      }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
  }
}

.alert-box {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.88rem;

  &.alert-success {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.25);
    color: #16a34a;
  }
  &.alert-error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
    color: #dc2626;
  }
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

    .view-title { font-size: 1.25rem; }
    .header-actions {
      display: grid;
      grid-template-columns: 1fr;
      .btn-refresh { justify-content: center; }
    }
  }
}
</style>
