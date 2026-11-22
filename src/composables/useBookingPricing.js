import { ref, computed } from 'vue'

export const WEEKDAY_TIERS = [
  { min: 1, max: 10, price: 20000, labelZh: '10人以下', labelEn: '10 guests or fewer', count: 10 },
  { min: 11, max: 14, price: 25000, labelZh: '11-14人', labelEn: '11-14 guests', count: 14 },
  { min: 15, max: 18, price: 30000, labelZh: '15-18人', labelEn: '15-18 guests', count: 18 }
]

export const DEFAULT_PRICING = {
  exclusivePackage: {
    nameZh: '山語・全區尊榮包棟方案',
    nameEn: 'Exclusive Full Villa Buyout',
    titleZh: '山語・全區尊榮包棟方案',
    titleEn: 'Exclusive Full Villa Buyout',
    descZh: '獨享 180 坪私密山林莊園，5 間獨立景觀套房、戶外戲水池與全套奢華公設。',
    descEn: 'Exclusive buyout of the 180-ping private estate featuring 5 ensuite bedrooms and full amenities.',
    weekday: 20000,
    includedGuests: 18,
    maxCapacity: 18,
    weekend: 35000,
    deposit: 3000,
    extraPersonFee: 1500
  },
  additionalServices: [
    {
      id: 'bbq-service',
      titleZh: '戶外庭園美式烤肉代訂與場地備品',
      titleEn: 'Outdoor Garden BBQ Setup & Grill Experience',
      pricingZh: '提供美式大型烤肉爐與戶外用餐座席',
      pricingEn: 'Complimentary BBQ grill & outdoor dining tables',
      noteZh: '備有烤肉爐具與戶外洗滌區，食材醬料可自備或由管家協助在地生鮮代訂。',
      noteEn: 'Outdoor grill setup ready. Bring your own ingredients or coordinate with concierge for local fresh food delivery.'
    },
    {
      id: 'ktv-mahjong',
      titleZh: '歡唱卡拉OK與電動麻將娛樂',
      titleEn: 'KTV Karaoke & Auto Mahjong Amenities',
      pricingZh: '包棟住客免費尊享',
      pricingEn: 'Complimentary with Villa Reservation',
      noteZh: '獨立隔音舒適客廳，配備高階音響、雙麥克風與最新電動四口麻將桌。',
      noteEn: 'Private acoustic lounge with premium sound system, dual wireless mics, and motorized automatic mahjong table.'
    },
    {
      id: 'butler-service',
      titleZh: '24 小時貼心管家諮詢與在地接待',
      titleEn: '24-Hour Butler & Concierge Hospitality',
      pricingZh: '全天候專屬禮遇',
      pricingEn: 'All-Day Dedicated Service',
      noteZh: '提供在地行程導航諮詢、即時管家支援與入住退房全程尊榮引導。',
      noteEn: 'Local itinerary guidance, on-call assistance, and personalized check-in/out hospitality.'
    }
  ],
  holidays: [
    { name: '元旦跨年假期', startDate: '2026-12-31', endDate: '2027-01-03', price: 42000 },
    { name: '農曆春節連假', startDate: '2027-02-05', endDate: '2027-02-14', price: 60000 },
    { name: '228和平紀念日連假', startDate: '2027-02-26', endDate: '2027-03-01', price: 42000 },
    { name: '清明兒童連假', startDate: '2027-04-02', endDate: '2027-04-06', price: 42000 },
    { name: '端午節連假', startDate: '2027-06-18', endDate: '2027-06-21', price: 42000 },
    { name: '中秋節連假', startDate: '2027-09-24', endDate: '2027-09-27', price: 42000 },
    { name: '國慶日連假', startDate: '2027-10-08', endDate: '2027-10-11', price: 42000 }
  ]
}

const activePricing = ref({ ...DEFAULT_PRICING })
const isPricingLoaded = ref(false)

