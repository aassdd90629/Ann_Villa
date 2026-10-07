<script setup>
import { useI18n } from '../composables/useI18n'
import pricingData from '../data/pricing.json'
import siteData from '../data/site.json'
import { 
  Sparkles, 
  Users, 
  Clock, 
  ShieldAlert, 
  Camera, 
  Utensils, 
  Wine, 
  Check, 
  HelpCircle
} from 'lucide-vue-next'

const { isEn, tField } = useI18n()
const pkg = pricingData.exclusivePackage
</script>

<template>
  <div class="packages-page">
    <section class="page-header">
      <div class="container header-container">
        <span class="section-tag">{{ isEn ? 'PACKAGES & RATES' : '包棟方案與計價' }}</span>
        <h1 class="page-title">{{ isEn ? 'Exclusive Villa Packages & Rates' : '全館尊榮包棟與加值服務' }}</h1>
        <p class="page-desc">
          {{ isEn 
            ? 'Transparent pricing with comprehensive amenities. Exclusive privacy for your ultimate retreat.' 
            : '透明清楚的定價方案，全區 4 間套房與所有公設完全獨立專屬，享有最極致的私密性。' 
          }}
        </p>
      </div>
    </section>

    <section class="section-py packages-section">
      <div class="container">
        <!-- 核心包棟價目表 -->
        <div class="main-package-card card-luxury">
          <div class="pkg-header">
            <span class="badge">{{ isEn ? 'ALL-INCLUSIVE PRIVILEGE' : '尊榮全包式包棟' }}</span>
            <h2 class="pkg-name">{{ isEn ? pkg.titleEn : pkg.titleZh }}</h2>
            <p class="pkg-desc">{{ isEn ? pkg.descEn : pkg.descZh }}</p>
          </div>

          <div class="pricing-matrix">
            <div class="matrix-item">
              <span class="m-label">{{ isEn ? 'Weekday (Sun - Thu)' : '平日 (週日 ~ 週四)' }}</span>
              <span class="m-price">NT$ {{ pkg.weekday.toLocaleString() }}</span>
              <span class="m-unit">{{ isEn ? '/ night' : '/ 晚' }}</span>
            </div>

            <div class="matrix-item featured">
              <span class="m-tag">{{ isEn ? 'Popular' : '熱門首選' }}</span>
              <span class="m-label">{{ isEn ? 'Weekend (Fri - Sat)' : '假日 (週五、週六)' }}</span>
              <span class="m-price">NT$ {{ pkg.weekend.toLocaleString() }}</span>
              <span class="m-unit">{{ isEn ? '/ night' : '/ 晚' }}</span>
            </div>

            <div class="matrix-item">
              <span class="m-label">{{ isEn ? 'Consecutive Holidays' : '連續假期 / 國定假日' }}</span>
              <span class="m-price">NT$ {{ pkg.holiday.toLocaleString() }}</span>
              <span class="m-unit">{{ isEn ? '/ night' : '/ 晚' }}</span>
            </div>
          </div>

          <div class="pkg-specs-grid">
            <div class="spec-box">
              <Users :size="20" class="spec-icon" />
              <div>
                <span class="s-title">{{ isEn ? 'Included Capacity' : '基本包含人數' }}</span>
                <p>{{ pkg.includedGuests }} {{ isEn ? 'Guests (Max 22)' : '人 (最多可加至 22 人)' }}</p>
              </div>
            </div>

            <div class="spec-box">
              <Clock :size="20" class="spec-icon" />
              <div>
                <span class="s-title">{{ isEn ? 'Check-in / Check-out' : '入住 / 退房時間' }}</span>
                <p>{{ pkg.checkInTime }} ~ 隔日 {{ pkg.checkOutTime }}</p>
              </div>
            </div>

            <div class="spec-box">
              <ShieldAlert :size="20" class="spec-icon" />
              <div>
                <span class="s-title">{{ isEn ? 'Security Deposit' : '入住保證金 (押金)' }}</span>
                <p>NT$ {{ pkg.deposit.toLocaleString() }} {{ isEn ? '(Refundable)' : '(退房無損全額退還)' }}</p>
              </div>
            </div>
          </div>

          <div class="pkg-cta-row">
            <a :href="siteData.lineUrl" target="_blank" rel="noopener noreferrer" class="btn btn-gold btn-large">
              <Sparkles :size="18" />
              <span>{{ isEn ? 'Inquire & Reserve Dates' : '立即預約包棟檔期' }}</span>
            </a>
          </div>
        </div>

        <!-- 加值服務區塊 -->
        <div class="extra-services-section">
          <div class="section-header">
            <span class="section-tag">{{ isEn ? 'ADD-ON SERVICES' : '客製加值' }}</span>
            <h2 class="section-title">{{ isEn ? 'Bespoke Add-On Experiences' : '多元加值服務與專案場租' }}</h2>
          </div>

          <div class="services-grid">
            <div 
              v-for="serv in pricingData.additionalServices" 
              :key="serv.id"
              class="service-card card-luxury"
            >
              <div class="serv-icon-box">
                <Camera v-if="serv.id === 'wedding-shoot'" :size="24" />
                <Utensils v-else-if="serv.id === 'private-chef'" :size="24" />
                <Wine v-else :size="24" />
              </div>
              <h3 class="serv-title">{{ isEn ? serv.titleEn : serv.titleZh }}</h3>
              <p class="serv-pricing">{{ isEn ? serv.pricingEn : serv.pricingZh }}</p>
              <p class="serv-note">{{ isEn ? serv.noteEn : serv.noteZh }}</p>
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

