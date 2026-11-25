import { ref, computed } from 'vue'

export function useAdminCloseCalendar(bookedRanges) {
  const selectedDates = ref([]) // 多選日期陣列 ['YYYY-MM-DD', ...]
  const selectionMode = ref('individual') // 'individual' | 'range'
  const rangeStart = ref(null) // 'YYYY-MM-DD' 連續區間起始日
  const hoverDate = ref(null) // 'YYYY-MM-DD' 區間滑鼠預覽
  const lastClickedDate = ref(null) // 上一次點選的日期 (供 Shift 連選)

  const today = new Date()
  const minBookingDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const currentDate = ref(new Date(today.getFullYear(), today.getMonth(), 1))

  const isPrevDisabled = computed(() => {
    const m1 = currentDate.value
    return m1.getFullYear() < today.getFullYear() || 
      (m1.getFullYear() === today.getFullYear() && m1.getMonth() <= today.getMonth())
  })

  const prevMonth = () => {
    if (isPrevDisabled.value) return
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
  }

  const nextMonth = () => {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
  }

  const formatDate = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const findBlockForDate = (dateStr) => {
    if (!bookedRanges.value || !bookedRanges.value.length) return null
    return bookedRanges.value.find(range => {
      const s = range.startDate || range.start_date || range.check_in
      const e = range.endDate || range.end_date || range.check_out
      return dateStr >= s && dateStr < e
    })
  }

  const generateMonthDays = (year, month) => {
    const firstDayIndex = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []
    
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({
        dateStr: `empty-${year}-${month}-${i}`,
        dayNum: '',
        isEmpty: true,
        isBooked: false,
        isManualLock: false,
        isPast: true
      })
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      const dateStr = formatDate(d)
      const block = findBlockForDate(dateStr)
      const isManualLock = block && block.source === 'MANUAL_LOCK'
      const isDirectBooking = block && block.source === 'DIRECT_BOOKING'
      const isBooked = !!block
      
      days.push({
        dateStr,
        dayNum: i,
        isEmpty: false,
        isBooked,
        isManualLock,
        isDirectBooking,
        blockInfo: block,
        isPast: d < minBookingDate
      })
    }
    
    return days
  }

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

  // 區間日期輔助運算 (回傳兩日期之間所有可選的 YYYY-MM-DD)
  const getDatesBetween = (startStr, endStr) => {
    const [s, e] = startStr <= endStr ? [startStr, endStr] : [endStr, startStr]
    const list = []
    const cur = new Date(s + 'T00:00:00Z')
    const end = new Date(e + 'T00:00:00Z')
    while (cur <= end) {
      const y = cur.getUTCFullYear()
      const m = String(cur.getUTCMonth() + 1).padStart(2, '0')
      const d = String(cur.getUTCDate()).padStart(2, '0')
      const curStr = `${y}-${m}-${d}`
      const block = findBlockForDate(curStr)
      if (!block && cur >= minBookingDate) {
        list.push(curStr)
      }
      cur.setUTCDate(cur.getUTCDate() + 1)
    }
    return list
  }

  // 點選日期切換：支援個別單選/多選、Shift+點選區間、以及連續區間選取模式
  const selectDate = (day, isShiftKey = false) => {
    if (day.isPast) return null
    if (day.isBooked && !day.isManualLock) return null

    // 情況 1：Shift + 點選，或處於「連續區間」選取模式且已有起始日
    const shouldDoRange = (selectionMode.value === 'range' && rangeStart.value) || 
      (isShiftKey && lastClickedDate.value && lastClickedDate.value !== day.dateStr)

    if (shouldDoRange) {
      const baseStart = (selectionMode.value === 'range' && rangeStart.value) 
        ? rangeStart.value 
        : lastClickedDate.value

      const rangeDates = getDatesBetween(baseStart, day.dateStr)
      selectedDates.value = Array.from(new Set([...selectedDates.value, ...rangeDates])).sort()
      lastClickedDate.value = day.dateStr
      rangeStart.value = null
      hoverDate.value = null
      return `已全選區間【${baseStart} 至 ${day.dateStr}】共 ${rangeDates.length} 天（目前累計已選 ${selectedDates.value.length} 天）。`
    }

    // 情況 2：處於「連續區間」選取模式且無起始日 -> 設定為起始日
    if (selectionMode.value === 'range') {
      rangeStart.value = day.dateStr
      lastClickedDate.value = day.dateStr
      if (!selectedDates.value.includes(day.dateStr)) {
        selectedDates.value = [...selectedDates.value, day.dateStr].sort()
      }
      return `已設定區間起始日：${day.dateStr}，請點選結束日以包下整段區間。`
    }

    // 情況 3：個別點選模式 (單選 / 多選切換)
    lastClickedDate.value = day.dateStr
    const idx = selectedDates.value.indexOf(day.dateStr)
    if (idx !== -1) {
      selectedDates.value = selectedDates.value.filter(d => d !== day.dateStr)
      return `已取消選取 ${day.dateStr}（目前已選 ${selectedDates.value.length} 天）。`
    } else {
      selectedDates.value = [...selectedDates.value, day.dateStr].sort()
      return `已選取關閉日期：${day.dateStr}（目前已選 ${selectedDates.value.length} 天）。`
    }
  }

  const setHoverDate = (dateStr) => {
    if (selectionMode.value === 'range' && rangeStart.value) {
      hoverDate.value = dateStr
    }
  }

  const clearHoverDate = () => {
    hoverDate.value = null
  }

  const setSelectionMode = (mode) => {
    selectionMode.value = mode
    rangeStart.value = null
    hoverDate.value = null
  }

  const removeDate = (dateStr) => {
    selectedDates.value = selectedDates.value.filter(d => d !== dateStr)
  }

  const clearSelection = () => {
    selectedDates.value = []
    rangeStart.value = null
    hoverDate.value = null
  }

  return {
    currentDate,
    selectedDates,
    selectionMode,
    rangeStart,
    hoverDate,
    isPrevDisabled,
    displayedMonths,
    prevMonth,
    nextMonth,
    selectDate,
    setHoverDate,
    clearHoverDate,
    setSelectionMode,
    removeDate,
    clearSelection
  }
}
