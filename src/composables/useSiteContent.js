import { ref, computed } from 'vue'

// 全域共用響應式單例 (避免多次非必要重複請求，100% 透過 /api/content 資料庫驅動)
const basicInfo = ref({
  brandNameZh: '山語 Villa 豪宅山莊包棟別墅',
  brandNameEn: 'Shan Yu Villa Luxury Estate',
  shortNameZh: '山語 Villa',
  shortNameEn: 'Shan Yu Villa',
  sloganZh: '山嵐隱逸・慢活時光',
  sloganEn: 'Oriental Serenity & Mountain Sanctuary',
  introZh: '全新完工山語 Villa 豪宅山莊坐落於山林之間，擁有寬敞舒適的空間與開闊山景視野。適合家庭旅遊、朋友聚會及想遠離城市喧囂、享受山林悠閒慢生活的旅人。',
  introEn: 'Brand-new Shan Yu Villa luxury estate is nestled amid tranquil mountain forests with expansive panoramic views. Perfect for families, friends, and travelers seeking slow mountain living.',
  bankName: '台灣銀行',
  bankCode: '004',
  bankAccount: '123-456-789012 (展示模擬帳號，請勿真實匯款)',
  bankHolder: '山語 Villa',
  phone: '0909-557-400',
  lineId: '@209yrich',
  lineUrl: 'https://line.me/R/ti/p/@209yrich',
  lineTemplateMsg: '您好，我想洽詢山語Villa全棟包棟預約：【預計入住日期：】【人數：位（最多18人）】',
  instagram: 'villa_forfun001',
  instagramUrl: 'https://www.instagram.com/villa_forfun001/',
  airbnbUrl: 'https://www.airbnb.com.tw/rooms/1785941296784004528?source_impression_id=p3_1792732762_P3vdCM0bn-RsnLPh',
  addressZh: '369苗栗縣卓蘭鎮景山里8鄰127-10號',
  addressEn: 'No. 127-10, Neighborhood 8, Jingshan Vil., Zhuolan Township, Miaoli County 369, Taiwan',
  googleMapUrl: 'https://maps.app.goo.gl/VhxGV5h3uJwU14mG9',
  checkInTime: '15:00',
  checkOutTime: '11:00',
  depositAmount: 3000,
  maxGuests: 18,
  roomCount: 5,
  licenseNumber: '苗栗縣合法民宿登記'
})

const rulesInfo = ref({
  checkInRulesZh: [
    '入住時間：當日下午 15:00 以後。如超過 18:00 以後入住，請於訂房時備註或是打電話告知，逾時恕不保留客房亦不退費。',
    '退房時間：隔日上午 11:00 以前。退房時務必交還房門鑰匙；離開房間時請先關冷氣、電源。恕不延長退房，延長一小時另酌收 NT$ 2,000 元費用。',
    '現場押金：入住當天現場需收取押金 NT$ 3,000 元，退房時經檢查無損壞、環境整理乾淨歸位，將全額退還，敬請放心。',
    '寵物規範：全館請勿攜帶寵物入內，不便之處敬請見諒。',
    '嚴禁爆竹：園區內全面禁止施放煙火、放鞭炮及仙女棒，以維護山林與公共安全。',
    '人數限制：入住當天請依約定人數入住，整棟樓最多容納 18 個人，現場無法提供加床服務。',
    '全面禁菸：本民宿嚴格適用菸害防制法，室內（包含公共空間、走廊與所有房間）全面禁止吸菸（包含傳統紙菸與電子菸）。',
    '違法行為：屋內嚴禁轟趴、吸毒、嚼檳榔、酗酒、聚賭等任何違法性行為，若經發現一律報警處理並取消住宿且不予退費。',
    '續住備品：續住之房客，民宿不主動進房更換毛巾或浴巾，如需更換備品請主動告知管家。',
    '節能安全：請勿在客房內使用非民宿提供之瓦斯爐或電磁爐等危險物品，並請隨手關燈及節約用水。',
    '保管貴重：個人貴重物品請自行妥善保管，如有遺失恕不負責，敬請見諒。',
    '物品賠償：請愛惜並勿破壞屋內傢俱與設施，退房時若經發現損壞或遺失，需照價賠償。',
    '慢生活理念：山語 Villa 豪宅山莊是個適合慢生活的清幽民宿，期盼各位貴賓能好好放鬆享受山裡的林靜和美好，並歡迎您常回來看我們。'
  ],
  checkInRulesEn: [
    'Check-in begins at 15:00. For arrivals after 18:00, please notify us in advance. Failure to notify may result in reservation cancellation without refund.',
    'Check-out is by 11:00 AM. Please return all keys and turn off AC/power upon departure. Late checkout is subject to an additional fee of NT$ 2,000 per hour.',
    'Security Deposit: A refundable deposit of NT$ 3,000 is collected upon arrival and will be fully returned upon checkout inspection and tidy return.',
    'Pets Policy: Strictly no pets allowed on the premises. Thank you for your understanding.',
    'Fireworks Policy: Fireworks, firecrackers, and sparklers are strictly prohibited on property to ensure safety.',
    'Guest Capacity: Strict maximum capacity of 18 guests. No extra bed service is available.',
    'Non-Smoking: All indoor areas (including guest rooms and shared spaces) are strictly non-smoking (including e-cigarettes / vapes).',
    'Illegal Activities: Drug use, illegal gatherings, betel nuts, excessive drinking, or gambling are strictly prohibited and will be reported to the police immediately.',
    'Multi-Night Stays: For eco-friendly hospitality, we do not automatically replace towels during consecutive nights. Please notify our butler if replacement is needed.',
    'Safety & Energy: Portable gas stoves or high-power induction cookers are not permitted inside guest rooms. Please turn off appliances when leaving.',
    'Valuables: Please keep personal valuables secure at all times. Shan Yu Villa is not liable for lost items.',
    'Property Damage: Please care for our furniture and fixtures. Any damage or loss will be charged at replacement cost.',
    'Slow Living: Shan Yu Villa is designed for tranquility and slow living. Relax, breathe in the fresh mountain air, and enjoy your stay.'
  ],
  extraGuestsZh: {
    title: '容納人數與床位規範',
    content: '整棟樓總共 5 間房間，最多容納 18 位貴賓，全館床位已達舒適上限，恕無法提供加床或超額入住服務。請於預訂時確實填寫入住總人數。'
  },
  extraGuestsEn: {
    title: 'Capacity & Bedding Policy',
    content: 'Shan Yu Villa features 5 bedrooms accommodating up to 18 guests maximum. Extra beds are not available. Please confirm exact guest counts upon reservation.'
  },
  refundPolicyZh: {
    title: '山語Villa豪宅山莊退費規定',
    items: [
      '入住前15天取消，訂金可全額退款。',
      '入住前8-14天內取消，訂金可退還一半。',
      '入住前7 天內取消，訂金則不退還。'
    ]
  },
  refundPolicyEn: {
    title: 'Shan Yu Villa Cancellation & Refund Policy',
    items: [
      'Cancellations made 15 days or more prior to check-in: 100% full deposit refund.',
      'Cancellations made 8–14 days prior to check-in: 50% deposit refund.',
      'Cancellations made within 7 days prior to check-in: Deposit is non-refundable.'
    ]
  }
})

