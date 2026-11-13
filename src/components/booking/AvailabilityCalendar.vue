<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../../composables/useI18n'
import pricingData from '../../data/pricing.json'
import siteData from '../../data/site.json'
import channelsData from '../../data/channels.json'
import { getBookedRanges } from '../../services/availabilityService'
import { submitOnlineBooking } from '../../services/bookingService'
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
  Moon,
  X,
  CreditCard,
  Send,
  AlertCircle
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
const guestCount = ref(18)
const hoverDate = ref(null)
const bookedRanges = ref([])

const isSyncing = ref(false)

// 線上預約填單 Modal 狀態
const isModalOpen = ref(false)
const isSubmitting = ref(false)
const bookingSuccess = ref(null)
const bookingError = ref('')
const formGuestName = ref('')
const formGuestPhone = ref('')
const formGuestEmail = ref('')
const formLineId = ref('')
const formSpecialRequests = ref('')

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
  bookingError.value = ''
  bookingSuccess.value = null
  isModalOpen.value = true
}

const closeBookingModal = () => {
  isModalOpen.value = false
  if (bookingSuccess.value) {
    // 若下單成功關閉後重置選取日期並刷新檔期
    checkInDate.value = null
    checkOutDate.value = null
    refreshAvailability()
  }
}

const submitBookingForm = async () => {
  if (!formGuestName.value.trim() || !formGuestPhone.value.trim() || !formGuestEmail.value.trim()) {
    bookingError.value = isEn.value ? 'Please fill in all required fields (Name, Phone, Email).' : '請完整填寫姓名、手機電話與電子信箱。'
    return
  }

  isSubmitting.value = true
  bookingError.value = ''

  try {
    const payload = {
      roomId: 'villa-full',
      guestName: formGuestName.value.trim(),
      guestPhone: formGuestPhone.value.trim(),
      guestEmail: formGuestEmail.value.trim(),
      lineId: formLineId.value.trim(),
      guestCount: guestCount.value,
      checkIn: checkInDate.value,
      checkOut: checkOutDate.value,
      specialRequests: formSpecialRequests.value.trim()
    }

    const res = await submitOnlineBooking(payload)
    if (res && res.success) {
      bookingSuccess.value = res.booking
      // 同步刷新日曆已佔用資料
      refreshAvailability()
    } else {
      throw new Error(res.message || '預約送出失敗')
    }
  } catch (err) {
    bookingError.value = err.message || (isEn.value ? 'Failed to submit reservation. Please check dates.' : '預約送出失敗，請檢查日期是否衝突或稍後再試。')
  } finally {
    isSubmitting.value = false
  }
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
    return dateStr >= range.startDate && dateStr < range.endDate
  })
}

