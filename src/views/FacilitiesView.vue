<script setup>
import { useI18n } from '../composables/useI18n'
import facilitiesData from '../data/facilities.json'
import siteData from '../data/site.json'
import { CheckCircle, Sparkles } from 'lucide-vue-next'

const { isEn, tField } = useI18n()
</script>

<template>
  <div class="facilities-page">
    <section class="page-header">
      <div class="container header-container">
        <span class="section-tag">{{ isEn ? 'AMENITIES' : '園區空間' }}</span>
        <h1 class="page-title">{{ isEn ? 'Estate Facilities & Wellness' : '園區設施與休閒空間' }}</h1>
        <p class="page-desc">
          {{ isEn
            ? 'From natural stone onsen to infinity panoramic pools, experience exclusive tranquility in every corner.'
            : '無邊際山景泳池、日式天然溫泉湯屋、星空劇院與私廚中島，為您的包棟假期增添無盡風采。'
          }}
        </p>
      </div>
    </section>

    <section class="section-py facilities-section">
      <div class="container">
        <div class="facilities-flow">
          <div 
            v-for="(fac, index) in facilitiesData" 
            :key="fac.id" 
            class="fac-item-row"
            :class="{ 'reverse': index % 2 === 1 }"
          >
            <div class="fac-media-box img-zoom-container">
              <img :src="fac.image" :alt="tField(fac, 'title')" loading="lazy" />
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

.page-header {
  padding-top: 8.5rem;
  padding-bottom: 3.5rem;
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  text-align: center;

  .page-title {
    font-size: clamp(2rem, 4vw, 3rem);
    margin: 0.8rem 0;
  }

  .page-desc {
    font-size: 1rem;
    color: var(--text-sub);
  }
}

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
    gap: 4rem;

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
  height: 340px;
  border-radius: 4px;
  box-shadow: var(--shadow-card);

  @media (min-width: $bp-lg) {
    height: 420px;
  }
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
      padding: 0.4rem 0.85rem;
      border-radius: 4px;
      font-size: 0.85rem;
      color: var(--text-primary);

      .badge-icon {
        color: var(--gold-primary);
      }
    }
  }
}
</style>
