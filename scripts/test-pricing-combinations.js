/**
 * scripts/test-pricing-combinations.js
 * 測試前台月曆點選各類日期與連假組合之價格計算邏輯
 */

import { ref } from 'vue'
import { useBookingPricing, DEFAULT_PRICING, WEEKDAY_TIERS } from '../src/composables/useBookingPricing.js'

let passedCount = 0
let failedCount = 0

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`)
    passedCount++
  } else {
    console.error(`  ✗ FAIL: ${message}`)
    failedCount++
  }
}

console.log('\n=============================================')
console.log('  山語 Villa 月曆點選連假與各組合定價驗證測試')
console.log('=============================================\n')

const checkIn = ref(null)
const checkOut = ref(null)
const guests = ref(18)

const {
  getHolidayForDate,
  isWeekdayDate,
  isWeekendDate,
  bookingCalculation,
  getWeekdayPrice
} = useBookingPricing(checkIn, checkOut, guests)

// --- 測試組 1: 單一連續假期點選檢核 (所有 14 組國定連續假期) ---
console.log('【測試組 1】14 組國定連續假期單日點選與價格檢核')

const holidayTestCases = [
  { date: '2026-12-24', name: '2026 聖誕節連假', price: 47000, breakfast: true },
  { date: '2026-12-31', name: '2026 跨年假期', price: 47000, breakfast: true },
  { date: '2027-01-01', name: '2027 元旦連假', price: 47000, breakfast: true },
  { date: '2027-02-04', name: '2027 農曆春節過年連假', price: 50000, breakfast: false },
  { date: '2027-02-05', name: '2027 農曆春節過年連假', price: 50000, breakfast: false },
  { date: '2027-02-26', name: '2027 和平紀念日連假', price: 38000, breakfast: true },
  { date: '2027-04-02', name: '2027 清明與兒童連假', price: 38000, breakfast: true },
  { date: '2027-04-29', name: '2027 五一勞動節連假', price: 38000, breakfast: true },
  { date: '2027-06-08', name: '2027 端午連假', price: 35000, breakfast: true },
  { date: '2027-09-14', name: '2027 中秋連假', price: 35000, breakfast: true },
  { date: '2027-09-27', name: '2027 教師節連假', price: 35000, breakfast: true },
  { date: '2027-10-08', name: '2027 雙十國慶連假', price: 38000, breakfast: true },
  { date: '2027-10-22', name: '2027 光復節連假', price: 38000, breakfast: true },
  { date: '2027-12-23', name: '2027 聖誕連假', price: 47000, breakfast: true },
  { date: '2027-12-30', name: '2028 跨年元旦連假', price: 47000, breakfast: true }
]

holidayTestCases.forEach(tc => {
  const h = getHolidayForDate(tc.date)
  assert(h !== null, `${tc.date} 必須成功匹配連假`)
  if (h) {
    assert(h.price === tc.price, `${tc.date} 【${h.nameZh}】價格應為 NT$ ${tc.price.toLocaleString()} (實際: NT$ ${h.price})`)
    assert(h.breakfast === tc.breakfast, `${tc.date} 早餐設定應為 ${tc.breakfast} (實際: ${h.breakfast})`)
  }
})

// --- 測試組 2: 一般平日與一般假日單日判定 ---
console.log('\n【測試組 2】平日與一般假日單日點選屬性檢核')

const weekdayDates = ['2026-12-01', '2026-12-02', '2026-12-03'] // 週二~四
weekdayDates.forEach(d => {
  assert(isWeekdayDate(d) === true, `${d} 應判定為平日 (isWeekdayDate = true)`)
  assert(isWeekendDate(d) === false, `${d} 不應判定為假日 (isWeekendDate = false)`)
  assert(getHolidayForDate(d) === null, `${d} 不應有連假`)
})

const weekendDates = ['2026-12-04', '2026-12-05', '2026-12-06'] // 週五~日
weekendDates.forEach(d => {
  assert(isWeekendDate(d) === true, `${d} 應判定為一般假日 (isWeekendDate = true)`)
  assert(isWeekdayDate(d) === false, `${d} 不應判定為平日 (isWeekdayDate = false)`)
  assert(getHolidayForDate(d) === null, `${d} 不應有連假`)
})

// --- 測試組 3: 月曆選取各類區間組合試算 ---
console.log('\n【測試組 3】月曆選取區間組合之價格試算檢核')

// 組合 A: 單晚跨年假期 (2026-12-31 至 2027-01-01)
checkIn.value = '2026-12-31'
checkOut.value = '2027-01-01'
guests.value = 18
let c = bookingCalculation.value
assert(c.nights === 1, '跨年 1 晚: 入住晚數應為 1 晚')
assert(c.holidayNights === 1, '跨年 1 晚: 連假晚數應為 1 晚')
assert(c.holidayTotal === 47000, `跨年 1 晚: 連假金額應為 NT$ 47,000 (實際: ${c.holidayTotal})`)
assert(c.grandTotal === 47000, `跨年 1 晚: 總額應為 NT$ 47,000 (實際: ${c.grandTotal})`)
assert(c.holidayNames.includes('2026 跨年假期'), '跨年 1 晚: holidayNames 應包含 2026 跨年假期')

// 組合 B: 雙晚跨連假 (2026-12-31 至 2027-01-02: 跨年 + 元旦)
checkIn.value = '2026-12-31'
checkOut.value = '2027-01-02'
guests.value = 18
c = bookingCalculation.value
assert(c.nights === 2, '跨年+元旦 2 晚: 入住晚數應為 2 晚')
assert(c.holidayNights === 2, '跨年+元旦 2 晚: 連假晚數應為 2 晚')
assert(c.holidayTotal === 94000, `跨年+元旦 2 晚: 連假金額應為 NT$ 94,000 (實際: ${c.holidayTotal})`)
assert(c.grandTotal === 94000, `跨年+元旦 2 晚: 總額應為 NT$ 94,000 (實際: ${c.grandTotal})`)

// 組合 C: 三晚春節過年連假 (2027-02-04 至 2027-02-07)
checkIn.value = '2027-02-04'
checkOut.value = '2027-02-07'
guests.value = 18
c = bookingCalculation.value
assert(c.nights === 3, '春節連假 3 晚: 入住晚數應為 3 晚')
assert(c.holidayNights === 3, '春節連假 3 晚: 連假晚數應為 3 晚')
assert(c.holidayTotal === 150000, `春節連假 3 晚: 連假金額應為 NT$ 150,000 (實際: ${c.holidayTotal})`)
assert(c.grandTotal === 150000, `春節連假 3 晚: 總額應為 NT$ 150,000 (實際: ${c.grandTotal})`)

// 組合 D: 純一般假日週末 2 晚 (2026-12-04 週五 至 2026-12-06 週日)
checkIn.value = '2026-12-04'
checkOut.value = '2026-12-06'
guests.value = 18
c = bookingCalculation.value
assert(c.nights === 2, '純假日 2 晚: 入住晚數應為 2 晚')
assert(c.weekendNights === 2, '純假日 2 晚: 假日晚數應為 2 晚')
assert(c.holidayNights === 0, '純假日 2 晚: 連假晚數應為 0 晚')
assert(c.grandTotal === 70000, `純假日 2 晚: 總額應為 NT$ 70,000 (實際: ${c.grandTotal})`)

// 組合 E: 純平日 2 晚 - 10人以下 (2026-12-01 週二 至 2026-12-03 週四)
checkIn.value = '2026-12-01'
checkOut.value = '2026-12-03'
guests.value = 10
c = bookingCalculation.value
assert(c.nights === 2, '平日 2 晚(10人): 入住晚數應為 2 晚')
assert(c.weekdayNights === 2, '平日 2 晚(10人): 平日晚數應為 2 晚')
assert(c.weekdayUnitPrice === 20000, `平日 2 晚(10人): 單價應為 20,000 (實際: ${c.weekdayUnitPrice})`)
assert(c.grandTotal === 40000, `平日 2 晚(10人): 總額應為 NT$ 40,000 (實際: ${c.grandTotal})`)

// 組合 F: 純平日 2 晚 - 14人分級 (2026-12-01 至 2026-12-03)
guests.value = 14
c = bookingCalculation.value
assert(c.weekdayUnitPrice === 25000, `平日 2 晚(14人): 單價應為 25,000 (實際: ${c.weekdayUnitPrice})`)
assert(c.grandTotal === 50000, `平日 2 晚(14人): 總額應為 NT$ 50,000 (實際: ${c.grandTotal})`)

// 組合 G: 平日跨一般假日 (2026-12-03 週四 至 2026-12-06 週日, 10人)
checkIn.value = '2026-12-03'
checkOut.value = '2026-12-06'
guests.value = 10
c = bookingCalculation.value
assert(c.nights === 3, '平日跨假日 3 晚: 入住晚數應為 3 晚')
assert(c.weekdayNights === 1, '平日跨假日: 1 晚平日 (週四晚)')
assert(c.weekendNights === 2, '平日跨假日: 2 晚假日 (週五、週六晚)')
// 平日 1 * 20000 + 假日 2 * 35000 = 90000
assert(c.grandTotal === 90000, `平日跨假日: 總額應為 NT$ 90,000 (實際: ${c.grandTotal})`)

// 組合 H: 春節連假跨平日 (2027-02-09 週二 至 2027-02-12 週五, 10人)
// 2027-02-09 (春節連假 $50000), 2027-02-10 (春節連假 $50000), 2027-02-11 (平日週四 $20000)
checkIn.value = '2027-02-09'
checkOut.value = '2027-02-12'
guests.value = 10
c = bookingCalculation.value
assert(c.nights === 3, '春節跨平日: 入住晚數應為 3 晚')
assert(c.holidayNights === 2, `春節跨平日: 應為 2 晚春節連假 (實際: ${c.holidayNights})`)
assert(c.weekdayNights === 1, `春節跨平日: 應為 1 晚平日 (實際: ${c.weekdayNights})`)
assert(c.grandTotal === 120000, `春節跨平日: 總額應為 NT$ 120,000 (實際: ${c.grandTotal})`)

// 組合 I: 單一連假選取 (未選退房時，nights = 0，不噴錯)
checkIn.value = '2026-12-31'
checkOut.value = null
c = bookingCalculation.value
assert(c.nights === 0, '僅選入住日期時，nights 應安全為 0')
assert(c.grandTotal === 0, '僅選入住日期時，grandTotal 應安全為 0')

console.log('\n=============================================')
console.log(`  測試完成: 通過 ${passedCount} 項, 失敗 ${failedCount} 項`)
console.log('=============================================\n')

if (failedCount > 0) {
  process.exit(1)
}
