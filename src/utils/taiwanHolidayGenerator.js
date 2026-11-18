/**
 * 台灣行政院人事行政總處 (DGPA) 政府辦公日曆表連續假期推算工具
 * 
 * 整合山語 Villa 專屬商業定價規則：
 * 1. 國定連續假期一律自「假日前一天」開始起算專案價。
 * 2. 農曆過年/春節期間：預設專案價 60,000 元，且「不提供早餐」。
 * 3. 跨年元旦假期：預設專案價 47,000 元，提供早餐。
 * 4. 一般國定連續假期（228、清明、勞動節、端午、中秋、國慶）：預設專案價 38,000 元，提供早餐。
 */

// 輔助函式：日期往前推一天 (YYYY-MM-DD)
const getPreviousDay = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() - 1)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * 政府公告官方放假區間資料庫 (離線防護與標準行事曆)
 * officialStart: 政府公告放假第一天
 * officialEnd: 政府公告連假最後一天
 */
const TAIWAN_GOV_HOLIDAYS_MAP = {
  2026: [
    {
      nameZh: '2026 跨年連假',
      nameEn: 'New Year Countdown',
      officialStart: '2026-12-31',
      officialEnd: '2027-01-03',
      defaultPrice: 47000,
      hasBreakfast: true,
      noteZh: '跨年夜起算含早餐'
    }
  ],
  2027: [
    {
      nameZh: '2027 元旦連假',
      nameEn: 'New Year Holiday',
      officialStart: '2027-01-01',
      officialEnd: '2027-01-03',
      defaultPrice: 47000,
      hasBreakfast: true,
      noteZh: '一律自前一天起算含早餐'
    },
    {
      nameZh: '2027 農曆春節過年連假',
      nameEn: 'Lunar New Year',
      officialStart: '2027-02-05', // 小年夜
      officialEnd: '2027-02-14', // 初七
      defaultPrice: 60000,
      hasBreakfast: false, // 業主特殊規範：過年不提供早餐
      noteZh: '春節包棟專案，不提供早餐'
    },
    {
      nameZh: '2027 和平紀念日連假',
      nameEn: '228 Memorial Day',
      officialStart: '2027-02-27',
      officialEnd: '2027-03-01',
      defaultPrice: 38000,
      hasBreakfast: true,
      noteZh: '一律自前一天起算含早餐'
    },
    {
      nameZh: '2027 清明與兒童節連假',
      nameEn: 'Tomb Sweeping Festival',
      officialStart: '2027-04-03',
      officialEnd: '2027-04-06',
      defaultPrice: 38000,
      hasBreakfast: true,
      noteZh: '一律自前一天起算含早餐'
    },
    {
      nameZh: '2027 五一勞動節連假',
      nameEn: 'Labor Day',
      officialStart: '2027-04-30',
      officialEnd: '2027-05-02',
      defaultPrice: 38000,
      hasBreakfast: true,
      noteZh: '一律自前一天起算含早餐'
    },
    {
      nameZh: '2027 端午連假',
      nameEn: 'Dragon Boat Festival',
      officialStart: '2027-06-09',
      officialEnd: '2027-06-11',
      defaultPrice: 35000,
      hasBreakfast: true,
      noteZh: '一律自前一天起算含早餐'
    },
    {
      nameZh: '2027 中秋連假',
      nameEn: 'Mid-Autumn Festival',
      officialStart: '2027-09-15',
      officialEnd: '2027-09-17',
      defaultPrice: 35000,
      hasBreakfast: true,
      noteZh: '一律自前一天起算含早餐'
    },
    {
      nameZh: '2027 國慶日連假',
      nameEn: 'National Day',
      officialStart: '2027-10-09',
      officialEnd: '2027-10-11',
      defaultPrice: 38000,
      hasBreakfast: true,
      noteZh: '一律自前一天起算含早餐'
    },
    {
      nameZh: '2027 跨年元旦專案',
      nameEn: '2027-2028 New Year Countdown',
      officialStart: '2027-12-31',
      officialEnd: '2028-01-02',
      defaultPrice: 47000,
      hasBreakfast: true,
      noteZh: '跨年夜起算含早餐'
    }
  ],
  2028: [
    {
      nameZh: '2028 元旦連假',
      nameEn: 'New Year Holiday',
      officialStart: '2028-01-01',
      officialEnd: '2028-01-03',
      defaultPrice: 47000,
      hasBreakfast: true,
      noteZh: '一律自前一天起算含早餐'
    },
    {
      nameZh: '2028 農曆春節過年連假',
      nameEn: 'Lunar New Year',
      officialStart: '2028-01-25',
      officialEnd: '2028-02-02',
      defaultPrice: 60000,
      hasBreakfast: false,
      noteZh: '春節包棟專案，不提供早餐'
    },
    {
      nameZh: '2028 和平紀念日連假',
      nameEn: '228 Memorial Day',
      officialStart: '2028-02-26',
      officialEnd: '2028-02-28',
      defaultPrice: 38000,
      hasBreakfast: true,
      noteZh: '一律自前一天起算含早餐'
    },
    {
      nameZh: '2028 清明與兒童節連假',
      nameEn: 'Tomb Sweeping Festival',
      officialStart: '2028-04-01',
      officialEnd: '2028-04-05',
      defaultPrice: 38000,
      hasBreakfast: true,
      noteZh: '一律自前一天起算含早餐'
    },
    {
      nameZh: '2028 端午連假',
      nameEn: 'Dragon Boat Festival',
      officialStart: '2028-05-27',
      officialEnd: '2028-05-29',
      defaultPrice: 38000,
      hasBreakfast: true,
      noteZh: '一律自前一天起算含早餐'
    },
    {
      nameZh: '2028 中秋連假',
      nameEn: 'Mid-Autumn Festival',
      officialStart: '2028-10-01',
      officialEnd: '2028-10-03',
      defaultPrice: 38000,
      hasBreakfast: true,
      noteZh: '一律自前一天起算含早餐'
    },
    {
      nameZh: '2028 國慶日連假',
      nameEn: 'National Day',
      officialStart: '2028-10-07',
      officialEnd: '2028-10-10',
      defaultPrice: 38000,
      hasBreakfast: true,
      noteZh: '一律自前一天起算含早餐'
    }
  ]
}

