<script setup>
import { useI18n } from '../../composables/useI18n'
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

const emit = defineEmits(['select-date', 'prev-month', 'next-month'])

const { isEn } = useI18n()

const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const weekDaysZh = ['日', '一', '二', '三', '四', '五', '六']
const weekDaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const isSelected = (dateStr) => {
  return dateStr === props.checkInDate || dateStr === props.checkOutDate
}

const isInRange = (dateStr) => {
  if (!props.checkInDate || !props.checkOutDate) return false
  return dateStr > props.checkInDate && dateStr < props.checkOutDate
}
</script>

<template>
  <div class="month-panel">
    <!-- 各月份標題列 (如同 Airbnb 左側 < 、右側 >) -->
    <div class="month-panel-header">
      <button 
        v-if="monthIndex === 0"
        type="button"
        class="nav-btn prev-btn" 
        :disabled="isPrevDisabled" 
        @click="emit('prev-month')" 
        :aria-label="isEn ? 'Previous month' : '上一月'"
      >
        <ChevronLeft :size="18" />
      </button>
      <span v-else class="header-placeholder desktop-only"></span>

      <h3 class="month-panel-title">
        {{ isEn ? `${monthNamesEn[monthData.month]} ${monthData.year}` : `${monthData.year} 年 ${monthData.month + 1} 月` }}
      </h3>

      <button 
        v-if="monthIndex === totalMonths - 1"
        type="button"
        class="nav-btn next-btn" 
        @click="emit('next-month')" 
        :aria-label="isEn ? 'Next month' : '下一月'"
      >
        <ChevronRight :size="18" />
      </button>
      <button
        v-else-if="monthIndex === 0"
        type="button"
        class="nav-btn next-btn mobile-only-btn"
        @click="emit('next-month')"
        :aria-label="isEn ? 'Next month' : '下一月'"
      >
        <ChevronRight :size="18" />
      </button>
      <span v-else class="header-placeholder desktop-only"></span>
    </div>

    <!-- 星期標題 -->
    <div class="weekdays-row">
      <span v-for="(day, idx) in (isEn ? weekDaysEn : weekDaysZh)" :key="idx" class="weekday-cell">
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
            'is-booked': day.isBooked,
            'is-selected': isSelected(day.dateStr),
            'is-in-range': isInRange(day.dateStr),
            'is-check-in': day.dateStr === checkInDate,
            'is-check-out': day.dateStr === checkOutDate
          }"
          :disabled="day.isPast || (day.isBooked && !isCheckOutSelectable(day.dateStr))"
          @click="emit('select-date', day)"
          :title="day.isBooked ? `${day.dateStr} 【${isEn ? 'Reserved' : '已有旅客預訂'}】` : (day.holiday ? `${day.dateStr} 【${isEn ? day.holiday.nameEn : day.holiday.nameZh} NT$ ${day.holiday.price.toLocaleString()}${day.holiday.breakfast ? ' (含早餐)' : ' (過年不提供早餐)'}】` : (day.isWeekday ? `${day.dateStr} 【平日(含早餐)：10人以下2萬 / 11-14人2.5萬 / 15-18人3萬】` : `${day.dateStr} 【一般假日(週五~日)：NT$ 35,000 含早餐】`))"
        >
          <span class="day-number">{{ day.dayNum }}</span>
          <span v-if="day.isBooked" class="cell-tag booked-tag">
            {{ isEn ? 'Booked' : '已訂' }}
          </span>
          <span v-else-if="day.dateStr === checkInDate" class="cell-tag in-tag">
            {{ isEn ? 'In' : '入住' }}
          </span>
          <span v-else-if="day.dateStr === checkOutDate" class="cell-tag out-tag">
            {{ isEn ? 'Out' : '退房' }}
          </span>
          <span v-else-if="day.holiday && !day.isPast" class="cell-tag holiday-tag">
            {{ isEn ? 'Holiday' : '連假' }}
          </span>
          <span v-else-if="day.isWeekday && !day.isPast" class="cell-tag weekday-tag">
            {{ isEn ? '20k+' : '平日特惠' }}
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
}

.month-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  margin-bottom: 1.25rem;

  .month-panel-title {
    font-size: 1.15rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary);
    letter-spacing: 0.05em;
    text-align: center;
    flex: 1;
  }

  .nav-btn {
    width: 34px;
    height: 34px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    color: var(--text-primary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: $transition-base;
    flex-shrink: 0;

    &:hover:not(:disabled) {
      border-color: var(--gold-primary);
      color: var(--gold-primary);
      background: var(--bg-card);
    }

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      pointer-events: none;
    }

    &.mobile-only-btn {
      display: none;
      @media (max-width: 767px) {
        display: inline-flex;
      }
    }
  }

  .header-placeholder {
    width: 34px;
    height: 34px;
    visibility: hidden;
    flex-shrink: 0;

    &.desktop-only {
      display: none;
      @media (min-width: 768px) {
        display: inline-block;
      }
    }
  }
}

.weekdays-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 0.75rem;

  .weekday-cell {
    font-size: 0.8rem;
    color: var(--text-muted);
    font-weight: 600;
    text-transform: uppercase;
  }
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 0.75rem;
}

.day-cell {
  position: relative;
  height: 48px;
  background: var(--bg-primary);
  border: 1px solid transparent;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: $transition-base;
  color: var(--text-primary);

  &.is-empty {
    background: transparent !important;
    border-color: transparent !important;
    box-shadow: none !important;
    cursor: default !important;
    pointer-events: none !important;
  }

  .day-number {
    font-family: $font-display;
    font-size: 0.95rem;
    font-weight: 600;
  }

  .cell-tag {
    font-size: 0.62rem;
    line-height: 1;
    margin-top: 2px;
    padding: 1px 3px;
    border-radius: 2px;

    &.holiday-tag {
      background: var(--badge-bg);
      color: var(--gold-primary);
      font-weight: 500;
    }

    &.weekday-tag {
      background: rgba(200, 169, 110, 0.12);
      color: var(--gold-primary);
      font-weight: 600;
      border: 1px solid rgba(200, 169, 110, 0.28);
    }
  }

  &:hover:not(:disabled) {
    border-color: var(--gold-primary);
    background: var(--bg-card);
    transform: translateY(-1px);
  }

  &.is-past {
    opacity: 0.25;
    cursor: not-allowed;
    background: transparent;
  }

  &.is-booked {
    background: var(--border-color);
    color: var(--text-muted);
    cursor: not-allowed;
    text-decoration: line-through;

    .booked-tag {
      text-decoration: none;
      background: var(--bg-primary);
      color: var(--text-muted);
    }
  }

  &.is-selected {
    background: var(--gold-primary) !important;
    color: #FFFFFF !important;
    border-color: var(--gold-primary);
    box-shadow: 0 4px 12px var(--badge-bg);

    .cell-tag {
      background: rgba(0, 0, 0, 0.25);
      color: #FFFFFF;
    }
  }

  &.is-in-range {
    background: var(--badge-bg) !important;
    border-color: var(--gold-light);
    color: var(--gold-dark);
  }
}
</style>
