import { computed } from 'vue'
import pricingData from '../data/pricing.json'
import siteData from '../data/site.json'

/**
 * 平日（週一至週四）依入住人數之階梯定價常數
 * 10人以下: 20,000$
 * 11-14人以下: 25,000$
 * 15-18人以下: 30,000$
 */
export const WEEKDAY_TIERS = [
  { min: 1, max: 10, price: 20000, labelZh: '10人以下', labelEn: '10 guests or fewer', count: 10 },
  { min: 11, max: 14, price: 25000, labelZh: '11-14人', labelEn: '11-14 guests', count: 14 },
  { min: 15, max: 18, price: 30000, labelZh: '15-18人', labelEn: '15-18 guests', count: 18 }
]

/**
 * 依據人數取得平日每晚單價
 * @param {number} guests 
 * @returns {number}
 */
export function getWeekdayPrice(guests = 18) {
  const g = Number(guests) || 18
  if (g <= 10) return 20000
  if (g <= 14) return 25000
  return 30000
}

/**
 * 取得當前人數對應的階梯物件
 * @param {number} guests 
 */
export function getWeekdayTier(guests = 18) {
  const g = Number(guests) || 18
  if (g <= 10) return WEEKDAY_TIERS[0]
  if (g <= 14) return WEEKDAY_TIERS[1]
  return WEEKDAY_TIERS[2]
}

/**
 * 山語 Villa 檔期價格試算 Composable
 * 負責平假日、國定連續假期加價、超額加人加床費用試算與官方 LINE 洽詢字串生成
 * 
 * @param {import('vue').Ref<string|null>} checkInDate 入住日期 'YYYY-MM-DD'
 * @param {import('vue').Ref<string|null>} checkOutDate 退房日期 'YYYY-MM-DD'
 * @param {import('vue').Ref<number>} guestCount 入住人數 (1~18)
 */
export function useBookingPricing(checkInDate, checkOutDate, guestCount) {
  // 檢查特定日期是否為國定連假
  function getHolidayForDate(dateStr) {
    if (!pricingData.holidays) return null
    return pricingData.holidays.find(h => h.startDate && h.endDate && dateStr >= h.startDate && dateStr <= h.endDate) || null
  }

  // 判斷特定日期字串是否為平日 (星期一至星期四，且非國定連假)
  function isWeekdayDate(dateStr) {
    if (!dateStr) return false
    if (getHolidayForDate(dateStr)) return false
    const d = new Date(dateStr)
    const day = d.getDay()
    return day >= 1 && day <= 4
  }

  function formatDate(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  // 計算住宿晚數與價格明細
  const bookingCalculation = computed(() => {
    const currentWeekdayUnitPrice = getWeekdayPrice(guestCount.value)
    const currentWeekdayTier = getWeekdayTier(guestCount.value)

    if (!checkInDate.value || !checkOutDate.value) {
      return {
        nights: 0,
        weekdayNights: 0,
        weekdayUnitPrice: currentWeekdayUnitPrice,
        weekdayTier: currentWeekdayTier,
        weekendNights: 0,
        weekendUnitPrice: pricingData.exclusivePackage.weekend,
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
    const weekdayTotal = weekdayCount * currentWeekdayUnitPrice
    const weekendTotal = weekendCount * pkg.weekend
    const baseTotal = weekdayTotal + weekendTotal + holidayTotal
    const extraGuests = Math.max(0, (guestCount.value || 18) - pkg.includedGuests)
    const extraFeePerNight = extraGuests * pkg.extraPersonFee
    const totalExtraFee = extraFeePerNight * (weekdayCount + weekendCount + holidayCount)
    const grandTotal = baseTotal + totalExtraFee
    
    return {
      nights: weekdayCount + weekendCount + holidayCount,
      weekdayNights: weekdayCount,
      weekdayUnitPrice: currentWeekdayUnitPrice,
      weekdayTier: currentWeekdayTier,
      weekendNights: weekendCount,
      weekendUnitPrice: pkg.weekend,
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

  return {
    pricingData,
    WEEKDAY_TIERS,
    getWeekdayPrice,
    getWeekdayTier,
    getHolidayForDate,
    isWeekdayDate,
    bookingCalculation,
    lineBookingUrl
  }
}
