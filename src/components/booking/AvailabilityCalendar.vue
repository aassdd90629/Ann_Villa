<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useBookingPricing, fetchPricingSettings } from '../../composables/useBookingPricing'
import { getBookedRanges } from '../../services/availabilityService'
import BookingSummarySidebar from './BookingSummarySidebar.vue'
import DirectBookingModal from './DirectBookingModal.vue'
import PricingOverviewSection from './PricingOverviewSection.vue'
import CalendarMonthView from './CalendarMonthView.vue'
import BookingPerksNotice from './BookingPerksNotice.vue'

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
const { getHolidayForDate, isWeekdayDate, bookingCalculation, lineBookingUrl } = useBookingPricing(checkInDate, checkOutDate, guestCount)

// 線上預約填單 Modal 狀態
const isModalOpen = ref(false)

const handleApplyWeekdayTier = (count) => {
  guestCount.value = count
}
const refreshAvailability = async () => {
  isSyncing.value = true
  try {
    bookedRanges.value = await getBookedRanges(true)
  } catch (err) {
    console.error('更新房態失敗:', err)
  } finally {
    setTimeout(() => { isSyncing.value = false }, 400)
  }
}
onMounted(() => {
  refreshAvailability()
  fetchPricingSettings()
})
const openBookingModal = () => {
  if (!checkInDate.value || !checkOutDate.value) {
    alert(isEn.value ? 'Please select both Check-in and Check-out dates on the calendar first.' : '請先於日曆上挑選【入住日期】與【退房日期】。')
    return
  }
  isModalOpen.value = true
}
const handleBookingSuccess = () => {
  checkInDate.value = null
  checkOutDate.value = null
  refreshAvailability()
}

// 判斷是否不可再切換至上個月（不能切換到當前月份以前）
const isPrevDisabled = computed(() => {
  const m1 = currentDate.value
  return m1.getFullYear() < today.getFullYear() || 
    (m1.getFullYear() === today.getFullYear() && m1.getMonth() <= today.getMonth())
})

// 切換月份
const prevMonth = () => {
  if (isPrevDisabled.value) return
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
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
  return bookedRanges.value.some(range => dateStr >= range.startDate && dateStr < range.endDate)
}

// 產生單月日曆網格資料
function generateMonthDays(year, month) {
  const firstDayIndex = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []
  // 空白補位 (只留空，不顯示上個月日期)
  for (let i = 0; i < firstDayIndex; i++) {
    days.push({
      dateStr: `empty-${year}-${month}-${i}`,
      dayNum: '',
      isEmpty: true,
      isBooked: false,
      isPast: true
    })
  }
  // 當月天數
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i)
    const dateStr = formatDate(d)
    days.push({
      dateStr,
      dayNum: i,
      isEmpty: false,
      isBooked: isDateBooked(dateStr),
      isPast: isDatePast(d),
      isWeekday: isWeekdayDate(dateStr),
      holiday: getHolidayForDate(dateStr)
    })
  }
  
  return days
}

// 雙月份呈現資料 (一次呈現兩個月)
const displayedMonths = computed(() => {
  const m1Date = currentDate.value
  const m1Year = m1Date.getFullYear()
  const m1Month = m1Date.getMonth()
  
  const m2Date = new Date(m1Year, m1Month + 1, 1)
  const m2Year = m2Date.getFullYear()
  const m2Month = m2Date.getMonth()
  
  return [
    {
      key: `${m1Year}-${m1Month}`,
      year: m1Year,
      month: m1Month,
      days: generateMonthDays(m1Year, m1Month)
    },
    {
      key: `${m2Year}-${m2Month}`,
      year: m2Year,
      month: m2Month,
      days: generateMonthDays(m2Year, m2Month)
    }
  ]
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
</script>

<template>
  <div class="availability-calendar-card">
    <div class="calendar-layout-grid">
      <!-- 左側：月曆主體 (雙月份呈現) -->
      <div class="calendar-main-col">
        <div class="two-months-grid">
          <CalendarMonthView
            v-for="(m, mIdx) in displayedMonths"
            :key="m.key"
            :month-data="m"
            :month-index="mIdx"
            :total-months="displayedMonths.length"
            :is-prev-disabled="isPrevDisabled"
            :check-in-date="checkInDate"
            :check-out-date="checkOutDate"
            :is-check-out-selectable="isCheckOutSelectable"
            @select-date="selectDate"
            @prev-month="prevMonth"
            @next-month="nextMonth"
          />
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

        <!-- 價格方案總覽 (左下：平日分級、一般假日 35k、國定假日 38k~50k) -->
        <PricingOverviewSection
          :selected-date="checkInDate"
          :check-out-date="checkOutDate"
          :current-guests="guestCount"
          :calculation="bookingCalculation"
          @apply-tier="handleApplyWeekdayTier"
        />
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

    <!-- 底部通欄：官方直訂禮遇與包棟入住叮嚀 (滿版寬度，左右 50%/50% 平均展開) -->
    <BookingPerksNotice />

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
  padding: 1.25rem 1rem;
  margin: 3rem 0;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  border-radius: 6px;
  box-shadow: var(--shadow-card);
  transition: none !important;

  &:hover {
    transform: none !important;
    border-color: var(--border-color) !important;
    box-shadow: var(--shadow-card) !important;
  }

  @media (min-width: $bp-sm) {
    padding: 1.5rem 1.25rem;
  }

  @media (min-width: $bp-md) {
    padding: 2rem 1.75rem;
  }

  @media (min-width: 1200px) {
    padding: 2.25rem 2rem;
  }
}

// 網格佈局 (雙月曆主區塊與右側試算側欄)
.calendar-layout-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  align-items: stretch;

  @media (min-width: 1250px) {
    grid-template-columns: 1fr 360px;
    gap: 2.25rem;
  }

  @media (min-width: 1400px) {
    grid-template-columns: 1fr 380px;
    gap: 2.5rem;
  }
}

// 左側日曆
.calendar-main-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
  justify-content: flex-start;
}

// 雙月份並排呈現網格
.two-months-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.75rem;
  margin-bottom: 1.75rem;

  @media (min-width: $bp-md) {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 1200px) {
    gap: 1.75rem;
  }
}

.calendar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding-top: 1.5rem;
  padding-bottom: 0.75rem;
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

// 暗黑模式對比度增強
:root[data-theme="dark"] {
  .availability-calendar-card {
    background: #161819;
    border-color: rgba(255, 255, 255, 0.14);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
  }

  .calendar-legend {
    border-top-color: rgba(255, 255, 255, 0.12);

    .legend-item {
      color: var(--text-primary);

      .legend-dot.available {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.22);
      }

      .legend-dot.booked {
        background: rgba(248, 113, 113, 0.2);
        border: 1px solid rgba(248, 113, 113, 0.4);
      }

      .legend-dot.holiday {
        background: rgba(212, 188, 155, 0.2);
        border: 1px solid var(--gold-primary);
      }
    }
  }
}
</style>
