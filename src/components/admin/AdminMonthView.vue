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
  checkInDate: {
    type: String,
    default: null
  },
  checkOutDate: {
    type: String,
    default: null
  },
  isCheckOutSelectable: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['select-date', 'prev-month', 'next-month', 'unlock-block'])

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const isSelected = (dateStr) => {
  return dateStr === props.checkInDate || dateStr === props.checkOutDate
}

const isInRange = (dateStr) => {
  if (!props.checkInDate || !props.checkOutDate) return false
  return dateStr > props.checkInDate && dateStr < props.checkOutDate
}

const handleDayClick = (day) => {
  if (day.isEmpty || day.isPast) return
  if (day.isManualLock) {
    emit('unlock-block', day.blockInfo)
    return
  }
  emit('select-date', day)
}
</script>

<template>
  <div class="month-panel">
    <!-- 各月份標題列 (如同前台與 Airbnb 左側 < 、右側 >) -->
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
            'is-booked': day.isBooked && !day.isManualLock,
            'is-manual-lock': day.isManualLock,
            'is-selected': isSelected(day.dateStr),
            'is-in-range': isInRange(day.dateStr),
            'is-check-in': day.dateStr === checkInDate,
            'is-check-out': day.dateStr === checkOutDate
          }"
          :disabled="day.isPast || (day.isBooked && !day.isManualLock && !isCheckOutSelectable(day.dateStr))"
          @click="handleDayClick(day)"
          :title="day.isManualLock ? `${day.dateStr} 【已手動關閉: ${day.blockInfo?.summary || '鎖房'}】點擊可解除` : (day.isBooked ? `${day.dateStr} 【官網直訂單】` : `${day.dateStr} (點擊選擇)`)"
        >
          <span class="day-number">{{ day.dayNum }}</span>
          <span v-if="day.isManualLock" class="cell-tag manual-tag">
            已關閉
          </span>
          <span v-else-if="day.isBooked" class="cell-tag booked-tag">
            已訂單
          </span>
          <span v-else-if="day.dateStr === checkInDate" class="cell-tag in-tag">
            開始
          </span>
          <span v-else-if="day.dateStr === checkOutDate" class="cell-tag out-tag">
            結束
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
  padding: 1.25rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.month-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.2rem;
  height: 36px;

  .month-panel-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--admin-text-main, #1A1E1F);
    margin: 0;
    letter-spacing: 0.5px;
  }

  .nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--admin-bg-base, #F5F3EC);
    border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3));
    border-radius: 6px;
    color: var(--admin-text-main, #1A1E1F);
    cursor: pointer;
    transition: all 0.2s;
    &:hover:not(:disabled) {
      border-color: var(--gold-primary, #C5A880);
      color: var(--gold-dark, #91754F);
    }
    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }

  .header-placeholder {
    width: 32px;
  }
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

  &.is-empty {
    background: transparent;
    cursor: default;
    border: none;
  }

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
    cursor: not-allowed;
  }

  &.is-manual-lock {
    color: #dc2626;
    background: rgba(239, 68, 68, 0.12);
    border-color: rgba(239, 68, 68, 0.35);
    cursor: pointer;
    &:hover {
      background: rgba(239, 68, 68, 0.25);
      transform: scale(1.04);
    }
  }

  &.is-in-range {
    background: rgba(197, 168, 128, 0.25) !important;
    color: var(--gold-dark, #91754F) !important;
    font-weight: 600;
    border-radius: 0;
  }

  &.is-check-in {
    background: var(--gold-primary, #C5A880) !important;
    color: #121415 !important;
    font-weight: 700;
    border-top-left-radius: 6px;
    border-bottom-left-radius: 6px;
  }

  &.is-check-out {
    background: var(--gold-primary, #C5A880) !important;
    color: #121415 !important;
    font-weight: 700;
    border-top-right-radius: 6px;
    border-bottom-right-radius: 6px;
  }

  .day-number {
    line-height: 1;
  }

  .cell-tag {
    font-size: 0.6rem;
    margin-top: 2px;
    padding: 1px 3px;
    border-radius: 2px;
    line-height: 1;

    &.manual-tag {
      background: rgba(239, 68, 68, 0.2);
      color: #dc2626;
      font-weight: 600;
    }
    &.booked-tag {
      background: rgba(37, 99, 235, 0.15);
      color: #1d4ed8;
      font-weight: 600;
    }
    &.in-tag,
    &.out-tag {
      background: rgba(0, 0, 0, 0.25);
      color: #121415;
      font-weight: 600;
    }
  }
}
</style>