.main-package-card {
  padding: 2.5rem 1.5rem;
  margin-bottom: 5rem;

  @media (min-width: $bp-lg) {
    padding: 3.5rem 3rem;
  }

  .pkg-header {
    text-align: center;
    max-width: 700px;
    margin: 0 auto 2.5rem;

    .pkg-name {
      font-size: clamp(1.8rem, 3vw, 2.4rem);
      margin: 0.8rem 0 0.5rem;
    }

    .pkg-desc {
      font-size: 0.95rem;
      color: var(--text-sub);
    }
  }
}

.pricing-matrix {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 2.5rem;

  @media (min-width: $bp-md) {
    grid-template-columns: repeat(3, 1fr);
  }

  .matrix-item {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 2rem 1.5rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;

    .m-label {
      font-size: 0.9rem;
      color: var(--text-sub);
      margin-bottom: 0.5rem;
    }

    .m-price {
      font-family: $font-display;
      font-size: 1.85rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .m-unit {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    &.featured {
      border-color: var(--gold-primary);
      background: var(--bg-card);
      box-shadow: 0 4px 20px rgba(197, 168, 128, 0.15);

      .m-price {
        color: var(--gold-primary);
      }

      .m-tag {
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--gold-primary);
        color: #FFFFFF;
        font-size: 0.72rem;
        padding: 0.2rem 0.6rem;
        border-radius: 12px;
        font-weight: 600;
      }
    }
  }
}

.pkg-specs-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  padding: 1.5rem 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 2.5rem;

  @media (min-width: $bp-md) {
    grid-template-columns: repeat(3, 1fr);
  }

  .spec-box {
    display: flex;
    align-items: flex-start;
    gap: 0.85rem;

    .spec-icon {
      color: var(--gold-primary);
      flex-shrink: 0;
      margin-top: 3px;
    }

    .s-title {
      display: block;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 2px;
    }

    p {
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--text-primary);
      margin: 0;
    }
  }
}

.pkg-cta-row {
  text-align: center;

  .btn-large {
    padding: 0.9rem 2.5rem;
    font-size: 1.05rem;
  }
}

.services-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: $bp-md) {
    grid-template-columns: repeat(3, 1fr);
  }

  .service-card {
    padding: 2rem;
    display: flex;
    flex-direction: column;

    .serv-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 4px;
      background: var(--badge-bg);
      color: var(--gold-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
    }

    .serv-title {
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
    }

    .serv-pricing {
      font-family: $font-display;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--gold-primary);
      margin-bottom: 0.75rem;
    }

    .serv-note {
      font-size: 0.9rem;
      color: var(--text-sub);
      line-height: 1.7;
    }
  }
}
</style>
