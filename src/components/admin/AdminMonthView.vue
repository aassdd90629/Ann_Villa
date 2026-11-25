<script setup>
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  monthData: {
    type: Object,
    required: true
  },
  monthIndex: {
    type: Number,
    default: 0
  },
  totalMonths: {
    type: Number,
    default: 2
  },
  isPrevDisabled: {
    type: Boolean,
    default: false
  },
  selectedDates: {
    type: Array,
    default: () => []
  },
  selectionMode: {
    type: String,
    default: 'individual'
  },
  rangeStart: {
    type: String,
    default: null
  },
  hoverDate: {
    type: String,
    default: null
  }
})

const emit = defineEmits([
  'select-date',
  'hover-date',
  'clear-hover',
  'prev-month',
  'next-month',
  'unlock-block',
  'open-booking'
])

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const isSelected = (dateStr) => {
  return props.selectedDates && props.selectedDates.includes(dateStr)
}

const isInRangePreview = (dateStr) => {
  if (props.selectionMode !== 'range' || !props.rangeStart || !props.hoverDate) return false
  const [s, e] = props.rangeStart <= props.hoverDate 
    ? [props.rangeStart, props.hoverDate] 
    : [props.hoverDate, props.rangeStart]
  return dateStr >= s && dateStr <= e
}

const getCellTitle = (day) => {
  if (day.isManualLock) {
    const reason = day.blockInfo?.summary ? `（理由：${day.blockInfo.summary}）` : ''
    return `${day.dateStr} 【已自主關閉${reason}】點擊可解除`
  }
  if (day.isDirectBooking || day.isBooked) {
    if (day.isDepositPaid) {
      return `${day.dateStr} 【已收定金・正式鎖房】點擊查看、修改或取消`
    }
    if (day.isVerifyingPayment) {
      return `${day.dateStr} 【待對帳・已報末五碼 ${day.bankLast5}】點擊查看與核銷`
    }
    return `${day.dateStr} 【待付定金・24h 保留中】點擊查看、修改或取消`
  }
  if (props.rangeStart === day.dateStr) {
    return `${day.dateStr} 【區間起始日】請點選結束日`
  }
  return isSelected(day.dateStr)
    ? `${day.dateStr} 【已選取】點擊可取消選取`
    : `${day.dateStr} (點擊選取加入關閉清單)`
}

const handleDayClick = (day, event) => {
  if (day.isEmpty || day.isPast) return
  if (day.isManualLock) {
    emit('unlock-block', day.blockInfo)
    return
  }
  if (day.isBooked) {
    emit('open-booking', day.blockInfo)
    return
  }
  emit('select-date', day, event?.shiftKey)
}
</script>