const channelsInfo = ref({
  directBooking: {
    enabled: true,
    lineUrl: 'https://line.me/R/ti/p/@209yrich',
    lineId: '@209yrich',
    phone: '0909-557-400',
    perksZh: [
      '官網直訂免收平台手續費，享有最即時彈性檔期協調',
      '享有全棟 5 間房完整私密包棟使用權',
      '免費使用電動麻將桌、KTV歡唱、庭園烤肉爐與智能廚房',
      '全天候 24 小時專屬管家貼心諮詢支援'
    ],
    perksEn: [
      'Direct booking with zero third-party commission and flexible scheduling',
      'Exclusive private access to all 5 guest suites across two floors',
      'Complimentary access to auto-mahjong, KTV, BBQ grill & smart kitchen',
      '24-Hour dedicated concierge & butler support'
    ]
  },
  otaPlatforms: [
    {
      id: 'airbnb',
      name: 'Airbnb',
      badgeZh: '超讚房東嚴選房源',
      badgeEn: 'Superhost Selection',
      taglineZh: '山語 Villa 官方 Airbnb 認證預約頁面',
      taglineEn: 'Official Airbnb Listing for Shan Yu Villa',
      url: 'https://www.airbnb.com.tw/rooms/1785941296784004528?source_impression_id=p3_1792732762_P3vdCM0bn-RsnLPh',
      status: 'active'
    }
  ]
})

const faqList = ref([])
const newsList = ref([])
const isLoaded = ref(false)
const isLoading = ref(false)

export function useSiteContent() {
  const fetchContent = async (force = false) => {
    if (isLoaded.value && !force) return

    isLoading.value = true
    try {
      const res = await fetch('/api/content')
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          if (data.basicInfo) {
            basicInfo.value = {
              ...basicInfo.value,
              ...data.basicInfo
            }
          }
          if (data.rules) {
            rulesInfo.value = {
              ...rulesInfo.value,
              ...data.rules
            }
          }
          if (data.channels) {
            channelsInfo.value = {
              ...channelsInfo.value,
              ...data.channels
            }
          }
          if (Array.isArray(data.faq) && data.faq.length > 0) {
            faqList.value = data.faq
          }
          if (Array.isArray(data.news) && data.news.length > 0) {
            newsList.value = data.news
          }
          isLoaded.value = true
        }
      }
    } catch (err) {
      console.warn('[useSiteContent] 載入動態內容失敗，保持預設狀態:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 自動觸發一次快顯同步
  if (!isLoaded.value && !isLoading.value) {
    fetchContent()
  }

  // 格式化銀行完整匯款字串
  const formattedBankInfo = computed(() => {
    const b = basicInfo.value
    const holderStr = b.bankHolder ? ` (戶名：${b.bankHolder})` : ''
    return `${b.bankName || '台灣銀行'} (${b.bankCode || '004'}) ${b.bankAccount || '123-456-789012'}${holderStr}`
  })

  return {
    basicInfo,
    rulesInfo,
    channelsInfo,
    faqList,
    newsList,
    isLoading,
    isLoaded,
    formattedBankInfo,
    fetchContent
  }
}