// 取得某日期的預約來源
function getBookingSource(dateStr) {
  if (!bookedRanges.value || !bookedRanges.value.length) return ''
  const found = bookedRanges.value.find(range => dateStr >= range.startDate && dateStr < range.endDate)
  return found ? found.source : ''
}

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
    <!-- 頂部檔期說明列與即時同步按鈕 -->
    <div class="sync-banner">
      <div class="sync-status">
        <Info :size="16" class="info-icon" />
        <span class="sync-text">{{ isEn ? t('calendar.syncNotice') : '房態由 Cloudflare D1 邊緣資料庫與 Airbnb 即時同步反灰' }}</span>
      </div>
      <button 
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
                :disabled="guestCount >= 18" 
                @click="guestCount = Math.min(18, guestCount + 1)"
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

          <!-- 直訂雙軌 CTA -->
          <div class="cta-actions-group">
            <button 
              type="button" 
              class="btn btn-gold btn-block btn-reserve"
              @click="openBookingModal"
            >
              <Sparkles :size="18" />
              <span>{{ isEn ? 'Book Directly Online' : '填單直訂（即時預留）' }}</span>
            </button>

            <a 
              :href="lineBookingUrl" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="btn btn-line-secondary btn-block"
            >
              <Send :size="16" />
              <span>{{ t('calendar.inquireViaLine') }}</span>
            </a>
          </div>

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
          <span class="ota-label">{{ isEn ? 'Official OTA Partner' : '亦可在官方 Airbnb 預約：' }}</span>
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

    <!-- 線上直訂預約彈窗 (Booking Modal) -->
    <Teleport to="body">
      <div v-if="isModalOpen" class="booking-modal-overlay" @click.self="closeBookingModal">
        <div class="booking-modal-card card-luxury" role="dialog" aria-modal="true">
          <!-- 關閉按鈕 -->
          <button class="modal-close-btn" @click="closeBookingModal" aria-label="Close modal">
            <X :size="20" />
          </button>

          <!-- 1. 下單成功畫面 -->
          <div v-if="bookingSuccess" class="booking-modal-success">
            <div class="success-icon-wrap">
              <CheckCircle2 :size="56" class="text-gold" />
            </div>
            <h3 class="success-title">{{ isEn ? 'Reservation Request Submitted' : '預約單已成功送出！' }}</h3>
            <p class="success-subtitle">
              {{ isEn ? 'Your reservation request has been secured in our system.' : '您的包棟檔期已在系統成功登記保留，請依指示完成定金支付。' }}
            </p>

            <div class="order-summary-ticket">
              <div class="ticket-row">
                <span class="t-label">{{ isEn ? 'Order Number' : '訂單編號' }}</span>
                <span class="t-value order-id">{{ bookingSuccess.id }}</span>
              </div>
              <div class="ticket-row">
                <span class="t-label">{{ isEn ? 'Selected Plan' : '預訂項目' }}</span>
                <span class="t-value">{{ bookingSuccess.roomName }}</span>
              </div>
              <div class="ticket-row">
                <span class="t-label">{{ isEn ? 'Dates & Guests' : '日期與人數' }}</span>
                <span class="t-value">{{ bookingSuccess.checkIn }} 至 {{ bookingSuccess.checkOut }} ({{ bookingSuccess.nights }} 晚・{{ bookingSuccess.guestCount }} 人)</span>
              </div>
              <div class="ticket-divider"></div>
              <div class="ticket-row">
                <span class="t-label">{{ isEn ? 'Total Amount' : '預估總房費' }}</span>
                <span class="t-value">NT$ {{ Number(bookingSuccess.totalAmount).toLocaleString() }}</span>
              </div>
              <div class="ticket-row highlight">
                <span class="t-label font-bold">{{ isEn ? 'Required Deposit (50%)' : '應收定金 (50%)' }}</span>
                <span class="t-value deposit-price">NT$ {{ Number(bookingSuccess.depositAmount).toLocaleString() }}</span>
              </div>
            </div>

            <div class="payment-instructions-box">
              <h5 class="pay-heading">
                <CreditCard :size="16" />
                <span>{{ isEn ? 'Payment Instructions' : '定金匯款說明' }}</span>
              </h5>
              <p class="pay-desc">
                請於 <strong>24 小時內</strong> 將定金匯款至民宿官方帳戶，匯款完成後請點擊下方按鈕加入官方 LINE (<strong>{{ siteData.lineId }}</strong>) 回報您的<strong>帳號末五碼</strong>以完成正式鎖房確認！
              </p>
            </div>

            <div class="modal-actions-col">
              <a 
                :href="`https://line.me/R/ti/p/@209yrich?text=${encodeURIComponent(`您好，我已送出線上直訂！\n【訂單編號】：${bookingSuccess.id}\n【訂房人】：${bookingSuccess.guestName}\n【入住日期】：${bookingSuccess.checkIn} 至 ${bookingSuccess.checkOut}\n【應付定金】：NT$ ${Number(bookingSuccess.depositAmount).toLocaleString()}\n【匯款後五碼】：`)}`"
                target="_blank" 
                rel="noopener noreferrer" 
                class="btn btn-gold btn-block"
              >
                <Send :size="18" />
                <span>{{ isEn ? 'Report Transfer via LINE' : '加入官方 LINE 回報後五碼' }}</span>
              </a>
              <button class="btn btn-outline btn-block mt-2" @click="closeBookingModal">
                {{ isEn ? 'Close & Return' : '確認並返回網站' }}
              </button>
            </div>
          </div>

          <!-- 2. 線上填單表單畫面 -->
          <div v-else class="booking-modal-form">
            <div class="modal-header">
              <span class="modal-badge">{{ isEn ? 'Official Direct Booking' : '山語 Villa 官方直訂預約' }}</span>
              <h3 class="modal-title">{{ isEn ? 'Confirm Your Luxury Stay' : '填寫貴賓聯絡資料' }}</h3>
              <p class="modal-meta">
                【{{ checkInDate }} 至 {{ checkOutDate }}】共 {{ bookingCalculation.nights }} 晚・{{ guestCount }} 人入住
              </p>
            </div>

            <form @submit.prevent="submitBookingForm" class="booking-form-grid">
              <!-- 錯誤提醒 -->
              <div v-if="bookingError" class="booking-error-alert">
                <AlertCircle :size="18" />
                <span>{{ bookingError }}</span>
              </div>

              <!-- 姓名 -->
              <div class="form-group">
                <label for="guestName">
                  {{ isEn ? 'Full Name' : '訂房人姓名' }} <span class="required">*</span>
                </label>
                <input 
                  id="guestName" 
                  v-model="formGuestName" 
                  type="text" 
                  class="form-input" 
                  :placeholder="isEn ? 'e.g. John Doe' : '請輸入真實姓名'" 
                  required 
                />
              </div>

              <!-- 電話 -->
              <div class="form-group">
                <label for="guestPhone">
                  {{ isEn ? 'Mobile Phone' : '聯絡手機電話' }} <span class="required">*</span>
                </label>
                <input 
                  id="guestPhone" 
                  v-model="formGuestPhone" 
                  type="tel" 
                  class="form-input" 
                  :placeholder="isEn ? 'e.g. 0912-345-678' : '請輸入聯絡手機'" 
                  required 
                />
              </div>

              <!-- Email -->
              <div class="form-group">
                <label for="guestEmail">
                  {{ isEn ? 'Email Address' : '電子信箱 (接收訂單確認)' }} <span class="required">*</span>
                </label>
                <input 
                  id="guestEmail" 
                  v-model="formGuestEmail" 
                  type="email" 
                  class="form-input" 
                  :placeholder="isEn ? 'e.g. guest@example.com' : '請輸入正確 Email'" 
                  required 
                />
              </div>

              <!-- LINE ID -->
              <div class="form-group">
                <label for="lineId">
                  {{ isEn ? 'LINE ID (Optional)' : 'LINE ID (選填，方便管家聯繫)' }}
                </label>
                <input 
                  id="lineId" 
                  v-model="formLineId" 
                  type="text" 
                  class="form-input" 
                  :placeholder="isEn ? 'Your LINE ID' : '方便管家第一時間聯繫確認'" 
                />
              </div>

              <!-- 特殊需求 -->
              <div class="form-group full-width">
                <label for="specialRequests">
                  {{ isEn ? 'Special Requests & Notes' : '特殊需求或備註事項 (選填)' }}
                </label>
                <textarea 
                  id="specialRequests" 
                  v-model="formSpecialRequests" 
                  class="form-textarea" 
                  rows="2"
                  :placeholder="isEn ? 'e.g. BBQ grill preparation, infant tub, check-in arrival estimates...' : '例如：預計抵達時間、加烤肉架、長輩同行等需求備註'"
                ></textarea>
              </div>

              <!-- 費用小結 -->
              <div class="form-summary-card full-width">
                <div class="f-sum-row">
                  <span>{{ isEn ? 'Estimated Total Rate' : '預估總房價' }}</span>
                  <span class="f-sum-val">NT$ {{ bookingCalculation.grandTotal.toLocaleString() }}</span>
                </div>
                <div class="f-sum-row highlight">
                  <span>{{ isEn ? 'Deposit to pay (50%)' : '預計應付定金 (50%)' }}</span>
                  <span class="f-sum-val f-gold">NT$ {{ Math.round(bookingCalculation.grandTotal * 0.5).toLocaleString() }}</span>
                </div>
              </div>

              <!-- 送出按鈕 -->
              <div class="form-submit-row full-width">
                <button 
                  type="submit" 
                  class="btn btn-gold btn-block btn-submit"
                  :disabled="isSubmitting"
                >
                  <RefreshCw v-if="isSubmitting" :size="18" class="spin" />
                  <Sparkles v-else :size="18" />
                  <span>{{ isSubmitting ? (isEn ? 'Submitting Reservation...' : '訂單傳送中...') : (isEn ? 'Confirm & Secure Dates' : '確認送出直訂預約') }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
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

// 頂部即時同步按鈕
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
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--gold-primary);
    color: var(--gold-primary);
  }

  &.is-spinning svg {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// 直訂雙軌 CTA 按鈕組
.cta-actions-group {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-bottom: 1.5rem;

  .btn-reserve {
    margin-bottom: 0;
  }

  .btn-line-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.75rem 1.25rem;
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    font-size: 0.9rem;
    border-radius: 4px;
    font-weight: 500;
    transition: all 0.2s ease;
    text-decoration: none;

    &:hover {
      border-color: #06c755;
      color: #06c755;
      background: rgba(6, 199, 85, 0.05);
    }
  }
}

