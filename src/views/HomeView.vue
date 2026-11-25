<script setup>
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from '../composables/useI18n'
import { useSiteContent } from '../composables/useSiteContent'
import { useFacilities } from '../composables/useFacilities'
import { useBookingPricing } from '../composables/useBookingPricing'
import { getRooms } from '../services/roomService'
import { 
  Users, 
  Sparkles, 
  Waves, 
  Maximize2, 
  ArrowRight, 
  Flame, 
  Calendar,
  Compass
} from 'lucide-vue-next'
import HeroCarousel from '../components/home/HeroCarousel.vue'
import PhilosophySection from '../components/home/PhilosophySection.vue'
import RoomCarousel from '../components/home/RoomCarousel.vue'
import BookingButton from '../components/common/BookingButton.vue'
import { useMediaAssets } from '../composables/useMediaAssets'

// 首屏外重型組件改採異步非同步載入 (Lazy Async Components)，釋放首屏主執行緒
const AvailabilityCalendar = defineAsyncComponent(() => import('../components/booking/AvailabilityCalendar.vue'))
const ImageGallery = defineAsyncComponent(() => import('../components/common/ImageGallery.vue'))

const { isEn, t, tField } = useI18n()
const { basicInfo: siteData } = useSiteContent()
const { facilities: facilitiesData } = useFacilities()
const { pricingData } = useBookingPricing()
const { heroSlides, fetchMedia } = useMediaAssets()
fetchMedia()

const roomsData = ref([])
onMounted(async () => {
  roomsData.value = await getRooms()
})
</script>

