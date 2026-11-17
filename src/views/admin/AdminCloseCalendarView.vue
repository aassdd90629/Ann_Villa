<script setup>
import { ref, computed, onMounted } from 'vue'
import { getBookedRanges } from '../../services/availabilityService'
import { createAdminBlock, deleteAdminBlock } from '../../services/adminService'
import { usePagination } from '../../composables/usePagination'
import { useAdminCloseCalendar } from '../../composables/useAdminCloseCalendar'
import { Trash2, CheckCircle2, AlertCircle, RefreshCw, Lock } from 'lucide-vue-next'
import AdminMonthView from '../../components/admin/AdminMonthView.vue'
import AdminCloseActionPanel from '../../components/admin/AdminCloseActionPanel.vue'
import Pagination from '../../components/common/Pagination.vue'

const bookedRanges = ref([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const statusMessage = ref('')
const errorMessage = ref('')
const closeReason = ref('')

const fetchRanges = async () => {
  isLoading.value = true
  try {
    bookedRanges.value = await getBookedRanges()
  } catch (err) {
    console.error('取得檔期失敗:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchRanges()
})

// 使用前台相同的點選月曆與日曆計算 Composable
const {
  checkInDate,
  checkOutDate,
  isPrevDisabled,
  displayedMonths,
  selectedNights,
  prevMonth,
  nextMonth,
  isCheckOutSelectable,
  selectDate,
  clearSelection: resetCalendarSelection
} = useAdminCloseCalendar(bookedRanges)

const handleSelectDate = (day) => {
  const msg = selectDate(day)
  if (msg) statusMessage.value = msg
}

const handleClearAll = () => {
  resetCalendarSelection()
  closeReason.value = ''
  errorMessage.value = ''
}

// 提交關閉月曆
const handleConfirmClose = async () => {
  errorMessage.value = ''
  statusMessage.value = ''

  if (!checkInDate.value || !checkOutDate.value) {
    errorMessage.value = '請在左側月曆點選開始日期與結束日期！'
    return
  }

  if (!closeReason.value.trim()) {
    errorMessage.value = '請填寫關閉理由！'
    return
  }

  isSubmitting.value = true
  try {
    await createAdminBlock({
      roomId: 'villa-full',
      startDate: checkInDate.value,
      endDate: checkOutDate.value,
      summary: closeReason.value.trim()
    })

    statusMessage.value = `成功關閉【${checkInDate.value} 至 ${checkOutDate.value}】月曆！前台已即刻反灰。`
    handleClearAll()
    await fetchRanges()
  } catch (err) {
    errorMessage.value = err.message || '關閉月曆失敗'
  } finally {
    isSubmitting.value = false
  }
}

// 點擊解鎖手動關閉檔期
const handleUnlockBlock = async (block) => {
  const blockId = block.id || block.uid
  const s = block.startDate || block.start_date
  const e = block.endDate || block.end_date
  
  if (!confirm(`確定要解除【${s} 至 ${e}】的關閉狀態嗎？解除後前台將重新開放預訂。`)) {
    return
  }

  try {
    await deleteAdminBlock(blockId)
    statusMessage.value = `已成功解除【${s} 至 ${e}】之鎖定，前台月曆已重新開放！`
    await fetchRanges()
  } catch (err) {
    alert('解除失敗: ' + err.message)
  }
}

const manualClosedRanges = computed(() => {
  return bookedRanges.value.filter(r => r.source === 'MANUAL_LOCK')
})

const {
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  paginatedItems,
  startIndex,
  endIndex
} = usePagination(manualClosedRanges, 10)
</script>

<template>
  <div class="admin-close-calendar-view">
    <!-- 頂部標頭 -->
    <div class="view-header">
      <div>
        <h1 class="view-title">自主關閉月曆管理</h1>
        <p class="view-desc">與前台完全相同的互動模式：直接點選月曆選擇開始日與結束日，輸入自訂理由即可立即關閉檔期</p>
      </div>

      <button class="btn-refresh" @click="fetchRanges" :disabled="isLoading">
        <RefreshCw :size="14" :class="{ 'spin-anim': isLoading }" />
        <span>重新整理檔期</span>
      </button>
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

    <!-- 月曆選取與關閉操作主控區 -->
    <div class="calendar-workspace">
      <!-- 雙月份月曆 (如同前台直接點選) -->
      <div class="calendar-main-col">
        <div class="two-months-grid">
          <AdminMonthView
            v-for="(m, mIdx) in displayedMonths"
            :key="m.key"
            :month-data="m"
            :month-index="mIdx"
            :total-months="displayedMonths.length"
            :is-prev-disabled="isPrevDisabled"
            :check-in-date="checkInDate"
            :check-out-date="checkOutDate"
            :is-check-out-selectable="isCheckOutSelectable"
            @select-date="handleSelectDate"
            @prev-month="prevMonth"
            @next-month="nextMonth"
            @unlock-block="handleUnlockBlock"
          />
        </div>
      </div>

      <!-- 右側：使用者自填理由與確認關閉卡片 -->
      <div class="control-panel-col">
        <AdminCloseActionPanel
          v-model="closeReason"
          :check-in-date="checkInDate"
          :check-out-date="checkOutDate"
          :selected-nights="selectedNights"
          :is-submitting="isSubmitting"
          @confirm="handleConfirmClose"
          @clear="handleClearAll"
        />
      </div>
    </div>

    <!-- 下方：目前已手動關閉清單 -->
    <div class="table-container">
      <div class="table-bar">
        <div class="bar-title">
          <Lock :size="17" class="text-gold" />
          <span>目前已手動關閉之月曆檔期 (共 {{ manualClosedRanges.length }} 筆)</span>
        </div>
      </div>

      <table class="admin-table">
        <thead>
          <tr>
            <th>關閉起始日</th>
            <th>關閉結束日</th>
            <th>晚數</th>
            <th>自訂關閉理由說明</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="manualClosedRanges.length === 0">
            <td colspan="5" class="text-center py-4 text-muted">目前沒有任何手動關閉的月曆檔期，前台全部開放預訂</td>
          </tr>
          <tr v-for="item in paginatedItems" :key="item.id || item.uid">
            <td class="font-mono text-gold-light">{{ item.startDate || item.start_date }}</td>
            <td class="font-mono text-gold-light">{{ item.endDate || item.end_date }}</td>
            <td>
              {{ Math.max(1, Math.round((new Date(item.endDate || item.end_date) - new Date(item.startDate || item.start_date)) / (1000 * 60 * 60 * 24))) }} 晚
            </td>
            <td class="text-muted">{{ item.summary || '手動保留' }}</td>
            <td>
              <button class="btn-delete" @click="handleUnlockBlock(item)" title="解除關閉重新開放">
                <Trash2 :size="14" />
                <span>解除關閉 (開放)</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <Pagination
        v-model:current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalItems"
        :page-size="pageSize"
        :start-index="startIndex"
        :end-index="endIndex"
      />
    </div>
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
    &:hover {
      border-color: var(--gold-primary, #C5A880);
      color: var(--gold-dark, #91754F);
    }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }
}

.alert-box {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  &.alert-success {
    background: rgba(34, 197, 94, 0.12);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #16a34a;
    font-weight: 500;
  }
  &.alert-error {
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #dc2626;
    font-weight: 500;
  }
}

.calendar-workspace {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.5rem;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.two-months-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.25rem;
}

.table-container {
  background: var(--admin-bg-card, #FFFFFF);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.28));
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);

  .table-bar {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--admin-border, rgba(197, 168, 128, 0.2));
    .bar-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: var(--admin-text-main, #1A1E1F);
      font-size: 0.95rem;
    }
  }

  .admin-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;

    th {
      text-align: left;
      padding: 0.75rem 1.25rem;
      color: var(--admin-text-sub, #475569);
      background: var(--admin-th-bg, #EAE6DC);
      font-weight: 600;
      border-bottom: 1px solid var(--admin-border, rgba(197, 168, 128, 0.2));
    }

    td {
      padding: 0.85rem 1.25rem;
      color: var(--admin-text-main, #1A1E1F);
      border-bottom: 1px solid var(--admin-border-subtle, rgba(0, 0, 0, 0.06));
    }
  }

  .btn-delete {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.65rem;
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.28);
    color: #dc2626;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      background: #dc2626;
      color: #fff;
    }
  }
}

.text-gold { color: var(--gold-dark, #91754F); }
.text-gold-light { color: var(--gold-dark, #91754F); font-weight: 600; }
.text-muted { color: var(--admin-text-muted, #64748b); }
.text-center { text-align: center; }
.py-4 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.font-mono { font-family: monospace; }
</style>
