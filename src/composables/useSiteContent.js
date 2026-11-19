import { ref, computed } from 'vue'
import defaultSiteData from '../data/site.json'
import defaultNewsData from '../data/news.json'
import defaultRulesData from '../data/rules.json'

// 全域共用響應式單例 (避免多次非必要重複請求)
const basicInfo = ref({
  bankName: '台灣銀行',
  bankCode: '004',
  bankAccount: '123-456-789012 (展示模擬帳號，請勿真實匯款)',
  bankHolder: '山語 Villa',
  phone: defaultSiteData.phone || '0909-557-400',
  lineId: defaultSiteData.lineId || '@209yrich',
  lineUrl: defaultSiteData.lineUrl || 'https://line.me/R/ti/p/@209yrich',
  checkInTime: defaultSiteData.checkInTime || '15:00',
  checkOutTime: defaultSiteData.checkOutTime || '11:00',
  depositAmount: defaultSiteData.deposit || 3000,
  maxGuests: defaultSiteData.maxGuests || 18
})

const faqList = ref(
  (defaultRulesData.faq || []).map((f, i) => ({
    id: `faq-default-${i + 1}`,
    qZh: f.qZh,
    qEn: f.qEn,
    aZh: f.aZh,
    aEn: f.aEn,
    sortOrder: i + 1
  }))
)

const newsList = ref([...defaultNewsData])
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
      console.warn('載入動態內容失敗，使用靜態備援:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 格式化銀行完整匯款字串
  const formattedBankInfo = computed(() => {
    const b = basicInfo.value
    const holderStr = b.bankHolder ? ` (戶名：${b.bankHolder})` : ''
    return `${b.bankName || '台灣銀行'} (${b.bankCode || '004'}) ${b.bankAccount || '123-456-789012'}${holderStr}`
  })

  return {
    basicInfo,
    faqList,
    newsList,
    isLoading,
    isLoaded,
    formattedBankInfo,
    fetchContent
  }
}