export async function fetchPricingSettings() {
  if (isPricingLoaded.value) return activePricing.value
  try {
    const res = await fetch('/api/pricing')
    if (res.ok) {
      const data = await res.json()
      if (data && data.success && data.pricing) {
        activePricing.value = {
          exclusivePackage: {
            ...activePricing.value.exclusivePackage,
            weekend: data.pricing.weekend || 35000,
            deposit: data.pricing.deposit || 3000,
            maxCapacity: data.pricing.maxCapacity || 18
          },
          holidays: Array.isArray(data.holidays) && data.holidays.length > 0 ? data.holidays : activePricing.value.holidays
        }
        isPricingLoaded.value = true
      }
    }
  } catch (e) {
    console.warn('[useBookingPricing] 讀取定價失敗，使用安全預設:', e.message)
  }
  return activePricing.value
}

// 首次引入時觸發一次靜態載入
fetchPricingSettings()

export function getWeekdayPrice(guests = 18) {
  const g = Number(guests) || 18
  if (g <= 10) return 20000
  if (g <= 14) return 25000
  return 30000
}

export function getWeekdayTier(guests = 18) {
  const g = Number(guests) || 18
  if (g <= 10) return WEEKDAY_TIERS[0]
  if (g <= 14) return WEEKDAY_TIERS[1]
  return WEEKDAY_TIERS[2]
}

export function useBookingPricing(checkInDate, checkOutDate, guestCount) {
  function getHolidayForDate(dateStr) {
    const list = activePricing.value.holidays || []
    return list.find(h => h.startDate && h.endDate && dateStr >= h.startDate && dateStr <= h.endDate) || null
  }

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

  const bookingCalculation = computed(() => {
    const currentWeekdayUnitPrice = getWeekdayPrice(guestCount.value)
    const currentWeekdayTier = getWeekdayTier(guestCount.value)
    const weekendUnitPrice = activePricing.value.exclusivePackage.weekend

    if (!checkInDate.value || !checkOutDate.value) {
      return {
        nights: 0,
        weekdayNights: 0,
        weekdayUnitPrice: currentWeekdayUnitPrice,
        weekdayTier: currentWeekdayTier,
        weekendNights: 0,
        weekendUnitPrice,
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
        holidayTotal += (holiday.price || holiday.rate || 42000)
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
    
    const pkg = activePricing.value.exclusivePackage
    const weekdayTotal = weekdayCount * currentWeekdayUnitPrice
    const weekendTotal = weekendCount * pkg.weekend
    const baseTotal = weekdayTotal + weekendTotal + holidayTotal
    const extraGuests = Math.max(0, (guestCount.value || 18) - (pkg.includedGuests || 18))
    const extraFeePerNight = extraGuests * (pkg.extraPersonFee || 1500)
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

  const lineBookingUrl = computed(() => {
    let msg = `您好，我想洽詢山語Villa包棟預約：`
    if (checkInDate.value && checkOutDate.value) {
      msg += `【入住：${checkInDate.value}】【退房：${checkOutDate.value} (共 ${bookingCalculation.value.nights} 晚)】【人數：${guestCount.value} 人】【預估總額：NT$ ${bookingCalculation.value.grandTotal.toLocaleString()}】`
    } else if (checkInDate.value) {
      msg += `【預計入住：${checkInDate.value}】【人數：${guestCount.value} 人】`
    } else {
      msg = '您好，我想洽詢山語Villa全棟包棟預約：【預計入住日期：】【人數：位（最多18人）】'
    }
    return `https://line.me/R/ti/p/@209yrich?text=${encodeURIComponent(msg)}`
  })

  return {
    pricingData: activePricing,
    WEEKDAY_TIERS,
    getWeekdayPrice,
    getWeekdayTier,
    getHolidayForDate,
    isWeekdayDate,
    bookingCalculation,
    lineBookingUrl,
    fetchPricingSettings
  }
}