<template>
  <div class="home-page">
    <!-- 1. Hero 首屏沉浸橫幅 (動態輪播動畫) -->
    <section class="hero-section">
      <HeroCarousel :slides="heroSlides" :interval="6000" :pauseOnHover="false">
        <div class="container hero-content">
          <span class="hero-badge">
            <Sparkles :size="14" />
            <span>{{ isEn ? 'EXCLUSIVE MOUNTAIN RETREAT' : '苗栗・全新完工豪宅山莊包棟' }}</span>
          </span>
          <h1 class="hero-title">
            {{ isEn ? siteData.brandNameEn : siteData.brandNameZh }}
          </h1>
          <p class="hero-subtitle">
            {{ isEn ? siteData.sloganEn : siteData.sloganZh }}
          </p>
          <p class="hero-desc">
            {{ isEn 
              ? 'Nestled amid rolling mountain mist, offering 5 private bedrooms, living lounge with KTV, auto-mahjong, smart kitchen, and BBQ patio, crafted for exclusive private retreats of 10, 14, or 18 guests.' 
              : '坐落於山林之間，獨享 5 間獨立客房、客廳KTV、電動麻將桌、智能廚房與庭園烤肉區，專為10人、14人、18人的貴賓打造專屬的慢活包棟時光。' 
            }}
          </p>

          <div class="hero-actions">
            <BookingButton 
              roomTitle="全區尊榮包棟"
              variant="gold"
              :text="t('nav.reserve')"
            />
            <RouterLink to="/rooms" class="btn btn-white">
              <span>{{ t('action.explore') }}</span>
              <ArrowRight :size="16" />
            </RouterLink>
          </div>

          <!-- 快速資訊標籤 -->
          <div class="hero-stats">
            <div class="stat-item">
              <span class="stat-num">5</span>
              <span class="stat-label">{{ isEn ? 'Private Suites' : '間獨立景觀客房' }}</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num">{{ siteData.maxGuests }}</span>
              <span class="stat-label">{{ isEn ? 'Max Guests' : '位專屬包棟上限' }}</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num">100%</span>
              <span class="stat-label">{{ isEn ? 'Private Estate' : '獨門獨院包棟' }}</span>
            </div>
          </div>
        </div>
      </HeroCarousel>
    </section>

    <!-- 2. 品牌哲思簡介與包棟方案 (Philosophy) -->
    <PhilosophySection />

    <!-- 3. 精選 5 大房型導覽 (Suites Preview - 直式卡片輪播) -->
    <section class="section-py rooms-preview-section">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">{{ isEn ? 'SUITES' : '獨立景觀客房' }}</span>
          <h2 class="section-title">{{ isEn ? '5 Distinct Aesthetic Living Spaces' : '五間獨立景觀客房・舒適成境' }}</h2>
          <p class="section-desc">
            {{ isEn 
              ? 'Features 5 comfortable bedrooms across two floors (3 on 1F, 2 on 2F) accommodating up to 18 guests.' 
              : '全館共 5 間獨立客房（1樓三間、2樓兩間），採光明亮清幽，最多容納 18 位貴賓。' 
            }}
          </p>
        </div>

        <!-- 直式卡片輪播：滑鼠移到上方暫停、點擊彈窗詳細介紹 -->
        <RoomCarousel :rooms="roomsData" />

        <div class="section-more-btn">
          <RouterLink to="/rooms" class="btn btn-outline">
            <span>{{ isEn ? 'View All 5 Suites' : '查看 5 間客房完整圖集' }}</span>
            <ArrowRight :size="16" />
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- 4. 園區頂級設施 (Facilities Highlight - 6 格空間介紹，內嵌圖片自動輪播) -->
    <section class="section-py facilities-preview-section">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">{{ isEn ? 'FACILITIES' : '頂級園區空間' }}</span>
          <h2 class="section-title">{{ isEn ? 'Curated Amenities for Unforgettable Moments' : '尊榮設施・打造極致度假儀式感' }}</h2>
          <p class="section-desc">
            {{ isEn 
              ? 'Immerse yourself in our 6 private spaces: living lounge with karaoke, chef kitchen & social bar, tea terrace, garden BBQ, panoramic deck, and private lawn.' 
              : '精心規劃 6 大空間：挑高歡唱客廳、頂級中島吧台、戶外原木品茗茶席、美式庭園烤肉、星空觀景露台與百坪青翠草坪。' 
            }}
          </p>
        </div>

        <div class="facilities-grid">
          <div 
            v-for="(fac, index) in facilitiesData" 
            :key="fac.id" 
            class="fac-card card-luxury"
          >
            <!-- 格內圖片自動輪播 (無按鈕、平滑自動過渡) -->
            <div class="fac-img-box">
              <ImageGallery 
                :images="fac.gallery"
                :fallbackImage="fac.image"
                :alt="tField(fac, 'title')"
                :autoplay="true"
                :autoplayInterval="3600 + (index * 400)"
                :showControls="false"
                :showDots="false"
                :showCounter="false"
              />
            </div>
            <div class="fac-info">
              <span class="fac-tag">0{{ index + 1 }}・{{ isEn ? 'SPACE' : '園區空間' }}</span>
              <h4 class="fac-title">{{ tField(fac, 'title') }}</h4>
              <p class="fac-desc">{{ tField(fac, 'desc') }}</p>
            </div>
          </div>
        </div>

        <div class="section-more-btn">
          <RouterLink to="/facilities" class="btn btn-outline">
            <span>{{ isEn ? 'Explore All 6 Spaces & Amenities' : '查看 6 大空間完整設施圖集' }}</span>
            <ArrowRight :size="16" />
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- 5. 即時房態與線上預約 (Live Availability & Booking) -->
    <section class="section-py home-calendar-section">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">{{ isEn ? 'AVAILABILITY & RESERVATION' : '即時房態與預約' }}</span>
          <h2 class="section-title">{{ isEn ? 'Villa Calendar & Online Rate Estimator' : '全館檔期查詢・線上預約試算' }}</h2>
          <p class="section-desc">
            {{ isEn 
              ? 'Select your check-in and check-out dates to estimate packages. Connect directly with our concierge via official LINE for the latest confirmed availability and exclusive privileges.' 
              : '點選預計入住與退房日期即可即時預估包棟費用；最新空房檔期歡迎透過官方 LINE 洽詢管家確認預約。' 
            }}
          </p>
        </div>

        <AvailabilityCalendar />
      </div>
    </section>

    <!-- 6. 尊榮包棟方案亮點 (Pricing Banner) -->
    <section class="pricing-banner-section">
      <div class="container">
        <div class="pricing-banner-box">
          <div class="pricing-banner-info">
            <span class="badge">{{ isEn ? 'EXCLUSIVE PACKAGE' : '全館尊榮包棟' }}</span>
            <h2 class="pricing-title">{{ isEn ? pricingData.exclusivePackage.titleEn : pricingData.exclusivePackage.titleZh }}</h2>
            <p class="pricing-desc">{{ isEn ? pricingData.exclusivePackage.descEn : pricingData.exclusivePackage.descZh }}</p>
            <div class="price-tags">
              <div class="price-chip">
                <span class="label">{{ isEn ? 'Weekday (Mon - Thu)' : '平日 (週一~週四・含早餐)' }}</span>
                <span class="val">NT$ {{ pricingData.exclusivePackage.weekday.toLocaleString() }} <small>{{ isEn ? 'up' : '起' }}</small></span>
              </div>
              <div class="price-chip highlight">
                <span class="label">{{ isEn ? 'Weekend (Fri - Sun)' : '一般假日 (週五~週日)' }}</span>
                <span class="val">NT$ {{ pricingData.exclusivePackage.weekend.toLocaleString() }} <small>{{ isEn ? '(w/ Breakfast)' : '(3.5萬含早餐)' }}</small></span>
              </div>
            </div>
          </div>
          <div class="pricing-banner-cta">
            <BookingButton 
              roomTitle="全館尊榮包棟"
              variant="gold"
              :text="isEn ? 'Book Exclusive Villa' : '立即洽詢包棟檔期'"
            />
            <RouterLink to="/packages" class="btn btn-outline">
              <span>{{ isEn ? 'View Pricing & Policies' : '查看方案詳細規則' }}</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;