// 線上預約彈窗 (Booking Modal)
.booking-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 15, 12, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: fadeIn 0.25s ease-out;
}

.booking-modal-card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  max-width: 580px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 2rem 1.5rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
  animation: modalScaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @media (min-width: $bp-md) {
    padding: 2.5rem 2.25rem;
  }
}

.modal-close-btn {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.35rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    color: var(--text-primary);
    background: var(--bg-primary);
  }
}

.modal-header {
  margin-bottom: 1.5rem;

  .modal-badge {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--gold-primary);
    margin-bottom: 0.4rem;
  }

  .modal-title {
    font-family: $font-display;
    font-size: 1.45rem;
    color: var(--text-primary);
    margin: 0 0 0.35rem;
  }

  .modal-meta {
    font-size: 0.88rem;
    color: var(--text-sub);
    margin: 0;
  }
}

.booking-error-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(220, 53, 69, 0.12);
  border: 1px solid rgba(220, 53, 69, 0.3);
  color: #ff6b6b;
  border-radius: 4px;
  font-size: 0.88rem;
  grid-column: 1 / -1;
  margin-bottom: 0.5rem;
}

.booking-form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.15rem;

  @media (min-width: $bp-sm) {
    grid-template-columns: 1fr 1fr;
  }

  .full-width {
    grid-column: 1 / -1;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;

    label {
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--text-primary);

      .required {
        color: #ff6b6b;
      }
    }

    .form-input,
    .form-textarea {
      padding: 0.65rem 0.85rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      border-radius: 4px;
      font-size: 0.9rem;
      transition: border-color 0.2s ease;

      &:focus {
        outline: none;
        border-color: var(--gold-primary);
        box-shadow: 0 0 0 2px rgba(197, 168, 128, 0.2);
      }
    }
  }
}

