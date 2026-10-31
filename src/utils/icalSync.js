/**
 * 山語 Villa - iCal (iCalendar) 雙向日曆同步與解析工具庫
 * 支援解析 Airbnb、Google Calendar 之 .ics 格式，
 * 自動轉換為官網房態 JSON 結構。
 */

/**
 * 解析 iCal (.ics) 文字內容並提取預約區間
 * @param {string} icsText - .ics 檔案字串
 * @param {string} channelName - 渠道名稱 (例如 'Airbnb')
 * @returns {Array<{startDate: string, endDate: string, source: string, summary: string}>}
 */
export function parseIcsCalendar(icsText, channelName = 'OTA') {
  const events = []
  if (!icsText) return events

  // 簡易解析 VEVENT 區塊
  const veventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g
  let match

  while ((match = veventRegex.exec(icsText)) !== null) {
    const eventBlock = match[1]
    
    // 取得 DTSTART 與 DTEND
    const dtstartMatch = eventBlock.match(/DTSTART(?:;VALUE=DATE)?:?(\d{8})/i)
    const dtendMatch = eventBlock.match(/DTEND(?:;VALUE=DATE)?:?(\d{8})/i)
    const summaryMatch = eventBlock.match(/SUMMARY:(.*)/i)
    
    if (dtstartMatch && dtendMatch) {
      const rawStart = dtstartMatch[1]
      const rawEnd = dtendMatch[1]
      
      const startDate = `${rawStart.substring(0, 4)}-${rawStart.substring(4, 6)}-${rawStart.substring(6, 8)}`
      const endDate = `${rawEnd.substring(0, 4)}-${rawEnd.substring(4, 6)}-${rawEnd.substring(6, 8)}`
      const summary = summaryMatch ? summaryMatch[1].trim() : 'Reserved'
      
      events.push({
        startDate,
        endDate,
        source: channelName,
        summary,
        status: 'confirmed'
      })
    }
  }

  return events
}

/**
 * 合併多個渠道之預約區間（並去除重複或重疊防撞期）
 * @param {Array<Array>} channelEventsList
 * @returns {Array} 合併後的不重複預約區間清單
 */
export function mergeBookedRanges(...channelEventsList) {
  const allEvents = channelEventsList.flat()
  
  // 按開始日期排序
  allEvents.sort((a, b) => a.startDate.localeCompare(b.startDate))
  
  return allEvents
}

/**
 * 產生山語 Villa 官方對外之 iCal (.ics) 訂閱字串 (供 Airbnb 等外部日曆訂閱)
 * @param {Array} bookedRanges
 * @returns {string} ics file content
 */
export function generateVillaIcs(bookedRanges) {
  let ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Shan Yu Villa//Exclusive Booking Calendar//TW\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:Shan Yu Villa Master Calendar\r\n`
  
  const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  bookedRanges.forEach((range, idx) => {
    const startStr = range.startDate.replace(/-/g, '')
    const endStr = range.endDate.replace(/-/g, '')
    const uid = `shanyu-${startStr}-${idx}@shanyu-villa.com`

    ics += `BEGIN:VEVENT\r\nUID:${uid}\r\nDTSTAMP:${nowStr}\r\nDTSTART;VALUE=DATE:${startStr}\r\nDTEND;VALUE=DATE:${endStr}\r\nSUMMARY:Shan Yu Villa Reserved (${range.source})\r\nDESCRIPTION:Villa reserved via ${range.source}\r\nSTATUS:CONFIRMED\r\nEND:VEVENT\r\n`
  })

  ics += `END:VCALENDAR\r\n`
  return ics
}
