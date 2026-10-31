<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../../composables/useI18n'
import pricingData from '../../data/pricing.json'
import siteData from '../../data/site.json'
import channelsData from '../../data/channels.json'
import { getBookedRanges } from '../../services/availabilityService'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  Info, 
  Users,
  Moon
} from 'lucide-vue-next'

const { isEn, t, tField } = useI18n()

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
const guestCount = ref(20)
const hoverDate = ref(null)
const bookedRanges = ref([])

onMounted(async () => {
  try {
    bookedRanges.value = await getBookedRanges()
  } catch (err) {
    bookedRanges.value = []
  }
})

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

// 檢查特定日期是否為國定連假
function getHolidayForDate(dateStr) {
  if (!pricingData.holidays) return null
  return pricingData.holidays.find(h => h.startDate && h.endDate && dateStr >= h.startDate && dateStr <= h.endDate) || null
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

function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isDatePast(d) {
  // 依照民宿當下的時間，預設明天（含）之後的日期才可以開始預訂
  return d < minBookingDate
}

function isDateBooked(dateStr) {
  if (!bookedRanges.value || !bookedRanges.value.length) return false
  return bookedRanges.value.some(range => {
    return dateStr >= range.startDate && dateStr <= range.endDate
  })
}

// 取得某日期的預約來源
function getBookingSource(dateStr) {
  if (!bookedRanges.value || !bookedRanges.value.length) return ''
  const found = bookedRanges.value.find(range => dateStr >= range.startDate && dateStr <= range.endDate)
  return found ? found.source : ''
}

// 點擊日期
const selectDate = (day) => {
  if (day.isPast || day.isBooked) return
  
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

// 計算住宿晚數與價格明細
const bookingCalculation = computed(() => {
  if (!checkInDate.value || !checkOutDate.value) {
    return {
      nights: 0,
      weekdayNights: 0,
      weekendNights: 0,
      holidayNights: 0,
      holidayTotal: 0,
      baseTotal: 0,
      extraPersonFee: 0,
      grandTotal: 0
    }
  }
  
  let current = new Date(checkInDate.value)
  const end = new Date(checkOutDate.value)
  let weekdayCount = 0
  let weekendCount = 0
  let holidayCount = 0
  let holidayTotal = 0
  
  while (current < end) {
    const dateStr = formatDate(current)
    const holiday = getHolidayForDate(dateStr)
    
    if (holiday) {
      holidayCount++
      holidayTotal += holiday.price
    } else {
      const dayOfWeek = current.getDay() // 0 = Sun, 5 = Fri, 6 = Sat
      if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
        weekendCount++
      } else {
        weekdayCount++
      }
    }
    current.setDate(current.getDate() + 1)
  }
  
  const pkg = pricingData.exclusivePackage
  const baseTotal = (weekdayCount * pkg.weekday) + (weekendCount * pkg.weekend) + holidayTotal
  const extraGuests = Math.max(0, guestCount.value - pkg.includedGuests)
  const extraFeePerNight = extraGuests * pkg.extraPersonFee
  const totalExtraFee = extraFeePerNight * (weekdayCount + weekendCount + holidayCount)
  const grandTotal = baseTotal + totalExtraFee
  
  return {
    nights: weekdayCount + weekendCount + holidayCount,
    weekdayNights: weekdayCount,
    weekendNights: weekendCount,
    holidayNights: holidayCount,
    holidayTotal,
    baseTotal,
    extraPersonFee: totalExtraFee,
    grandTotal
  }
})

// 生成官方 LINE 預約帶入文字網址
const lineBookingUrl = computed(() => {
  let msg = `您好，我想洽詢山語Villa包棟預約：`
  if (checkInDate.value && checkOutDate.value) {
    msg += `【入住：${checkInDate.value}】【退房：${checkOutDate.value} (共 ${bookingCalculation.value.nights} 晚)】【人數：${guestCount.value} 人】【預估總額：NT$ ${bookingCalculation.value.grandTotal.toLocaleString()}】`
  } else if (checkInDate.value) {
    msg += `【預計入住：${checkInDate.value}】【人數：${guestCount.value} 人】`
  } else {
    msg = siteData.lineTemplateMsg
  }
  return `https://line.me/R/ti/p/@209yrich?text=${encodeURIComponent(msg)}`
})
</script>

<template>
  <div class="availability-calendar-card card-luxury">
    <!-- 頂部檔期說明列 -->
    <div class="sync-banner">
      <div class="sync-status">
        <Info :size="16" class="info-icon" />
        <span class="sync-text">{{ isEn ? t('calendar.syncNotice') : '房態僅供即時參考，最新空房檔期請以官方 LINE 管家確認為準' }}</span>
      </div>
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
            <button class="nav-btn" :disabled="isPrevDisabled" @click="prevMonth" :aria-label="isEn ? 'Previous month' : '上一月'">
              <ChevronLeft :size="18" />
            </button>
            <button class="nav-btn" @click="nextMonth" :aria-label="isEn ? 'Next month' : '下一月'">
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
            :disabled="day.isPast || day.isBooked"
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

      <!-- 右側：日期試算與直訂優惠 -->
      <div class="booking-summary-col">
        <div class="summary-box">
          <h4 class="summary-heading">
            <Sparkles :size="18" class="text-gold" />
            <span>{{ isEn ? 'Selected Itinerary & Rate' : '預選檔期與費用試算' }}</span>
          </h4>

          <div class="date-pick-display">
            <div class="date-slot" :class="{ filled: checkInDate }">
              <span class="slot-label">{{ t('calendar.checkIn') }}</span>
              <span class="slot-val">{{ checkInDate || (isEn ? 'Select date' : '點選入住日期') }}</span>
            </div>
            <div class="slot-arrow">→</div>
            <div class="date-slot" :class="{ filled: checkOutDate }">
              <span class="slot-label">{{ t('calendar.checkOut') }}</span>
              <span class="slot-val">{{ checkOutDate || (isEn ? 'Select date' : '點選退房日期') }}</span>
            </div>
          </div>

          <!-- 人數選擇器 -->
          <div class="guests-selector-row">
            <label class="g-label">
              <Users :size="16" />
              <span>{{ t('calendar.guests') }}</span>
            </label>
            <div class="g-control">
              <button 
                class="g-btn" 
                :disabled="guestCount <= 1" 
                @click="guestCount = Math.max(1, guestCount - 1)"
              >-</button>
              <span class="g-count">{{ guestCount }} {{ t('calendar.guestCount') }}</span>
              <button 
                class="g-btn" 
                :disabled="guestCount >= 20" 
                @click="guestCount = Math.min(20, guestCount + 1)"
              >+</button>
            </div>
          </div>

          <!-- 價格計算明細 -->
          <div v-if="bookingCalculation.nights > 0" class="calc-breakdown">
            <div class="calc-row">
              <span>{{ isEn ? 'Stay Duration' : '入住晚數' }}</span>
              <span class="calc-val">{{ bookingCalculation.nights }} {{ t('calendar.nights') }}</span>
            </div>
            <div v-if="bookingCalculation.weekdayNights > 0" class="calc-row sub">
              <span>{{ isEn ? 'Weekday' : '平日' }} ({{ bookingCalculation.weekdayNights }} {{ t('calendar.nights') }} × NT$ {{ pricingData.exclusivePackage.weekday.toLocaleString() }})</span>
              <span>NT$ {{ (bookingCalculation.weekdayNights * pricingData.exclusivePackage.weekday).toLocaleString() }}</span>
            </div>
            <div v-if="bookingCalculation.weekendNights > 0" class="calc-row sub">
              <span>{{ isEn ? 'Weekend' : '假日' }} ({{ bookingCalculation.weekendNights }} {{ t('calendar.nights') }} × NT$ {{ pricingData.exclusivePackage.weekend.toLocaleString() }})</span>
              <span>NT$ {{ (bookingCalculation.weekendNights * pricingData.exclusivePackage.weekend).toLocaleString() }}</span>
            </div>
            <div v-if="bookingCalculation.holidayNights > 0" class="calc-row sub highlight-holiday">
              <span>{{ isEn ? 'Consecutive Holidays' : '國定連續假期' }} ({{ bookingCalculation.holidayNights }} {{ t('calendar.nights') }})</span>
              <span>NT$ {{ bookingCalculation.holidayTotal.toLocaleString() }}</span>
            </div>
            <div v-if="bookingCalculation.extraPersonFee > 0" class="calc-row sub">
              <span>{{ isEn ? 'Extra Person Fee' : '加人加床費用' }}</span>
              <span>NT$ {{ bookingCalculation.extraPersonFee.toLocaleString() }}</span>
            </div>
            <div class="calc-divider"></div>
            <div class="calc-total-row">
              <span class="total-label">{{ t('calendar.estimatedTotal') }}</span>
              <span class="total-price">NT$ {{ bookingCalculation.grandTotal.toLocaleString() }}</span>
            </div>
          </div>

          <div v-else class="calc-placeholder">
            <Info :size="16" />
            <span>{{ t('calendar.selectDates') }}</span>
          </div>

          <!-- 直訂 CTA -->
          <a 
            :href="lineBookingUrl" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="btn btn-gold btn-block btn-reserve"
          >
            <Sparkles :size="18" />
            <span>{{ t('calendar.inquireViaLine') }}</span>
          </a>

          <!-- 官方直訂專屬禮遇 (Perks) -->
          <div class="direct-perks-box">
            <div class="perks-title">
              <ShieldCheck :size="16" class="perk-icon" />
              <span>{{ isEn ? 'Direct Booking Privileges' : '山語 Villa 官方直訂禮遇' }}</span>
            </div>
            <ul class="perks-list">
              <li v-for="(perk, pIdx) in (isEn ? channelsData.directBooking.perksEn : channelsData.directBooking.perksZh)" :key="pIdx">
                <CheckCircle2 :size="13" class="p-check" />
                <span>{{ perk }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- 合作 OTA 渠道標籤 -->
        <div class="ota-channels-footer">
          <span class="ota-label">{{ isEn ? 'Official OTA Partners' : '亦可在以下合作平台預約：' }}</span>
          <div class="ota-badges">
            <a 
              v-for="ota in channelsData.otaPlatforms" 
              :key="ota.id" 
              :href="ota.url" 
              target="_blank" 
              rel="noopener noreferrer"
              class="ota-badge"
              :title="ota.name"
            >
              <span>{{ ota.name }}</span>
              <ExternalLink :size="12" />
            </a>
          </div>
        </div>
      </div>
    </div>
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

// 頂部同步狀態
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

  .sync-time {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.8rem;
    color: var(--text-muted);

    .spin-hover:hover {
      transform: rotate(180deg);
      transition: transform 0.5s ease;
    }
  }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
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
      transition: all 0.2s ease;

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
  transition: all 0.2s ease;
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
      background: rgba(197, 168, 128, 0.2);
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
    background: rgba(115, 109, 101, 0.15);
    color: var(--text-muted);
    cursor: not-allowed;
    text-decoration: line-through;

    .booked-tag {
      text-decoration: none;
      background: rgba(115, 109, 101, 0.2);
      color: var(--text-muted);
    }
  }

  &.is-selected {
    background: var(--gold-primary) !important;
    color: #FFFFFF !important;
    border-color: var(--gold-primary);
    box-shadow: 0 4px 12px rgba(197, 168, 128, 0.35);

    .cell-tag {
      background: rgba(0, 0, 0, 0.25);
      color: #FFFFFF;
    }
  }

  &.is-in-range {
    background: rgba(197, 168, 128, 0.18) !important;
    border-color: rgba(197, 168, 128, 0.4);
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
        background: rgba(115, 109, 101, 0.4);
      }
      &.selected {
        background: var(--gold-primary);
      }
      &.holiday {
        background: rgba(197, 168, 128, 0.35);
        border: 1px solid var(--gold-primary);
      }
    }
  }
}