.hero-section {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 4;
  text-align: center;
  max-width: 1200px;
  color: #FFFFFF;
  padding: 7rem 1.5rem 5.5rem;

  @media (max-width: $bp-md) {
    padding: 5.5rem 1rem 4.5rem;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 1rem;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 50px;
    font-size: 0.8rem;
    letter-spacing: 0.15em;
    margin-bottom: 1.5rem;
    backdrop-filter: blur(8px);
    color: #E6D5BE;
  }

  .hero-title {
    font-size: clamp(2.2rem, 5vw, 4rem);
    font-weight: 600;
    color: #FFFFFF;
    margin-bottom: 1rem;
    letter-spacing: 0.08em;
    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  }

  .hero-subtitle {
    font-family: $font-display;
    font-size: clamp(1.1rem, 2.5vw, 1.6rem);
    letter-spacing: 0.18em;
    color: #E6D5BE;
    margin-bottom: 1.25rem;
    text-transform: uppercase;
  }

  .hero-desc {
    font-size: clamp(0.95rem, 1.8vw, 1.15rem);
    line-height: 1.9;
    color: rgba(255, 255, 255, 0.88);
    margin: 0 auto 2.5rem;
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    justify-content: center;
    margin-bottom: 3.5rem;
  }
}

.hero-stats {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 30, 31, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 1rem 2rem;
  border-radius: 6px;
  gap: 2rem;

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    .stat-num {
      font-family: $font-display;
      font-size: 1.75rem;
      font-weight: 700;
      color: #E6D5BE;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.78rem;
      color: rgba(255, 255, 255, 0.75);
      margin-top: 4px;
    }
  }

  .stat-divider {
    width: 1px;
    height: 28px;
    background: rgba(255, 255, 255, 0.2);
  }
}

// Rooms Preview Section
.section-more-btn {
  text-align: center;
  margin-top: 3.5rem;
}

// Facilities Preview (6 格空間導覽)
.facilities-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: $bp-sm) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: $bp-lg) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.fac-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.35s ease, box-shadow 0.35s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
  }

  .fac-img-box {
    width: 100%;
    overflow: hidden;
    background: #111;

    :deep(.gallery-main-frame) {
      height: 240px;
      border-radius: 0;
      box-shadow: none;

      @media (max-width: $bp-sm) {
        height: 210px;
      }
    }
  }

  .fac-info {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    flex: 1;

    .fac-tag {
      font-size: 0.74rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      color: var(--gold-primary);
      text-transform: uppercase;
      margin-bottom: 0.45rem;
      display: inline-block;
    }

    .fac-title {
      font-size: 1.18rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.65rem;
      line-height: 1.4;
    }

    .fac-desc {
      font-size: 0.88rem;
      color: var(--text-sub);
      line-height: 1.75;
      flex: 1;
    }
  }
}

// Pricing Banner
.pricing-banner-section {
  padding: 2rem 0 5rem;
}

.pricing-banner-box {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  box-shadow: var(--shadow-card);

  @media (min-width: $bp-lg) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 4rem 3.5rem;
  }

  .pricing-banner-info {
    max-width: 680px;

    .pricing-title {
      font-size: 2rem;
      margin: 0.8rem 0;
    }

    .pricing-desc {
      font-size: 0.95rem;
      color: var(--text-sub);
      margin-bottom: 1.5rem;
    }

    .price-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;

      .price-chip {
        display: flex;
        flex-direction: column;
        background: var(--bg-primary);
        padding: 0.6rem 1.2rem;
        border-radius: 4px;
        border: 1px solid var(--border-color);

        .label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .val {
          font-family: $font-display;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        &.highlight {
          border-color: var(--gold-primary);
          .val {
            color: var(--gold-primary);
          }
        }
      }
    }
  }

  .pricing-banner-cta {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex-shrink: 0;

    .btn {
      width: 100%;
      min-width: 220px;
    }
  }
}
</style>
