<script setup>
import { useI18n } from '../composables/useI18n'
import PageHeader from '../components/common/PageHeader.vue'
import BookingButton from '../components/common/BookingButton.vue'
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
import AvailabilityCalendar from '../components/booking/AvailabilityCalendar.vue'

const { isEn, tField } = useI18n()
const pkg = pricingData.exclusivePackage
</script>

<template>
  <div class="packages-page">
    <PageHeader 
      :tag="isEn ? 'PACKAGES & RATES' : '包棟方案與計價'"
      :title="isEn ? 'Exclusive Villa Packages & Rates' : '全館尊榮包棟與加值服務'"
      :desc="isEn 
        ? 'Transparent pricing with comprehensive amenities. Exclusive privacy for your ultimate retreat.' 
        : '透明清楚的定價方案，全棟 5 間客房與所有公設完全獨立專屬，享有最極致的私密性。'"
    />

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
              <span class="m-label">{{ isEn ? 'Weekday (Mon - Thu)' : '平日 (週一 ~ 週四)' }}</span>
              <span class="m-price">NT$ {{ pkg.weekday.toLocaleString() }}</span>
              <span class="m-unit">{{ isEn ? '/ night (w/ Breakfast)' : '/ 晚 (含早餐)' }}</span>
            </div>

            <div class="matrix-item featured">
              <span class="m-tag">{{ isEn ? 'Popular' : '熱門首選' }}</span>
              <span class="m-label">{{ isEn ? 'Weekend (Fri - Sun)' : '假日 (週五 ~ 週日)' }}</span>
              <span class="m-price">NT$ {{ pkg.weekend.toLocaleString() }}</span>
              <span class="m-unit">{{ isEn ? '/ night (w/ Breakfast)' : '/ 晚 (含早餐)' }}</span>
            </div>

            <div class="matrix-item">
              <span class="m-label">{{ isEn ? 'Consecutive Holidays' : '國定連續假期' }}</span>
              <span class="m-price">NT$ {{ pkg.holidayMin ? pkg.holidayMin.toLocaleString() : '35,000' }} ~ {{ pkg.holidayMax ? pkg.holidayMax.toLocaleString() : '50,000' }}</span>
              <span class="m-unit">{{ isEn ? '/ night (See table below)' : '/ 晚 (見下方明細)' }}</span>
            </div>
          </div>

          <div class="pkg-specs-grid">
            <div class="spec-box">
              <Users :size="20" class="spec-icon" />
              <div>
                <span class="s-title">{{ isEn ? 'Included Capacity' : '基本容納人數' }}</span>
                <p>{{ pkg.includedGuests }} {{ isEn ? 'Guests Max (No extra beds)' : '人（最多 20 人・無加床服務）' }}</p>
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
                <span class="s-title">{{ isEn ? 'Security Deposit' : '現場押金 (保證金)' }}</span>
                <p>NT$ {{ pkg.deposit.toLocaleString() }} {{ isEn ? '(Refundable upon checkout)' : '(退房無損全額退還)' }}</p>
              </div>
            </div>
          </div>

          <!-- 國定連續假期價目明細表 -->
          <div class="holiday-schedule-box" v-if="pricingData.holidays && pricingData.holidays.length">
            <div class="holiday-header">
              <Sparkles :size="16" class="h-icon" />
              <h3 class="holiday-title">{{ isEn ? 'Official Consecutive Holidays Rate Schedule' : '國定假日與連續假期專案價目表' }}</h3>
              <span class="holiday-subnote">{{ isEn ? '(Rates apply starting from holiday eve)' : '（一律國定假日前一天開始計算國定假日價）' }}</span>
            </div>

            <div class="holiday-table-wrapper">
              <table class="holiday-table">
                <thead>
                  <tr>
                    <th>{{ isEn ? 'Holiday' : '連假名稱' }}</th>
                    <th>{{ isEn ? 'Dates' : '適用日期區間' }}</th>
                    <th>{{ isEn ? 'Rate / Night' : '專案房價 / 晚' }}</th>
                    <th>{{ isEn ? 'Breakfast' : '早餐供應' }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(h, hIdx) in pricingData.holidays" :key="hIdx" :class="{ 'cny-row': h.price >= 50000 }">
                    <td class="h-name">
                      <strong>{{ isEn ? h.nameEn : h.nameZh }}</strong>
                      <div v-if="h.noteZh" class="h-subnote-text">
                        {{ isEn ? h.noteEn : h.noteZh }}
                      </div>
                    </td>
                    <td class="h-dates">{{ h.dates }}</td>
                    <td class="h-price">NT$ {{ h.price.toLocaleString() }}</td>
                    <td class="h-breakfast">
                      <span v-if="h.breakfast" class="badge-included">{{ isEn ? 'Included' : '含早餐' }}</span>
                      <span v-else class="badge-excluded">{{ isEn ? 'Not Included' : '不含早餐' }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="pkg-cta-row">
            <BookingButton 
              roomTitle="全館尊榮包棟"
              variant="gold"
              size="lg"
              :text="isEn ? 'Inquire & Reserve Dates' : '立即預約包棟檔期'"
            />
          </div>
        </div>

        <!-- 3. 即時空房日曆與 OTA 雙向連動區塊 -->
        <div class="calendar-section" id="availability-section">
          <div class="section-header">
            <span class="section-tag">{{ isEn ? 'LIVE AVAILABILITY' : '即時房態' }}</span>
            <h2 class="section-title">{{ isEn ? 'Real-Time Availability & Booking' : '即時空房查詢與線上試算' }}</h2>
            <p class="section-desc">
              {{ isEn 
                ? 'Select your check-in and check-out dates to calculate rates and reserve directly via official LINE.' 
                : '點選預計入住與退房日期即可即時試算包棟費用，歡迎透過官方 LINE 洽詢管家預約。' 
              }}
            </p>
          </div>

          <AvailabilityCalendar />
        </div>

        <!-- 4. 加值服務區塊 -->
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

.holiday-schedule-box {
  margin: 1.5rem 0 2.5rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 1.5rem;

  .holiday-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
    border-bottom: 1px dashed var(--border-color);
    padding-bottom: 0.75rem;

    .h-icon {
      color: var(--gold-primary);
    }

    .holiday-title {
      font-size: 1.15rem;
      color: var(--gold-primary);
      margin: 0;
    }

    .holiday-subnote {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
  }

  .holiday-table-wrapper {
    overflow-x: auto;

    .holiday-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.92rem;
      text-align: left;

      th {
        padding: 0.75rem 1rem;
        background: var(--badge-bg);
        color: var(--gold-primary);
        font-weight: 600;
        border-bottom: 1px solid var(--border-color);
      }

      td {
        padding: 0.85rem 1rem;
        border-bottom: 1px solid var(--border-color);
        color: var(--text-primary);
      }

      tr:hover td {
        background: rgba(212, 175, 55, 0.05);
      }

      .h-price {
        font-family: $font-display;
        font-weight: 600;
        color: var(--gold-primary);
      }

      .badge-included {
        display: inline-block;
        padding: 0.2rem 0.6rem;
        border-radius: 4px;
        font-size: 0.8rem;
        background: rgba(34, 197, 94, 0.15);
        color: #16a34a;
        font-weight: 500;
      }

      .badge-excluded {
        display: inline-block;
        padding: 0.2rem 0.6rem;
        border-radius: 4px;
        font-size: 0.8rem;
        background: rgba(239, 68, 68, 0.15);
        color: #dc2626;
        font-weight: 500;
      }

      .h-subnote-text {
        font-size: 0.78rem;
        color: #dc2626;
        margin-top: 2px;
      }

      .cny-row td {
        background: rgba(212, 175, 55, 0.08);
      }
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
