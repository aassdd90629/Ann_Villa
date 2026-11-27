import { ref, computed } from 'vue'
import { buildLineUrl } from '../utils/lineUrl.js'
import { useSiteContent } from './useSiteContent.js'

export const WEEKDAY_TIERS = [
  { min: 1, max: 10, price: 20000, labelZh: '10人以下', labelEn: '10 guests or fewer', count: 10 },
  { min: 11, max: 14, price: 25000, labelZh: '11-14人', labelEn: '11-14 guests', count: 14 },
  { min: 15, max: 18, price: 30000, labelZh: '15-18人', labelEn: '15-18 guests', count: 18 }
]

export const dynamicWeekdayTiers = computed(() => {
  const t1Max = activePricing.value.weekdayTier1MaxGuests || 10
  const t2Max = activePricing.value.weekdayTier2MaxGuests || 14
  const maxCap = activePricing.value.exclusivePackage?.maxCapacity || activePricing.value.maxCapacity || 18
  return [
    { min: 1, max: t1Max, price: activePricing.value.weekdayTier1 || 20000, labelZh: `${t1Max}人以下`, labelEn: `${t1Max} guests or fewer`, count: t1Max },
    { min: t1Max + 1, max: t2Max, price: activePricing.value.weekdayTier2 || 25000, labelZh: `${t1Max + 1}-${t2Max}人`, labelEn: `${t1Max + 1}-${t2Max} guests`, count: t2Max },
    { min: t2Max + 1, max: maxCap, price: activePricing.value.weekdayTier3 || 30000, labelZh: `${t2Max + 1}-${maxCap}人`, labelEn: `${t2Max + 1}-${maxCap} guests`, count: maxCap }
  ]
})