.form-summary-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0.85rem 1rem;

  .f-sum-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: var(--text-sub);
    margin-bottom: 0.35rem;

    &.highlight {
      margin-bottom: 0;
      padding-top: 0.35rem;
      border-top: 1px dashed var(--border-color);
      font-weight: 600;

      .f-gold {
        color: var(--gold-primary);
        font-family: $font-display;
        font-size: 1.1rem;
      }
    }
  }
}

.form-submit-row {
  margin-top: 0.5rem;

  .btn-submit {
    padding: 0.85rem 1.5rem;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;

    .spin {
      animation: spin 1s linear infinite;
    }
  }
}

// 成功結案卡片
.booking-modal-success {
  text-align: center;
  padding: 1rem 0;

  .success-icon-wrap {
    margin-bottom: 1rem;
  }

  .success-title {
    font-family: $font-display;
    font-size: 1.5rem;
    color: var(--text-primary);
    margin: 0 0 0.5rem;
  }

  .success-subtitle {
    font-size: 0.9rem;
    color: var(--text-sub);
    margin-bottom: 1.5rem;
    line-height: 1.6;
  }

  .order-summary-ticket {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 1.25rem;
    text-align: left;
    margin-bottom: 1.5rem;

    .ticket-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      font-size: 0.88rem;

      .t-label {
        color: var(--text-muted);
      }

      .t-value {
        color: var(--text-primary);
        font-weight: 500;

        &.order-id {
          font-family: monospace;
          color: var(--gold-primary);
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        &.deposit-price {
          font-family: $font-display;
          font-size: 1.25rem;
          color: var(--gold-primary);
          font-weight: 700;
        }
      }

      &.highlight {
        margin-top: 0.5rem;
      }
    }

    .ticket-divider {
      height: 1px;
      background: var(--border-color);
      margin: 0.65rem 0;
    }
  }

  .payment-instructions-box {
    background: rgba(197, 168, 128, 0.08);
    border: 1px solid rgba(197, 168, 128, 0.25);
    border-radius: 6px;
    padding: 1rem;
    text-align: left;
    margin-bottom: 1.5rem;

    .pay-heading {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.9rem;
      color: var(--gold-primary);
      margin: 0 0 0.4rem;
    }

    .pay-desc {
      font-size: 0.85rem;
      color: var(--text-sub);
      margin: 0;
      line-height: 1.6;
    }
  }

  .modal-actions-col {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalScaleUp {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