<template>
  <div class="month-panel" @mouseleave="emit('clear-hover')">
    <!-- 各月份標題列 -->
    <div class="month-panel-header">
      <button 
        v-if="monthIndex === 0"
        type="button"
        class="nav-btn prev-btn" 
        :disabled="isPrevDisabled" 
        @click="emit('prev-month')" 
        title="上一月"
      >
        <ChevronLeft :size="18" />
      </button>
      <span v-else class="header-placeholder desktop-only"></span>

      <h3 class="month-panel-title">
        {{ monthData.year }} 年 {{ monthData.month + 1 }} 月
      </h3>

      <button 
        v-if="monthIndex === totalMonths - 1"
        type="button"
        class="nav-btn next-btn" 
        @click="emit('next-month')" 
        title="下一月"
      >
        <ChevronRight :size="18" />
      </button>
      <span v-else class="header-placeholder desktop-only"></span>
    </div>


    <!-- 星期標題 -->
    <div class="weekdays-row">
      <span v-for="(day, idx) in weekDays" :key="idx" class="weekday-cell" :class="{ weekend: idx === 0 || idx === 6 }">
        {{ day }}
      </span>
    </div>

    <!-- 日曆網格 -->
    <div class="days-grid">
      <template v-for="day in monthData.days" :key="day.dateStr">
        <div v-if="day.isEmpty" class="day-cell is-empty" aria-hidden="true"></div>
        <button
          v-else
          type="button"
          class="day-cell"
          :class="{
            'is-past': day.isPast,
            'is-manual-lock': day.isManualLock,
            'is-deposit-paid': day.isDepositPaid,
            'is-verifying': day.isVerifyingPayment,
            'is-deposit-unpaid': day.isDepositUnpaid,
            'is-booked': (day.isDirectBooking || day.isBooked) && !day.isDepositPaid && !day.isVerifyingPayment && !day.isDepositUnpaid,
            'is-selected': isSelected(day.dateStr),
            'is-range-start': rangeStart === day.dateStr,
            'is-range-preview': isInRangePreview(day.dateStr) && !isSelected(day.dateStr)
          }"
          :disabled="day.isPast"
          @click="handleDayClick(day, $event)"
          @mouseenter="emit('hover-date', day.dateStr)"
          :title="getCellTitle(day)"
        >
          <span class="day-number">{{ day.dayNum }}</span>
          <span v-if="day.isManualLock" class="cell-tag manual-tag">
            已關閉
          </span>
          <span v-else-if="day.isDepositPaid" class="cell-tag paid-tag">
            已收定
          </span>
          <span v-else-if="day.isVerifyingPayment" class="cell-tag verifying-tag">
            待對帳
          </span>
          <span v-else-if="day.isDepositUnpaid" class="cell-tag unpaid-tag">
            待付定
          </span>
          <span v-else-if="day.isDirectBooking || day.isBooked" class="cell-tag booked-tag">
            已訂單
          </span>
          <span v-else-if="rangeStart === day.dateStr" class="cell-tag range-tag">
            起始日
          </span>
          <span v-else-if="isSelected(day.dateStr)" class="cell-tag selected-tag">
            已選取
          </span>
          <span v-else-if="isInRangePreview(day.dateStr)" class="cell-tag preview-tag">
            預覽
          </span>
        </button>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.month-panel {
  display: flex;
  flex-direction: column;
  background: var(--admin-bg-card, #FFFFFF);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.28));
  border-radius: 8px;
  padding: 1.1rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.month-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.85rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--admin-border, rgba(197, 168, 128, 0.15));

  .month-panel-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--admin-text-main, #1A1E1F);
    margin: 0;
  }
  .nav-btn {
    background: transparent;
    border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3));
    color: var(--admin-text-main, #1A1E1F);
    width: 28px;
    height: 28px;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    &:hover:not(:disabled) {
      border-color: var(--gold-primary, #C5A880);
      color: var(--gold-dark, #91754F);
      background: var(--admin-bg-base, #F5F3EC);
    }
    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }
  .header-placeholder { width: 28px; height: 28px; }
}


.weekdays-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  color: var(--admin-text-sub, #475569);
  font-weight: 500;
  .weekend { color: var(--gold-dark, #91754F); font-weight: 600; }
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid transparent;
  color: var(--admin-text-main, #1A1E1F);
  transition: all 0.15s ease;
  position: relative;
  user-select: none;

  &.is-empty { background: transparent; cursor: default; border: none; }

  &:hover:not(:disabled):not(.is-empty):not(.is-past) {
    border-color: var(--gold-primary, #C5A880);
    background: rgba(197, 168, 128, 0.12);
  }

  &.is-past {
    color: var(--admin-text-muted, #94a3b8);
    opacity: 0.35;
    background: transparent;
    cursor: not-allowed;
  }

  &.is-booked {
    color: #1d4ed8;
    background: rgba(59, 130, 246, 0.08);
    border-color: rgba(59, 130, 246, 0.25);
    cursor: pointer;
    &:hover:not(:disabled) {
      border-color: rgba(59, 130, 246, 0.6);
      background: rgba(59, 130, 246, 0.18);
    }
  }

  &.is-deposit-paid {
    color: #15803d;
    background: rgba(34, 197, 94, 0.12);
    border-color: rgba(34, 197, 94, 0.35);
    cursor: pointer;
    &:hover:not(:disabled) {
      border-color: rgba(34, 197, 94, 0.6);
      background: rgba(34, 197, 94, 0.22);
    }
  }

  &.is-verifying {
    color: #0284c7;
    background: rgba(14, 165, 233, 0.12);
    border-color: rgba(14, 165, 233, 0.35);
    cursor: pointer;
    &:hover:not(:disabled) {
      border-color: rgba(14, 165, 233, 0.6);
      background: rgba(14, 165, 233, 0.22);
    }
  }

  &.is-deposit-unpaid {
    color: #b45309;
    background: rgba(245, 158, 11, 0.12);
    border-color: rgba(245, 158, 11, 0.35);
    cursor: pointer;
    &:hover:not(:disabled) {
      border-color: rgba(245, 158, 11, 0.6);
      background: rgba(245, 158, 11, 0.22);
    }
  }

  &.is-manual-lock {
    color: #dc2626;
    background: rgba(239, 68, 68, 0.12);
    border-color: rgba(239, 68, 68, 0.35);
    cursor: pointer;
    &:hover {
      background: rgba(239, 68, 68, 0.22);
      border-color: rgba(239, 68, 68, 0.5);
    }
  }

  &.is-range-preview {
    background: rgba(197, 168, 128, 0.22) !important;
    border-color: var(--gold-primary, #C5A880) !important;
  }

  &.is-range-start {
    border-color: var(--gold-dark, #91754F) !important;
    box-shadow: 0 0 0 2px var(--gold-primary, #C5A880);
  }

  &.is-selected {
    background: var(--gold-primary, #C5A880) !important;
    color: #121415 !important;
    font-weight: 700;
    border-radius: 6px;
    box-shadow: 0 0 0 2px var(--gold-dark, #91754F);
  }

  .day-number { line-height: 1; }

  .cell-tag {
    font-size: 0.6rem;
    margin-top: 2px;
    padding: 1px 3px;
    border-radius: 2px;
    line-height: 1;

    &.manual-tag { background: rgba(239, 68, 68, 0.2); color: #dc2626; font-weight: 600; }
    &.paid-tag { background: rgba(34, 197, 94, 0.2); color: #15803d; font-weight: 700; }
    &.verifying-tag { background: rgba(14, 165, 233, 0.2); color: #0284c7; font-weight: 700; }
    &.unpaid-tag { background: rgba(245, 158, 11, 0.2); color: #b45309; font-weight: 700; }
    &.booked-tag { background: rgba(37, 99, 235, 0.15); color: #1d4ed8; font-weight: 600; }
    &.selected-tag { background: rgba(0, 0, 0, 0.25); color: #121415; font-weight: 700; }
    &.range-tag { background: var(--gold-dark, #91754F); color: #FFFFFF; font-weight: 700; }
    &.preview-tag { background: rgba(197, 168, 128, 0.4); color: var(--gold-dark, #91754F); font-weight: 600; }
  }
}
</style>