import { ref, computed } from 'vue'
import defaultHeroSlides from '../data/hero-slides.json'

const heroSlides = ref([...defaultHeroSlides])
const roomMedia = ref([])
const facilityMedia = ref([])
const isLoaded = ref(false)
const isLoading = ref(false)

export function useMediaAssets() {
  const fetchMedia = async (force = false) => {
    if (isLoaded.value && !force) return

    isLoading.value = true
    try {
      const res = await fetch('/api/media')
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          if (Array.isArray(data.hero) && data.hero.length > 0) {
            heroSlides.value = data.hero.map((h, i) => ({
              id: h.id || `slide-${i + 1}`,
              image: h.cdnUrl,
              titleZh: h.titleZh,
              titleEn: h.titleEn,
              tagZh: h.tagZh,
              tagEn: h.tagEn,
              alt: h.titleZh
            }))
          }
          if (Array.isArray(data.room)) {
            roomMedia.value = data.room
          }
          if (Array.isArray(data.facility)) {
            facilityMedia.value = data.facility
          }
          isLoaded.value = true
        }
      }
    } catch (err) {
      console.warn('載入動態媒體庫失敗，使用靜態備援:', err)
    } finally {
      isLoading.value = false
    }
  }

  return {
    heroSlides,
    roomMedia,
    facilityMedia,
    isLoading,
    isLoaded,
    fetchMedia
  }
}