// 右側訂單摘要與禮遇
.booking-summary-col {
  display: flex;
  flex-direction: column;
}

.summary-box {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;

  .summary-heading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.15rem;
    margin-bottom: 1.25rem;
  }
}

.date-pick-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  background: var(--bg-card);
  padding: 0.75rem 1rem;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  margin-bottom: 1.25rem;

  .date-slot {
    display: flex;
    flex-direction: column;

    .slot-label {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .slot-val {
      font-family: $font-display;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-top: 2px;
    }

    &.filled .slot-val {
      color: var(--gold-primary);
    }
  }

  .slot-arrow {
    color: var(--text-muted);
    font-size: 1.1rem;
  }
}

.guests-selector-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--bg-card);
  border-radius: 4px;
  border: 1px solid var(--border-color);
  margin-bottom: 1.25rem;

  .g-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.88rem;
    color: var(--text-sub);
    font-weight: 500;
  }

  .g-control {
    display: flex;
    align-items: center;
    gap: 0.65rem;

    .g-btn {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 1px solid var(--border-color);
      background: var(--bg-primary);
      color: var(--text-primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;

      &:hover:not(:disabled) {
        border-color: var(--gold-primary);
        color: var(--gold-primary);
      }

      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }

    .g-count {
      font-size: 0.9rem;
      font-weight: 600;
      min-width: 50px;
      text-align: center;
    }
  }
}

