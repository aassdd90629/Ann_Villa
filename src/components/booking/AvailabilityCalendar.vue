<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useBookingPricing } from '../../composables/useBookingPricing'
import { getBookedRanges } from '../../services/availabilityService'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Info 
} from 'lucide-vue-next'
import BookingSummarySidebar from './BookingSummarySidebar.vue'
import DirectBookingModal from './DirectBookingModal.vue'

const { isEn, t } = useI18n()

// 民宿當前時間（以本地時間為準）
const now = new Date()
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
today.setHours(0, 0, 0, 0)

// 預設明天（含）之後的日期才可以開始預訂
const minBookingDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
minBookingDate.setHours(0, 0, 0, 0)

// 日曆狀態：預設開啟當下月份
const currentDate = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const checkInDate = ref(null) // 'YYYY-MM-DD'
const checkOutDate = ref(null) // 'YYYY-MM-DD'
const guestCount = ref(18)
const bookedRanges = ref([])
const isSyncing = ref(false)

// 價格與試算 Composable
const { getHolidayForDate, bookingCalculation, lineBookingUrl } = useBookingPricing(checkInDate, checkOutDate, guestCount)

// 線上預約填單 Modal 狀態
const isModalOpen = ref(false)

const refreshAvailability = async () => {
  isSyncing.value = true
  try {
    bookedRanges.value = await getBookedRanges()
  } catch (err) {
    console.error('更新房態失敗:', err)
  } finally {
    setTimeout(() => { isSyncing.value = false }, 400)
  }
}

onMounted(() => {
  refreshAvailability()
})

const openBookingModal = () => {
  if (!checkInDate.value || !checkOutDate.value) {
    alert(isEn.value ? 'Please select both Check-in and Check-out dates on the calendar first.' : '請先於日曆上挑選【入住日期】與【退房日期】。')
    return
  }
  isModalOpen.value = true
}

const handleBookingSuccess = () => {
  // 下單成功後重置選取日期並刷新檔期
  checkInDate.value = null
  checkOutDate.value = null
  refreshAvailability()
}

const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())

const monthNamesZh = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const weekDaysZh = ['日', '一', '二', '三', '四', '五', '六']
const weekDaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// 判斷是否不可再切換至上個月（不能切換到當前月份以前）
const isPrevDisabled = computed(() => {
  return currentYear.value < today.getFullYear() || 
    (currentYear.value === today.getFullYear() && currentMonth.value <= today.getMonth())
})

// 切換月份
const prevMonth = () => {
  if (isPrevDisabled.value) return
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}

function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isDatePast(d) {
  return d < minBookingDate
}

function isDateBooked(dateStr) {
  if (!bookedRanges.value || !bookedRanges.value.length) return false
  return bookedRanges.value.some(range => {
    return dateStr >= range.startDate && dateStr < range.endDate
  })
}

// 取得某日期的預約來源
function getBookingSource(dateStr) {
  if (!bookedRanges.value || !bookedRanges.value.length) return ''
  const found = bookedRanges.value.find(range => dateStr >= range.startDate && dateStr < range.endDate)
  return found ? found.source : ''
}

// 產生當月日曆網格
const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  
  const firstDayIndex = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()
  
  const days = []
  
  // 上個月的補白
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i
    const d = new Date(year, month - 1, dayNum)
    const dateStr = formatDate(d)
    days.push({
      dateStr,
      dayNum,
      isCurrentMonth: false,
      isBooked: isDateBooked(dateStr),
      isPast: isDatePast(d),
      holiday: getHolidayForDate(dateStr)
    })
  }
  
  // 當月天數
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i)
    const dateStr = formatDate(d)
    days.push({
      dateStr,
      dayNum: i,
      isCurrentMonth: true,
      isBooked: isDateBooked(dateStr),
      isPast: isDatePast(d),
      holiday: getHolidayForDate(dateStr)
    })
  }
  
  // 下個月的補白 (湊滿 35 或 42 格)
  const remaining = (7 - (days.length % 7)) % 7
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    const dateStr = formatDate(d)
    days.push({
      dateStr,
      dayNum: i,
      isCurrentMonth: false,
      isBooked: isDateBooked(dateStr),
      isPast: isDatePast(d),
      holiday: getHolidayForDate(dateStr)
    })
  }
  
  return days
})

// 檢查某日期是否可作為目前選取的退房日（若當天是下一筆訂單的 Check-in 日，允許前一位於 11:00 前退房）
function isCheckOutSelectable(dateStr) {
  if (!checkInDate.value || checkOutDate.value) return false
  if (dateStr <= checkInDate.value) return false
  let curr = new Date(checkInDate.value)
  const target = new Date(dateStr)
  while (curr < target) {
    const checkStr = formatDate(curr)
    if (isDateBooked(checkStr)) return false
    curr.setDate(curr.getDate() + 1)
  }
  return true
}

