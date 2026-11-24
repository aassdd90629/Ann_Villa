<script setup>
import { ref, onMounted } from 'vue'
import { getBookedRanges } from '../../services/availabilityService'
import {
  getAdminBookings,
  createAdminBlock,
  deleteAdminBlock,
  updateAdminBooking
} from '../../services/adminService'
import { useAdminCloseCalendar } from '../../composables/useAdminCloseCalendar'
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-vue-next'
import AdminMonthView from '../../components/admin/AdminMonthView.vue'
import AdminCloseActionPanel from '../../components/admin/AdminCloseActionPanel.vue'
import AdminCloseConfirmModal from '../../components/admin/AdminCloseConfirmModal.vue'
import AdminUnlockConfirmModal from '../../components/admin/AdminUnlockConfirmModal.vue'
import AdminOrderDetailModal from '../../components/admin/AdminOrderDetailModal.vue'
import AdminExternalBlockModal from '../../components/admin/AdminExternalBlockModal.vue'

const bookedRanges = ref([])
const bookings = ref([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const statusMessage = ref('')
const errorMessage = ref('')
const closeReason = ref('')

// 彈窗控制
const isCloseConfirmModalOpen = ref(false)
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

// 月曆互動 Composable (支援單選與多選，不分開始結束)
const {
  selectedDates,
  isPrevDisabled,
  displayedMonths,
  prevMonth,
  nextMonth,
  selectDate,
  removeDate,
  clearSelection: resetCalendarSelection
} = useAdminCloseCalendar(bookedRanges)

const handleSelectDate = (day) => {
  const msg = selectDate(day)
  if (msg) statusMessage.value = msg
}

const handleRemoveDate = (dateStr) => {
  removeDate(dateStr)
}

const handleClearAll = () => {
  resetCalendarSelection()
  closeReason.value = ''
  errorMessage.value = ''
}

// 點擊「確認關閉所選日期月曆」按鈕 -> 打開確認彈窗
const handlePromptClose = () => {
  errorMessage.value = ''
  statusMessage.value = ''

  if (!selectedDates.value || selectedDates.value.length === 0) {
    errorMessage.value = '請在左側月曆點選要關閉的日期（可多選）！'
    return
  }
  isCloseConfirmModalOpen.value = true
}

// 彈窗內確認真正執行關閉所選日期 (單選或多選)
const handleExecuteClose = async () => {
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const datesToClose = [...selectedDates.value]
    await createAdminBlock({
      roomId: 'villa-full',
      dates: datesToClose,
      summary: closeReason.value.trim() || '自主保留 / 閉館維護'
    })

    const summaryText = datesToClose.length > 2
      ? `${datesToClose.slice(0, 2).join('、')} 等共 ${datesToClose.length} 天`
      : datesToClose.join('、')

    statusMessage.value = `成功關閉【${summaryText}】月曆！前台所選日期已即刻反灰。`
    isCloseConfirmModalOpen.value = false
    handleClearAll()
    await fetchData()
  } catch (err) {
    errorMessage.value = err.message || '關閉月曆失敗'
  } finally {
    isSubmitting.value = false
  }
}

// 點擊解除手動關閉 -> 打開確認解除彈窗
const handlePromptUnlock = (block) => {
  selectedUnlockBlock.value = block
  isUnlockConfirmModalOpen.value = true
}

// 彈窗內確認真正執行解除手動鎖房
const handleExecuteUnlock = async (block) => {
  const blockId = block.id || block.uid
  const s = block.startDate || block.start_date
  const e = block.endDate || block.end_date

  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await deleteAdminBlock(blockId)
    statusMessage.value = `已成功解除【${s} 至 ${e}】之鎖定，前台月曆已重新開放預訂！`
    isUnlockConfirmModalOpen.value = false
    selectedUnlockBlock.value = null
    await fetchData()
  } catch (err) {
    errorMessage.value = '解除失敗: ' + err.message
  } finally {
    isSubmitting.value = false
  }
}

// 點擊「已訂單 / Airbnb」格子或下方列表「查看」 -> 打開訂單彈窗或外部檔期彈窗
const handleOpenBooking = (blockInfo) => {
  errorMessage.value = ''
  const uid = blockInfo?.id || blockInfo?.uid
  let target = bookings.value.find(b => b.id === uid)

  if (!target && blockInfo?.startDate && blockInfo?.endDate) {
    target = bookings.value.find(b => b.check_in === blockInfo.startDate && b.check_out === blockInfo.endDate)
  }

  if (target) {
    // 官網直訂單 -> 開啟直訂單管理彈窗
    selectedBooking.value = target
    isDetailModalOpen.value = true
  } else {
    // 外部匯入檔期 (如 Airbnb) 或無直訂單之佔用 -> 開啟專屬彈窗 (絕不使用 alert)
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
    statusMessage.value = `已成功解除【${s} 至 ${e}】之佔用檔期，前台月曆已重新開放預訂！`
    isExternalModalOpen.value = false
    selectedExternalBlock.value = null
    await fetchData()
  } catch (err) {
    errorMessage.value = '解除失敗: ' + err.message
  } finally {
    isSubmitting.value = false
  }
}