.calc-breakdown {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1.5rem;

  .calc-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.88rem;
    margin-bottom: 0.4rem;
    color: var(--text-sub);

    &.sub {
      font-size: 0.82rem;
      color: var(--text-muted);

      &.highlight-holiday {
        color: var(--gold-primary);
        font-weight: 500;
      }
    }
  }

  .calc-divider {
    height: 1px;
    background: var(--border-color);
    margin: 0.75rem 0;
  }

  .calc-total-row {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .total-label {
      font-weight: 600;
      font-size: 0.95rem;
      color: var(--text-primary);
    }

    .total-price {
      font-family: $font-display;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--gold-primary);
    }
  }
}

.calc-placeholder {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--bg-card);
  border-radius: 4px;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.btn-reserve {
  padding: 0.9rem 1.5rem;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 16px rgba(197, 168, 128, 0.25);
}

// 官方直訂禮遇
.direct-perks-box {
  border-top: 1px solid var(--border-color);
  padding-top: 1.25rem;

  .perks-title {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--gold-primary);
    margin-bottom: 0.75rem;

    .perk-icon {
      color: var(--gold-primary);
    }
  }

  .perks-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    li {
      display: flex;
      align-items: flex-start;
      gap: 0.45rem;
      font-size: 0.82rem;
      color: var(--text-sub);
      line-height: 1.5;

      .p-check {
        color: var(--gold-primary);
        flex-shrink: 0;
        margin-top: 2px;
      }
    }
  }
}

// 合作 OTA 渠道
.ota-channels-footer {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  .ota-label {
    font-size: 0.78rem;
    color: var(--text-muted);
  }

  .ota-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;

    .ota-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.85rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-size: 0.82rem;
      color: var(--text-sub);
      font-weight: 500;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--gold-primary);
        color: var(--gold-primary);
        background: var(--bg-card);
      }
    }
  }
}
</style>
