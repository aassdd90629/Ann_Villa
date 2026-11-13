import { computed } from 'vue'
import pricingData from '../data/pricing.json'
import siteData from '../data/site.json'

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

  function formatDate(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
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
    const extraGuests = Math.max(0, (guestCount.value || 18) - pkg.includedGuests)
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

  return {
    pricingData,
    getHolidayForDate,
    bookingCalculation,
    lineBookingUrl
  }
}