// 訂單彈窗內取消整筆訂單
const handleCancelBooking = async (b) => {
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await updateAdminBooking(b.id, {
      status: 'CANCELLED'
    })
    statusMessage.value = `已成功取消【${b.guest_name} 貴賓】之預訂，【${b.check_in} 至 ${b.check_out}】檔期已即刻釋放為空房！`
    isDetailModalOpen.value = false
    await fetchData()
  } catch (err) {
    errorMessage.value = '取消訂單失敗: ' + err.message
  } finally {
    isSubmitting.value = false
  }
}

// 訂單彈窗內儲存修改
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

// 訂單彈窗內確認定金
const handleMarkDepositPaid = async (b) => {
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await updateAdminBooking(b.id, {
      depositStatus: 'PAID',
      status: 'CONFIRMED'
    })
    statusMessage.value = `【${b.guest_name} 貴賓】之訂單定金已成功核銷，狀態變更為正式已確認！`
    isDetailModalOpen.value = false
    await fetchData()
  } catch (err) {
    errorMessage.value = '核銷定金失敗: ' + err.message
  } finally {
    isSubmitting.value = false
  }
}

// 訂單彈窗內恢復訂單
const handleReopenBooking = async (b) => {
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await updateAdminBooking(b.id, {
      status: 'CONFIRMED'
    })
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
  <div class="admin-close-calendar-view">
    <!-- 頂部標頭 -->
    <div class="view-header">
      <div>
        <h1 class="view-title">房態月曆與自主關閉</h1>
        <p class="view-desc">視覺化雙月曆房態：點選日期（支援單選與多選）即可自主關閉或重新開放；點擊已佔用格子可查看客資明細、一鍵取消或解除檔期</p>
      </div>

      <button class="btn-refresh" @click="fetchData" :disabled="isLoading">
        <RefreshCw :size="14" :class="{ 'spin-anim': isLoading }" />
        <span>重新整理檔期與訂單</span>
      </button>
    </div>

    <!-- 訊息提示 (取代 browser alert) -->
    <div v-if="statusMessage" class="alert-box alert-success">
      <CheckCircle2 :size="16" />
      <span>{{ statusMessage }}</span>
    </div>

    <div v-if="errorMessage" class="alert-box alert-error">
      <AlertCircle :size="16" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- 月曆選取與關閉操作主控區 -->
    <div class="calendar-workspace">
      <!-- 雙月份月曆 -->
      <div class="calendar-main-col">
        <div class="two-months-grid">
          <AdminMonthView
            v-for="(m, mIdx) in displayedMonths"
            :key="m.key"
            :month-data="m"
            :month-index="mIdx"
            :total-months="displayedMonths.length"
            :is-prev-disabled="isPrevDisabled"
            :selected-dates="selectedDates"
            @select-date="handleSelectDate"
            @prev-month="prevMonth"
            @next-month="nextMonth"
            @unlock-block="handlePromptUnlock"
            @open-booking="handleOpenBooking"
          />
        </div>
      </div>

      <!-- 右側：使用者自填理由與確認關閉卡片 (支援多選與移除) -->
      <div class="control-panel-col">
        <AdminCloseActionPanel
          v-model="closeReason"
          :selected-dates="selectedDates"
          :is-submitting="isSubmitting"
          @confirm="handlePromptClose"
          @clear="handleClearAll"
          @remove-date="handleRemoveDate"
        />
      </div>
    </div>

    <!-- 彈窗 1：確認關閉月曆彈窗 (支援單選或多選) -->
    <AdminCloseConfirmModal
      v-model="isCloseConfirmModalOpen"
      :dates="selectedDates"
      :reason="closeReason"
      :is-submitting="isSubmitting"
      @confirm="handleExecuteClose"
    />

    <!-- 彈窗 2：確認解除手動關閉彈窗 -->
    <AdminUnlockConfirmModal
      v-model="isUnlockConfirmModalOpen"
      :block="selectedUnlockBlock"
      :is-submitting="isSubmitting"
      @confirm="handleExecuteUnlock"
    />

    <!-- 彈窗 3：官網直訂單詳細與取消/修改管理彈窗 -->
    <AdminOrderDetailModal
      v-model="isDetailModalOpen"
      :booking="selectedBooking"
      :is-submitting="isSubmitting"
      @cancel-booking="handleCancelBooking"
      @save-booking="handleSaveBooking"
      @confirm-paid="handleMarkDepositPaid"
      @reopen-booking="handleReopenBooking"
    />

    <!-- 彈窗 4：外部匯入或歷史佔用檔期管理彈窗 (取代 alert) -->
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

.admin-close-calendar-view {
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
    color: var(--admin-text-main, #1A1E1F);
    margin: 0 0 0.35rem 0;
    letter-spacing: 1px;
  }
  .view-desc {
    font-size: 0.85rem;
    color: var(--admin-text-sub, #475569);
    margin: 0;
  }
  .btn-refresh {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.85rem;
    background: var(--admin-bg-base, #F5F3EC);
    border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3));
    border-radius: 6px;
    color: var(--admin-text-main, #1A1E1F);
    font-size: 0.82rem;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { border-color: var(--gold-primary, #C5A880); color: var(--gold-dark, #91754F); }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
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

.calendar-workspace {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.5rem;
  align-items: flex-start;
  @media (max-width: 1024px) { grid-template-columns: 1fr; }
}

.two-months-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