// 點擊日期
const selectDate = (day) => {
  if (day.isPast) return
  if (day.isBooked && !isCheckOutSelectable(day.dateStr)) return
  
  if (!checkInDate.value || (checkInDate.value && checkOutDate.value)) {
    checkInDate.value = day.dateStr
    checkOutDate.value = null
  } else if (checkInDate.value && !checkOutDate.value) {
    if (day.dateStr <= checkInDate.value) {
      checkInDate.value = day.dateStr
    } else {
      // 檢查中間是否有被預訂的日期
      let hasOverlap = false
      let curr = new Date(checkInDate.value)
      const target = new Date(day.dateStr)
      while (curr < target) {
        curr.setDate(curr.getDate() + 1)
        const checkStr = formatDate(curr)
        if (checkStr < day.dateStr && isDateBooked(checkStr)) {
          hasOverlap = true
          break
        }
      }
      
      if (hasOverlap) {
        // 重置為新的 Check-in
        checkInDate.value = day.dateStr
      } else {
        checkOutDate.value = day.dateStr
      }
    }
  }
}

const isSelected = (dateStr) => {
  return dateStr === checkInDate.value || dateStr === checkOutDate.value
}

const isInRange = (dateStr) => {
  if (!checkInDate.value || !checkOutDate.value) return false
  return dateStr > checkInDate.value && dateStr < checkOutDate.value
}
</script>

<template>
  <div class="availability-calendar-card card-luxury">
    <!-- 頂部檔期說明列與即時同步按鈕 -->
    <div class="sync-banner">
      <div class="sync-status">
        <span class="demo-badge-tag">⚠️ 展示預覽環境</span>
        <Info :size="15" class="info-icon" />
        <span class="sync-text">{{ isEn ? t('calendar.syncNotice') : '房態由 Cloudflare D1 邊緣資料庫與 Airbnb 即時同步反灰' }}</span>
      </div>
      <button 
        type="button"
        class="btn-refresh-sync" 
        :class="{ 'is-spinning': isSyncing }" 
        @click="refreshAvailability" 
        :title="isEn ? 'Refresh Live Availability' : '重新整理即時房態'"
      >
        <RefreshCw :size="14" />
        <span>{{ isSyncing ? (isEn ? 'Updating...' : '更新中...') : (isEn ? 'Live Sync' : '即時同步') }}</span>
      </button>
    </div>

    <div class="calendar-layout-grid">
      <!-- 左側：月曆主體 -->
      <div class="calendar-main-col">
        <div class="calendar-header-bar">
          <div class="month-title">
            <CalendarIcon :size="20" class="cal-icon" />
            <h3>
              {{ isEn ? `${monthNamesEn[currentMonth]} ${currentYear}` : `${currentYear} 年 ${monthNamesZh[currentMonth]}` }}
            </h3>
          </div>
          <div class="nav-btn-group">
            <button 
              type="button"
              class="nav-btn" 
              :disabled="isPrevDisabled" 
              @click="prevMonth" 
              :aria-label="isEn ? 'Previous month' : '上一月'"
            >
              <ChevronLeft :size="18" />
            </button>
            <button 
              type="button"
              class="nav-btn" 
              @click="nextMonth" 
              :aria-label="isEn ? 'Next month' : '下一月'"
            >
              <ChevronRight :size="18" />
            </button>
          </div>
        </div>

        <!-- 星期標題 -->
        <div class="weekdays-row">
          <span v-for="(day, idx) in (isEn ? weekDaysEn : weekDaysZh)" :key="idx" class="weekday-cell">
            {{ day }}
          </span>
        </div>

        <!-- 日曆網格 -->
        <div class="days-grid">
          <button
            v-for="day in calendarDays"
            :key="day.dateStr"
            type="button"
            class="day-cell"
            :class="{
              'other-month': !day.isCurrentMonth,
              'is-past': day.isPast,
              'is-booked': day.isBooked,
              'is-selected': isSelected(day.dateStr),
              'is-in-range': isInRange(day.dateStr),
              'is-check-in': day.dateStr === checkInDate,
              'is-check-out': day.dateStr === checkOutDate
            }"
            :disabled="day.isPast || (day.isBooked && !isCheckOutSelectable(day.dateStr))"
            @click="selectDate(day)"
            :title="day.isBooked ? `${day.dateStr} (${getBookingSource(day.dateStr)} 已預約)` : (day.holiday ? `${day.dateStr} 【${isEn ? day.holiday.nameEn : day.holiday.nameZh} NT$ ${day.holiday.price.toLocaleString()}` + (day.holiday.breakfast ? ' 含早餐' : ' 不含早餐') + '】' : day.dateStr)"
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
          </button>
        </div>

        <!-- 圖例說明 (Legend) -->
        <div class="calendar-legend">
          <div class="legend-item">
            <span class="legend-dot available"></span>
            <span>{{ t('calendar.available') }}</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot booked"></span>
            <span>{{ t('calendar.booked') }}</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot selected"></span>
            <span>{{ t('calendar.selected') }}</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot holiday"></span>
            <span>{{ isEn ? 'Consecutive Holiday Rate' : '國定連續假期專案價' }}</span>
          </div>
        </div>
      </div>

      <!-- 右側：日期試算與直訂優惠側欄 (獨立組件) -->
      <BookingSummarySidebar
        :check-in-date="checkInDate"
        :check-out-date="checkOutDate"
        :guest-count="guestCount"
        :calculation="bookingCalculation"
        :line-booking-url="lineBookingUrl"
        @update:guest-count="guestCount = $event"
        @open-booking="openBookingModal"
      />
    </div>

    <!-- 線上直訂預約彈窗 (獨立組件) -->
    <DirectBookingModal
      v-model="isModalOpen"
      :check-in-date="checkInDate"
      :check-out-date="checkOutDate"
      :guest-count="guestCount"
      :calculation="bookingCalculation"
      @booking-success="handleBookingSuccess"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.availability-calendar-card {
  padding: 1.75rem 1.25rem;
  margin: 3rem 0;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  border-radius: 6px;
  box-shadow: var(--shadow-card);

  @media (min-width: $bp-md) {
    padding: 2.5rem;
  }
}

