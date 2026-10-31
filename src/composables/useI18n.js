import { ref, computed } from 'vue'

const currentLocale = ref(localStorage.getItem('villa_lang') || 'zh-TW')
const isSwitchingLang = ref(false)

const messages = {
  'zh-TW': {
    brand: {
      name: '山語 Villa',
      sub: '豪宅山莊包棟別墅',
      slogan: '山嵐隱逸・東方極境'
    },
    nav: {
      home: '首頁',
      rooms: '房型導覽',
      facilities: '園區設施',
      packages: '包棟方案',
      rules: '入住須知',
      guide: '周邊景點',
      news: '最新消息',
      reserve: '預約諮詢'
    },
    action: {
      call: '一鍵撥號',
      line: 'LINE 預約諮詢',
      map: '地圖導航',
      explore: '探索山莊',
      details: '查看詳情',
      back: '返回列表',
      bookNow: '立即預約',
      viewMore: '了解更多'
    },
    footer: {
      about: '關於山語',
      aboutText: '隱匿於翠巒疊嶂之間的頂級私邸，以東方極致留白美學與靜謐山林為靈感，為您提供 5 間客房的專屬包棟奢華度假體驗。',
      contact: '聯絡與預約',
      address: '地址',
      phone: '客服專線',
      line: '官方 LINE',
      ig: 'Instagram',
      rights: '版權所有',
      admin: '後台管理'
    },
    theme: {
      light: '晨曦模式',
      dark: '夜景模式'
    },
    calendar: {
      title: '即時空房查詢與包棟預約',
      subtitle: '點選預計入住與退房日期即可即時試算包棟費用',
      checkIn: '入住日期',
      checkOut: '退房日期',
      selectDates: '請於日曆選取預計入住與退房日期',
      selectCheckIn: '請點選入住日期',
      selectCheckOut: '請點選退房日期',
      nights: '晚',
      guests: '入住人數',
      guestCount: '人',
      estimatedTotal: '預估包棟總金額',
      pricingBreakdown: '費用明細試算',
      weekdayNights: '平日晚數',
      weekendNights: '假日晚數',
      holidayNights: '連假晚數',
      booked: '已預約',
      available: '可預約',
      selected: '已選取',
      inRange: '選取範圍',
      syncNotice: '房態僅供即時參考，最新空房檔期請以官方 LINE 管家確認為準',
      lastSync: '最後同步時間',
      directPerksTitle: '山語 Villa 官方直訂專屬禮遇',
      otaAltTitle: '亦可透過官方合作之 OTA 平台預訂',
      inquireViaLine: '帶入日期透過 LINE 官方立即預約',
      minStayNotice: '包棟預約每次至少為 1 晚',
      contactForCustom: '如需客製拍攝場租或特殊包場，請直接聯繫管家'
    }
  },
  'en-US': {
    brand: {
      name: 'Shan Yu Villa',
      sub: 'Luxury Estate & Private Retreat',
      slogan: 'Oriental Serenity & Mountain Luxury'
    },
    nav: {
      home: 'Home',
      rooms: 'Suites',
      facilities: 'Facilities',
      packages: 'Packages',
      rules: 'Guidelines & FAQ',
      guide: 'Travel Guide',
      news: 'News',
      reserve: 'Inquiry'
    },
    action: {
      call: 'Call Us',
      line: 'LINE Inquiry',
      map: 'Get Directions',
      explore: 'Explore Estate',
      details: 'Suite Details',
      back: 'Back to List',
      bookNow: 'Book Now',
      viewMore: 'Discover More'
    },
    footer: {
      about: 'About Shan Yu',
      aboutText: 'A private mountain sanctuary nestled in tranquil greenery, crafted with oriental minimalist aesthetics and pure serenity for exclusive private villa experiences.',
      contact: 'Contact & Booking',
      address: 'Address',
      phone: 'Phone',
      line: 'Official LINE',
      ig: 'Instagram',
      rights: 'All rights reserved.',
      admin: 'CMS Portal'
    },
    theme: {
      light: 'Dawn Mode',
      dark: 'Night Mode'
    },
    calendar: {
      title: 'Live Availability & Direct Reservation',
      subtitle: 'Select your dates to estimate your villa stay rates',
      checkIn: 'Check-in',
      checkOut: 'Check-out',
      selectDates: 'Please select your check-in & check-out dates',
      selectCheckIn: 'Select check-in date',
      selectCheckOut: 'Select check-out date',
      nights: 'night(s)',
      guests: 'Guests',
      guestCount: 'guests',
      estimatedTotal: 'Estimated Total',
      pricingBreakdown: 'Rate Calculation',
      weekdayNights: 'Weekday Nights',
      weekendNights: 'Weekend Nights',
      holidayNights: 'Holiday Nights',
      booked: 'Booked',
      available: 'Available',
      selected: 'Selected',
      inRange: 'In Range',
      syncNotice: 'Calendar availability is for reference; please confirm final dates with our butler via official LINE.',
      lastSync: 'Last synced',
      directPerksTitle: 'Direct Booking Exclusive Privileges',
      otaAltTitle: 'Or Book via Our Official OTA Partners',
      inquireViaLine: 'Reserve Dates via Official LINE',
      minStayNotice: 'Minimum stay is 1 night for exclusive villa retreat',
      contactForCustom: 'For photo shoots or corporate events, please contact our concierge'
    }
  }
}

export function useI18n() {
  const setLocale = (lang) => {
    if (currentLocale.value === lang || isSwitchingLang.value) return
    isSwitchingLang.value = true
    setTimeout(() => {
      currentLocale.value = lang
      localStorage.setItem('villa_lang', lang)
      setTimeout(() => {
        isSwitchingLang.value = false
      }, 50)
    }, 200)
  }

  const toggleLocale = () => {
    setLocale(currentLocale.value === 'zh-TW' ? 'en-US' : 'zh-TW')
  }

  const t = (path) => {
    const keys = path.split('.')
    let current = messages[currentLocale.value] || messages['zh-TW']
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key]
      } else {
        return path
      }
    }
    return current
  }

  // 輔助函式：自 JSON 資料物件中取得當前語言欄位（支援 titleZh / titleEn 或 title_zh / title_en）
  const tField = (obj, field) => {
    if (!obj) return ''
    const isEn = currentLocale.value === 'en-US'
    if (isEn) {
      const enKey = `${field}En`
      const enKeyUnder = `${field}_en`
      return obj[enKey] || obj[enKeyUnder] || obj[field] || ''
    } else {
      const zhKey = `${field}Zh`
      const zhKeyUnder = `${field}_zh`
      return obj[zhKey] || obj[zhKeyUnder] || obj[field] || ''
    }
  }

  return {
    locale: currentLocale,
    isEn: computed(() => currentLocale.value === 'en-US'),
    isSwitchingLang,
    setLocale,
    toggleLocale,
    t,
    tField
  }
}