/**
 * 依年份產生套用「假日前一天起算」之山語 Villa 連假專案清單
 * @param {number} year - 年份 (例如 2026, 2027, 2028)
 * @returns {Array} 連假清單
 */
export function generateVillaHolidays(year = 2027) {
  const targetHolidays = TAIWAN_GOV_HOLIDAYS_MAP[year] || TAIWAN_GOV_HOLIDAYS_MAP[2027]
  
  return targetHolidays.map((item, index) => {
    // 依山語規範：一律自國定假日前一天開始起算連假房價
    // 若本來就是跨年夜 (12-31)，則維持 12-31 入住
    const startDate = item.officialStart.endsWith('-12-31') 
      ? item.officialStart 
      : getPreviousDay(item.officialStart)

    return {
      id: `h-gov-${year}-${index + 1}`,
      nameZh: item.nameZh,
      nameEn: item.nameEn,
      startDate: startDate,
      endDate: item.officialEnd,
      price: item.defaultPrice,
      hasBreakfast: item.hasBreakfast,
      noteZh: item.noteZh
    }
  })
}

/**
 * 取得支援一鍵匯入的年份選項
 */
export function getSupportedHolidayYears() {
  return [
    { year: 2027, label: '2027 年度 (最新建議)' },
    { year: 2026, label: '2026 年度 (過渡/回推)' },
    { year: 2028, label: '2028 年度 (遠期規劃)' }
  ]
}
