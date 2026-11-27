import { ref } from 'vue'
import { useBookingPricing, dynamicWeekdayTiers, getWeekdayPrice, getWeekdayTier, fetchPricingSettings } from '../src/composables/useBookingPricing.js'

console.log('--- 驗證動態階梯門檻與人數上限 ---')

const checkIn = ref('2026-12-01')
const checkOut = ref('2026-12-02')
const guests = ref(10)

const { maxCapacity, bookingCalculation } = useBookingPricing(checkIn, checkOut, guests)

// 預設檢查
console.log('1. 預設 maxCapacity:', maxCapacity.value)
console.log('2. 預設動態階梯:', JSON.stringify(dynamicWeekdayTiers.value))
if (maxCapacity.value !== 18) throw new Error('預設 maxCapacity 應為 18')
if (dynamicWeekdayTiers.value[0].max !== 10) throw new Error('階梯 1 預設上限應為 10')
if (dynamicWeekdayTiers.value[1].max !== 14) throw new Error('階梯 2 預設上限應為 14')
if (dynamicWeekdayTiers.value[2].max !== 18) throw new Error('階梯 3 預設上限應為 18')

// 模擬自訂門檻 (例如: 階梯一 8人、階梯二 12人、全區上限 20人)
const pricing = await fetchPricingSettings()
pricing.weekdayTier1MaxGuests = 8
pricing.weekdayTier2MaxGuests = 12
pricing.exclusivePackage.maxCapacity = 20

console.log('\n--- 調整自訂門檻後 ---')
console.log('1. 新 maxCapacity:', maxCapacity.value)
console.log('2. 新動態階梯:', JSON.stringify(dynamicWeekdayTiers.value))

if (maxCapacity.value !== 20) throw new Error('maxCapacity 應反映為 20')
if (dynamicWeekdayTiers.value[0].max !== 8) throw new Error('階梯 1 上限應為 8')
if (dynamicWeekdayTiers.value[0].labelZh !== '8人以下') throw new Error('階梯 1 標籤應為 8人以下')
if (dynamicWeekdayTiers.value[1].min !== 9 || dynamicWeekdayTiers.value[1].max !== 12) throw new Error('階梯 2 應為 9~12人')
if (dynamicWeekdayTiers.value[1].labelZh !== '9-12人') throw new Error('階梯 2 標籤應為 9-12人')
if (dynamicWeekdayTiers.value[2].min !== 13 || dynamicWeekdayTiers.value[2].max !== 20) throw new Error('階梯 3 應為 13~20人')
if (dynamicWeekdayTiers.value[2].labelZh !== '13-20人') throw new Error('階梯 3 標籤應為 13-20人')

// 測試各人數落入的價格
if (getWeekdayPrice(8) !== 20000) throw new Error('8人應為第一階梯價 20000')
if (getWeekdayPrice(9) !== 25000) throw new Error('9人應為第二階梯價 25000')
if (getWeekdayPrice(12) !== 25000) throw new Error('12人應為第二階梯價 25000')
if (getWeekdayPrice(13) !== 30000) throw new Error('13人應為第三階梯價 30000')
if (getWeekdayPrice(20) !== 30000) throw new Error('20人應為第三階梯價 30000')

console.log('✅ 所有動態階梯門檻與人數上限測試完全通過！')