// 頂部同步狀態列
.sync-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-bottom: 1.5rem;
  margin-bottom: 1.75rem;
  border-bottom: 1px solid var(--border-color);

  .sync-status {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;

    .demo-badge-tag {
      font-size: 0.72rem;
      padding: 0.2rem 0.5rem;
      background: rgba(212, 175, 55, 0.15);
      border: 1px solid rgba(212, 175, 55, 0.35);
      color: var(--gold-primary);
      border-radius: 4px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .info-icon {
      color: var(--gold-primary);
      flex-shrink: 0;
    }

    .sync-text {
      font-size: 0.85rem;
      color: var(--text-sub);
      font-weight: 500;
    }
  }
}

.btn-refresh-sync {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-sub);
  padding: 0.25rem 0.65rem;
  font-size: 0.78rem;
  border-radius: 4px;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    border-color: var(--gold-primary);
    color: var(--gold-primary);
  }

  &.is-spinning svg {
    animation: spin 1s linear infinite;
  }
}

// 網格佈局
.calendar-layout-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;

  @media (min-width: $bp-lg) {
    grid-template-columns: 1.15fr 1fr;
    gap: 3rem;
  }
}

// 左側日曆
.calendar-main-col {
  display: flex;
  flex-direction: column;
}

.calendar-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;

  .month-title {
    display: flex;
    align-items: center;
    gap: 0.6rem;

    .cal-icon {
      color: var(--gold-primary);
    }

    h3 {
      font-size: 1.25rem;
      margin: 0;
      letter-spacing: 0.05em;
    }
  }

  .nav-btn-group {
    display: flex;
    gap: 0.5rem;

    .nav-btn {
      width: 34px;
      height: 34px;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      background: var(--bg-primary);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: $transition-base;

      &:hover {
        border-color: var(--gold-primary);
        color: var(--gold-primary);
        background: var(--bg-card);
      }

      &:disabled {
        opacity: 0.35;
        cursor: not-allowed;
        pointer-events: none;
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
  margin-bottom: 1.5rem;
}

.day-cell {
  position: relative;
  height: 52px;
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

  .day-number {
    font-family: $font-display;
    font-size: 1rem;
    font-weight: 600;
  }

  .cell-tag {
    font-size: 0.65rem;
    line-height: 1;
    margin-top: 2px;
    padding: 1px 4px;
    border-radius: 2px;

    &.holiday-tag {
      background: var(--badge-bg);
      color: var(--gold-primary);
      font-weight: 500;
    }
  }

  &:hover:not(:disabled) {
    border-color: var(--gold-primary);
    background: var(--bg-card);
    transform: translateY(-1px);
  }

  &.other-month {
    opacity: 0.35;
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

.calendar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--border-color);

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.78rem;
    color: var(--text-sub);

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 2px;

      &.available {
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
      }
      &.booked {
        background: var(--border-color);
      }
      &.selected {
        background: var(--gold-primary);
      }
      &.holiday {
        background: var(--badge-bg);
        border: 1px solid var(--gold-primary);
      }
    }
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
