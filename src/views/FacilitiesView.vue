<script setup>
import { useI18n } from '../composables/useI18n'
import PageHeader from '../components/common/PageHeader.vue'
import ImageGallery from '../components/common/ImageGallery.vue'
import facilitiesData from '../data/facilities.json'
import siteData from '../data/site.json'
import { CheckCircle, Sparkles } from 'lucide-vue-next'

const { isEn, tField } = useI18n()
</script>

<template>
  <div class="facilities-page">
    <PageHeader 
      :tag="isEn ? 'AMENITIES' : '園區空間'"
      :title="isEn ? 'Estate Facilities & Wellness' : '園區設施與休閒空間'"
      :desc="isEn
        ? 'Spacious grand lounge, professional KTV, auto mahjong, gourmet kitchen & bar, outdoor tea patio, and garden BBQ for an unforgettable luxury mountain retreat.'
        : '挑高奢華大客廳、專業KTV歡唱、電動麻將娛樂、智能中島餐廚、戶外品茗茶席與庭園BBQ烤肉，為您的包棟假期增添無盡奢華與愜意。'"
    />

    <section class="section-py facilities-section">
      <div class="container">
        <div class="facilities-flow">
          <div 
            v-for="(fac, index) in facilitiesData" 
            :key="fac.id" 
            class="fac-item-row"
            :class="{ 'reverse': index % 2 === 1 }"
          >
            <!-- 自動輪播相簿（隱藏左右切換鍵與指示點） -->
            <div class="fac-media-box">
              <ImageGallery 
                :images="fac.gallery"
                :fallbackImage="fac.image"
                :alt="tField(fac, 'title')"
                :autoplay="true"
                :autoplayInterval="4000 + (index * 400)"
                :showControls="false"
                :showDots="false"
                :showCounter="false"
              />
            </div>

            <div class="fac-content-box">
              <span class="fac-num">0{{ index + 1 }}</span>
              <h2 class="fac-title">{{ tField(fac, 'title') }}</h2>
              <p class="fac-desc">{{ tField(fac, 'desc') }}</p>

              <div class="fac-features">
                <div 
                  v-for="(feat, fIdx) in (isEn ? fac.featuresEn : fac.featuresZh)" 
                  :key="fIdx" 
                  class="feat-badge"
                >
                  <CheckCircle :size="15" class="badge-icon" />
                  <span>{{ feat }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;

.facilities-flow {
  display: flex;
  flex-direction: column;
  gap: 4.5rem;

  @media (min-width: $bp-lg) {
    gap: 6rem;
  }
}

.fac-item-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
  align-items: center;

  @media (min-width: $bp-lg) {
    grid-template-columns: 1.1fr 1fr;
    gap: 4.5rem;

    &.reverse {
      grid-template-columns: 1fr 1.1fr;

      .fac-media-box {
        order: 2;
      }
      .fac-content-box {
        order: 1;
      }
    }
  }
}

.fac-media-box {
  width: 100%;
}

.fac-content-box {
  .fac-num {
    font-family: $font-display;
    font-size: 2.2rem;
    font-weight: 700;
    color: var(--gold-primary);
    opacity: 0.6;
    line-height: 1;
    display: block;
    margin-bottom: 0.5rem;
  }

  .fac-title {
    font-size: clamp(1.5rem, 2.5vw, 2rem);
    margin-bottom: 0.8rem;
  }

  .fac-desc {
    font-size: 0.98rem;
    line-height: 1.85;
    color: var(--text-sub);
    margin-bottom: 1.75rem;
  }

  .fac-features {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;

    .feat-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      padding: 0.45rem 0.9rem;
      border-radius: 4px;
      font-size: 0.85rem;
      color: var(--text-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);

      .badge-icon {
        color: var(--gold-primary);
      }
    }
  }
}
</style>
