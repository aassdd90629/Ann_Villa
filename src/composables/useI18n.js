import { ref, computed } from 'vue'
import zhTW from '../locales/zh-TW.json'
import enUS from '../locales/en-US.json'

const currentLocale = ref(localStorage.getItem('villa_lang') || 'zh-TW')
const isSwitchingLang = ref(false)

const messages = {
  'zh-TW': zhTW,
  'en-US': enUS
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
    if (!path) return ''
    const keys = path.split('.')
    let current = messages[currentLocale.value] || messages['zh-TW']
    let found = true

    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key]
      } else {
        found = false
        break
      }
    }

    if (found && current !== undefined) {
      return current
    }

    // Fallback 機制：若當前語系缺少 key，回退至繁體中文
    let fallback = messages['zh-TW']
    for (const key of keys) {
      if (fallback && fallback[key] !== undefined) {
        fallback = fallback[key]
      } else {
        return path
      }
    }
    return fallback !== undefined ? fallback : path
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
