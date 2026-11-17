import { ref, computed } from 'vue'

export function useAdminCloseCalendar(bookedRanges) {
  const checkInDate = ref(null)
  const checkOutDate = ref(null)

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
      const isBooked = !!block
      
      days.push({
        dateStr,
        dayNum: i,
        isEmpty: false,
        isBooked,
        isManualLock,
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

  const isDateBooked = (dateStr) => {
    const block = findBlockForDate(dateStr)
    return !!block && block.source !== 'MANUAL_LOCK'
  }

  const isCheckOutSelectable = (dateStr) => {
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

  const selectDate = (day) => {
    if (day.isPast) return null
    if (day.isBooked && !day.isManualLock && !isCheckOutSelectable(day.dateStr)) return null
    
    if (!checkInDate.value || (checkInDate.value && checkOutDate.value)) {
      checkInDate.value = day.dateStr
      checkOutDate.value = null
      return `已選擇開始關閉日期：${day.dateStr}，請點選結束日期。`
    } else if (checkInDate.value && !checkOutDate.value) {
      if (day.dateStr <= checkInDate.value) {
        checkInDate.value = day.dateStr
        return `已重設開始關閉日期：${day.dateStr}。`
      } else {
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
          checkInDate.value = day.dateStr
          return `中間有正式訂單無法跨越，已重設為開始日期：${day.dateStr}。`
        } else {
          checkOutDate.value = day.dateStr
          return `已選擇區間：${checkInDate.value} 至 ${checkOutDate.value}，請填寫關閉理由後送出。`
        }
      }
    }
    return null
  }

  const clearSelection = () => {
    checkInDate.value = null
    checkOutDate.value = null
  }

  const selectedNights = computed(() => {
    if (!checkInDate.value || !checkOutDate.value) return 0
    const d1 = new Date(checkInDate.value)
    const d2 = new Date(checkOutDate.value)
    return Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)))
  })

  return {
    currentDate,
    checkInDate,
    checkOutDate,
    isPrevDisabled,
    displayedMonths,
    selectedNights,
    prevMonth,
    nextMonth,
    isCheckOutSelectable,
    selectDate,
    clearSelection
  }
}
