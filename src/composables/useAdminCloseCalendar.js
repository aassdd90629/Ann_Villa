import { ref, computed } from 'vue'

export function useAdminCloseCalendar(bookedRanges) {
  const selectedDates = ref([]) // 多選日期陣列 ['YYYY-MM-DD', ...]

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
      const isAirbnb = block && block.source === 'AIRBNB'
      const isDirectBooking = block && block.source === 'DIRECT_BOOKING'
      const isBooked = !!block
      
      days.push({
        dateStr,
        dayNum: i,
        isEmpty: false,
        isBooked,
        isManualLock,
        isAirbnb,
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

  // 多選切換：點選加入選取，再次點選則取消選取，支援單選或多選多天
  const selectDate = (day) => {
    if (day.isPast) return null
    if (day.isBooked && !day.isManualLock) return null
    
    const idx = selectedDates.value.indexOf(day.dateStr)
    if (idx !== -1) {
      selectedDates.value = selectedDates.value.filter(d => d !== day.dateStr)
      return `已取消選取 ${day.dateStr}（目前已選 ${selectedDates.value.length} 天）。`
    } else {
      selectedDates.value = [...selectedDates.value, day.dateStr].sort()
      return `已選取關閉日期：${day.dateStr}（目前已選 ${selectedDates.value.length} 天）。`
    }
  }

  const removeDate = (dateStr) => {
    selectedDates.value = selectedDates.value.filter(d => d !== dateStr)
  }

  const clearSelection = () => {
    selectedDates.value = []
  }

  return {
    currentDate,
    selectedDates,
    isPrevDisabled,
    displayedMonths,
    prevMonth,
    nextMonth,
    selectDate,
    removeDate,
    clearSelection
  }
}
