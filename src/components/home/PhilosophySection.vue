<script setup>
import { CheckCircle2 } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n'

const { t } = useI18n()
</script>

<template>
  <section class="section-py philosophy-section">
    <div class="container">
      <div class="philosophy-grid">
        <div class="philosophy-text">
          <span class="section-tag">{{ t('home.philosophy.tag') }}</span>
          <h2 class="section-title">
            {{ t('home.philosophy.title') }}
          </h2>
          <p class="lead">
            {{ t('home.philosophy.lead') }}
          </p>
          <p>
            {{ t('home.philosophy.desc') }}
          </p>

          <!-- 全棟專屬設施亮點 -->
          <div class="philosophy-features">
            <div class="p-feat">
              <CheckCircle2 :size="18" class="feat-icon" />
              <span>{{ t('home.philosophy.features.bedrooms') }}</span>
            </div>
            <div class="p-feat">
              <CheckCircle2 :size="18" class="feat-icon" />
              <span>{{ t('home.philosophy.features.entertainment') }}</span>
            </div>
            <div class="p-feat">
              <CheckCircle2 :size="18" class="feat-icon" />
              <span>{{ t('home.philosophy.features.patio') }}</span>
            </div>
          </div>

          <!-- 包棟計價與方案費用說明 -->
          <div class="philosophy-pricing-box">
            <div class="pricing-group">
              <span class="pricing-title">{{ t('home.philosophy.pricing.weekdays') }}</span>
              <ul class="pricing-list">
                <li>{{ t('home.philosophy.pricing.tier10') }}</li>
                <li>{{ t('home.philosophy.pricing.tier14') }}</li>
                <li>{{ t('home.philosophy.pricing.tier18') }}</li>
              </ul>
            </div>

            <div class="pricing-group">
              <div class="pricing-line">
                {{ t('home.philosophy.pricing.weekend') }}
              </div>
              <div class="pricing-line holiday-line">
                <span class="holiday-title">{{ t('home.philosophy.pricing.holidays') }}</span>
                <span class="holiday-note">{{ t('home.philosophy.pricing.holidayNote') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="philosophy-media">
          <div class="img-frame-main img-zoom-container">
            <img 
              src="/img/house/house-01.webp" 
              :alt="t('home.philosophy.altExterior')" 
              loading="lazy"
            />
          </div>
          <div class="img-frame-sub img-zoom-container">
            <img 
              src="/img/cloud-sea/cloud-sea-02.webp" 
              :alt="t('home.philosophy.altClouds')" 
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.philosophy-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3.5rem;
  align-items: center;

  @media (min-width: $bp-lg) {
    grid-template-columns: 1.1fr 1fr;
    gap: 5rem;
  }
}

.philosophy-features {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin-top: 1.75rem;

  .p-feat {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--text-primary);

    .feat-icon {
      color: var(--gold-primary);
    }
  }
}

.philosophy-pricing-box {
  margin-top: 1.5rem;
  padding: 1.15rem 1.35rem;
  background: rgba(197, 168, 128, 0.08);
  border: 1px solid rgba(197, 168, 128, 0.25);
  border-left: 3.5px solid var(--gold-primary, #C5A880);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;

  .pricing-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .pricing-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--gold-dark, #91754F);
    letter-spacing: 0.5px;
  }

  .pricing-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;

    li {
      font-size: 0.92rem;
      color: var(--text-primary);
      line-height: 1.5;
    }
  }

  .pricing-line {
    font-size: 0.92rem;
    color: var(--text-primary);
    line-height: 1.5;

    &.holiday-line {
      margin-top: 0.2rem;
      color: var(--text-secondary);

      .holiday-title {
        font-weight: 600;
        color: var(--gold-dark, #91754F);
      }

      .holiday-note {
        color: var(--text-primary);
      }
    }
  }
}

.philosophy-media {
  position: relative;

  .img-frame-main {
    width: 85%;
    height: 380px;
    border-radius: 4px;
    box-shadow: var(--shadow-card);

    @media (max-width: $bp-sm) {
      width: 88%;
      height: 250px;
    }
  }

  .img-frame-sub {
    position: absolute;
    right: 0;
    bottom: -30px;
    width: 55%;
    height: 240px;
    border-radius: 4px;
    border: 6px solid var(--bg-primary);
    box-shadow: var(--shadow-card);

    @media (max-width: $bp-sm) {
      width: 55%;
      height: 150px;
      bottom: -15px;
      border-width: 4px;
    }
  }
}
</style>