export const DEFAULT_PRICING = {
  weekdayTier1: 20000,
  weekdayTier2: 25000,
  weekdayTier3: 30000,
  weekdayTier1MaxGuests: 10,
  weekdayTier2MaxGuests: 14,
  maxCapacity: 18,
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
    { id: 'h-2026-xmas', name: '2026 聖誕節連假', nameZh: '2026 聖誕節連假', nameEn: '2026 Christmas Holiday', startDate: '2026-12-24', endDate: '2026-12-27', price: 47000, breakfast: true, noteZh: '含精緻手作早餐' },
    { id: 'h-2026-nye', name: '2026 跨年假期', nameZh: '2026 跨年假期', nameEn: "2026 New Year's Eve", startDate: '2026-12-31', endDate: '2027-01-01', price: 47000, breakfast: true, noteZh: '含精緻手作早餐' },
    { id: 'h-2027-ny', name: '2027 元旦連假', nameZh: '2027 元旦連假', nameEn: '2027 New Year Holiday', startDate: '2027-01-01', endDate: '2027-01-03', price: 47000, breakfast: true, noteZh: '含精緻手作早餐' },
    { id: 'h-2027-cny', name: '2027 農曆春節過年連假', nameZh: '2027 農曆春節過年連假', nameEn: '2027 Lunar New Year Holiday', startDate: '2027-02-04', endDate: '2027-02-10', price: 50000, breakfast: false, noteZh: '春節期間不提供早餐' },
    { id: 'h-2027-228', name: '2027 和平紀念日連假', nameZh: '2027 和平紀念日連假', nameEn: '2027 Peace Memorial Day Holiday', startDate: '2027-02-26', endDate: '2027-03-01', price: 38000, breakfast: true, noteZh: '含精緻手作早餐' },
    { id: 'h-2027-tomb', name: '2027 清明與兒童連假', nameZh: '2027 清明與兒童連假', nameEn: "2027 Children's & Tomb Sweeping Day", startDate: '2027-04-02', endDate: '2027-04-06', price: 38000, breakfast: true, noteZh: '含精緻手作早餐' },
    { id: 'h-2027-labor', name: '2027 五一勞動節連假', nameZh: '2027 五一勞動節連假', nameEn: '2027 Labor Day Holiday', startDate: '2027-04-29', endDate: '2027-05-02', price: 38000, breakfast: true, noteZh: '含精緻手作早餐' },
    { id: 'h-2027-dragon', name: '2027 端午連假', nameZh: '2027 端午連假', nameEn: '2027 Dragon Boat Festival Holiday', startDate: '2027-06-08', endDate: '2027-06-09', price: 35000, breakfast: true, noteZh: '含精緻手作早餐' },
    { id: 'h-2027-moon', name: '2027 中秋連假', nameZh: '2027 中秋連假', nameEn: '2027 Mid-Autumn Festival Holiday', startDate: '2027-09-14', endDate: '2027-09-15', price: 35000, breakfast: true, noteZh: '含精緻手作早餐' },
    { id: 'h-2027-teacher', name: '2027 教師節連假', nameZh: '2027 教師節連假', nameEn: "2027 Teachers' Day Holiday", startDate: '2027-09-27', endDate: '2027-09-28', price: 35000, breakfast: true, noteZh: '含精緻手作早餐' },
    { id: 'h-2027-national', name: '2027 雙十國慶連假', nameZh: '2027 雙十國慶連假', nameEn: '2027 National Day Holiday', startDate: '2027-10-08', endDate: '2027-10-11', price: 38000, breakfast: true, noteZh: '含精緻手作早餐' },
    { id: 'h-2027-retro', name: '2027 光復節連假', nameZh: '2027 光復節連假', nameEn: '2027 Retrocession Day Holiday', startDate: '2027-10-22', endDate: '2027-10-25', price: 38000, breakfast: true, noteZh: '含精緻手作早餐' },
    { id: 'h-2027-xmas', name: '2027 聖誕連假', nameZh: '2027 聖誕連假', nameEn: '2027 Christmas Holiday', startDate: '2027-12-23', endDate: '2027-12-26', price: 47000, breakfast: true, noteZh: '含精緻手作早餐' },
    { id: 'h-2028-ny', name: '2028 跨年元旦連假', nameZh: '2028 跨年元旦連假', nameEn: "2028 New Year's Eve & New Year Holiday", startDate: '2027-12-30', endDate: '2028-01-02', price: 47000, breakfast: true, noteZh: '含精緻手作早餐' }
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
      if (data && data.success) {
        const p = data.pricing || data.settings || {}
        activePricing.value = {
          ...activePricing.value,
          weekdayTier1: Number(p.weekdayTier1) || 20000,
          weekdayTier2: Number(p.weekdayTier2) || 25000,
          weekdayTier3: Number(p.weekdayTier3) || 30000,
          weekdayTier1MaxGuests: Number(p.weekdayTier1MaxGuests) || 10,
          weekdayTier2MaxGuests: Number(p.weekdayTier2MaxGuests) || 14,
          maxCapacity: Number(p.maxCapacity) || 18,
          exclusivePackage: {
            ...activePricing.value.exclusivePackage,
            weekday: Number(p.weekdayTier1) || 20000,
            weekend: Number(p.weekend) || activePricing.value.exclusivePackage.weekend,
            deposit: Number(p.deposit) || activePricing.value.exclusivePackage.deposit,
            maxCapacity: Number(p.maxCapacity) || activePricing.value.exclusivePackage.maxCapacity,
            includedGuests: Number(p.maxCapacity) || activePricing.value.exclusivePackage.includedGuests,
            checkInTime: p.checkInTime || activePricing.value.exclusivePackage.checkInTime,
            checkOutTime: p.checkOutTime || activePricing.value.exclusivePackage.checkOutTime
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

export function getWeekdayPrice(guests) {
  const maxCap = activePricing.value.exclusivePackage?.maxCapacity || activePricing.value.maxCapacity || 18
  const g = Number(guests) || maxCap
  const t1Max = activePricing.value.weekdayTier1MaxGuests || 10
  const t2Max = activePricing.value.weekdayTier2MaxGuests || 14
  const t1 = activePricing.value.weekdayTier1 || 20000
  const t2 = activePricing.value.weekdayTier2 || 25000
  const t3 = activePricing.value.weekdayTier3 || 30000
  if (g <= t1Max) return t1
  if (g <= t2Max) return t2
  return t3
}

export function getWeekdayTier(guests) {
  const maxCap = activePricing.value.exclusivePackage?.maxCapacity || activePricing.value.maxCapacity || 18
  const g = Number(guests) || maxCap
  const tiers = dynamicWeekdayTiers.value
  if (g <= tiers[0].max) return tiers[0]
  if (g <= tiers[1].max) return tiers[1]
  return tiers[2]
}

export function useBookingPricing(checkInDate, checkOutDate, guestCount) {
  function getHolidayForDate(dateStr) {
    if (!dateStr) return null
    const list = activePricing.value.holidays || []
    return list.find(h => {
      const s = h.startDate || h.start_date || h.start
      const e = h.endDate || h.end_date || h.end
      return s && e && dateStr >= s && dateStr <= e
    }) || null
  }

  function parseDateToNoon(dateStr) {
    if (!dateStr) return null
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d, 12, 0, 0)
  }

  function isWeekdayDate(dateStr) {
    if (!dateStr) return false
    if (getHolidayForDate(dateStr)) return false
    const d = parseDateToNoon(dateStr)
    if (!d || isNaN(d.getTime())) return false
    const day = d.getDay()
    return day >= 1 && day <= 4
  }

  function isWeekendDate(dateStr) {
    if (!dateStr) return false
    if (getHolidayForDate(dateStr)) return false
    const d = parseDateToNoon(dateStr)
    if (!d || isNaN(d.getTime())) return false
    const day = d.getDay()
    return day === 0 || day === 5 || day === 6
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
        holidayNames: [],
        holidayNightsList: [],
        baseTotal: 0,
        extraPersonFee: 0,
        grandTotal: 0
      }
    }
    
    let current = parseDateToNoon(checkInDate.value)
    const end = parseDateToNoon(checkOutDate.value)
    if (!current || !end || isNaN(current.getTime()) || isNaN(end.getTime()) || current >= end) {
      return {
        nights: 0,
        weekdayNights: 0,
        weekdayUnitPrice: currentWeekdayUnitPrice,
        weekdayTier: currentWeekdayTier,
        weekendNights: 0,
        weekendUnitPrice,
        holidayNights: 0,
        holidayTotal: 0,
        holidayNames: [],
        holidayNightsList: [],
        baseTotal: 0,
        extraPersonFee: 0,
        grandTotal: 0
      }
    }

    let weekdayCount = 0
    let weekendCount = 0
    let holidayCount = 0
    let holidayTotal = 0
    const holidayNames = []
    const holidayNightsList = []
    
    while (current < end) {
      const dateStr = formatDate(current)
      const holiday = getHolidayForDate(dateStr)
      
      if (holiday) {
        holidayCount++
        const price = Number(holiday.price || holiday.rate || 47000)
        holidayTotal += price
        const name = holiday.nameZh || holiday.name || '國定連續假期'
        if (!holidayNames.includes(name)) {
          holidayNames.push(name)
        }
        holidayNightsList.push({
          date: dateStr,
          nameZh: name,
          nameEn: holiday.nameEn || holiday.name || name,
          price,
          breakfast: Boolean(holiday.breakfast)
        })
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
    const maxCap = pkg.maxCapacity || activePricing.value.maxCapacity || 18
    const extraGuests = Math.max(0, (guestCount.value || maxCap) - (pkg.includedGuests || maxCap))
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
      holidayNames,
      holidayNightsList,
      baseTotal,
      extraPersonFee: totalExtraFee,
      grandTotal
    }
  })

  const maxCapacity = computed(() => {
    return activePricing.value.exclusivePackage?.maxCapacity || activePricing.value.maxCapacity || 18
  })

  const { basicInfo } = useSiteContent()

  const lineBookingUrl = computed(() => {
    const maxCap = maxCapacity.value
    let msg = `您好，我想洽詢山語Villa包棟預約：`
    if (checkInDate.value && checkOutDate.value) {
      msg += `【入住：${checkInDate.value}】【退房：${checkOutDate.value} (共 ${bookingCalculation.value.nights} 晚)】【人數：${guestCount.value} 人】【預估總額：NT$ ${bookingCalculation.value.grandTotal.toLocaleString()}】`
    } else if (checkInDate.value) {
      msg += `【預計入住：${checkInDate.value}】【人數：${guestCount.value} 人】`
    } else {
      msg = `您好，我想洽詢山語Villa全棟包棟預約：【預計入住日期：】【人數：位（最多${maxCap}人）】`
    }
    const targetLine = basicInfo.value?.lineUrl || basicInfo.value?.lineId
    return buildLineUrl({ lineId: targetLine, text: msg })
  })

  return {
    pricingData: activePricing,
    maxCapacity,
    WEEKDAY_TIERS,
    dynamicWeekdayTiers,
    getWeekdayPrice,
    getWeekdayTier,
    getHolidayForDate,
    isWeekdayDate,
    isWeekendDate,
    bookingCalculation,
    lineBookingUrl,
    fetchPricingSettings
  }
}
