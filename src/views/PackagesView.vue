<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useBookingPricing } from '../composables/useBookingPricing'
import PageHeader from '../components/common/PageHeader.vue'
import BookingButton from '../components/common/BookingButton.vue'
import { 
  Sparkles, 
  Users, 
  Clock, 
  ShieldAlert, 
  Camera, 
  Utensils, 
  Wine 
} from 'lucide-vue-next'
import AvailabilityCalendar from '../components/booking/AvailabilityCalendar.vue'

const { t, tField } = useI18n()
const { pricingData } = useBookingPricing()
const pkg = computed(() => pricingData.value.exclusivePackage)
</script>

<template>
  <div class="packages-page">
    <PageHeader 
      :tag="t('packages.tag')"
      :title="t('packages.title')"
      :desc="t('packages.desc')"
    />

    <section class="section-py packages-section">
      <div class="container">
        <!-- 核心包棟價目表 -->
        <div class="main-package-card card-luxury">
          <div class="pkg-header">
            <span class="badge">{{ t('packages.allInclusive') }}</span>
            <h2 class="pkg-name">{{ tField(pkg, 'title') }}</h2>
            <p class="pkg-desc">{{ tField(pkg, 'desc') }}</p>
          </div>

          <div class="pricing-matrix">
            <div class="matrix-item">
              <span class="m-label">{{ t('packages.weekday') }}</span>
              <span class="m-price">NT$ {{ pkg.weekday.toLocaleString() }} <small class="m-from">{{ t('packages.fromUp') }}</small></span>
              <span class="m-unit">{{ t('packages.weekdayUnit') }}</span>
              <div class="m-subtiers">
                <div class="tier-line"><span>{{ t('packages.tier10') }}</span><strong>NT$ 20,000</strong></div>
                <div class="tier-line"><span>{{ t('packages.tier14') }}</span><strong>NT$ 25,000</strong></div>
                <div class="tier-line"><span>{{ t('packages.tier18') }}</span><strong>NT$ 30,000</strong></div>
              </div>
            </div>

            <div class="matrix-item featured">
              <span class="m-tag">{{ t('packages.popular') }}</span>
              <span class="m-label">{{ t('packages.weekend') }}</span>
              <span class="m-price">NT$ {{ pkg.weekend.toLocaleString() }}</span>
              <span class="m-unit">{{ t('packages.weekendUnit') }}</span>
            </div>

            <div class="matrix-item">
              <span class="m-label">{{ t('packages.holidays') }}</span>
              <span class="m-price">NT$ {{ pkg.holidayMin ? pkg.holidayMin.toLocaleString() : '35,000' }} ~ {{ pkg.holidayMax ? pkg.holidayMax.toLocaleString() : '50,000' }}</span>
              <span class="m-unit">{{ t('packages.holidaysUnit') }}</span>
            </div>
          </div>

          <div class="pkg-specs-grid">
            <div class="spec-box">
              <Users :size="20" class="spec-icon" />
              <div>
                <span class="s-title">{{ t('packages.capacityTitle') }}</span>
                <p>{{ pkg.includedGuests }} {{ t('packages.capacityDesc') }}</p>
              </div>
            </div>

            <div class="spec-box">
              <Clock :size="20" class="spec-icon" />
              <div>
                <span class="s-title">{{ t('packages.checkInOutTitle') }}</span>
                <p>{{ pkg.checkInTime }} ~ {{ t('packages.checkInOutNextDay') }} {{ pkg.checkOutTime }}</p>
              </div>
            </div>

            <div class="spec-box">
              <ShieldAlert :size="20" class="spec-icon" />
              <div>
                <span class="s-title">{{ t('packages.depositTitle') }}</span>
                <p>NT$ {{ pkg.deposit.toLocaleString() }} {{ t('packages.depositDesc') }}</p>
              </div>
            </div>
          </div>

          <!-- 國定連續假期價目明細表 -->
          <div class="holiday-schedule-box" v-if="pricingData.holidays && pricingData.holidays.length">
            <div class="holiday-header">
              <Sparkles :size="16" class="h-icon" />
              <h3 class="holiday-title">{{ t('packages.holidayTableTitle') }}</h3>
              <span class="holiday-subnote">{{ t('packages.holidayTableSubnote') }}</span>
            </div>

            <div class="holiday-table-wrapper">
              <table class="holiday-table">
                <thead>
                  <tr>
                    <th>{{ t('packages.tableColHoliday') }}</th>
                    <th>{{ t('packages.tableColDates') }}</th>
                    <th>{{ t('packages.tableColRate') }}</th>
                    <th>{{ t('packages.tableColBreakfast') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(h, hIdx) in pricingData.holidays" :key="hIdx">
                    <td class="h-name">
                      <strong>{{ tField(h, 'name') || h.name }}</strong>
                      <div v-if="h.noteZh || h.noteEn" class="h-subnote-text">
                        {{ tField(h, 'note') }}
                      </div>
                    </td>
                    <td class="h-dates">{{ h.dates || (h.startDate && h.endDate ? `${h.startDate} ~ ${h.endDate}` : (h.startDate || '')) }}</td>
                    <td class="h-price">NT$ {{ (h.price || 0).toLocaleString() }}</td>
                    <td class="h-breakfast">
                      <span v-if="h.breakfast !== undefined ? h.breakfast : (h.hasBreakfast !== undefined ? Boolean(h.hasBreakfast) : (h.price < 50000 && !(h.nameZh || h.name || '').includes('春節')))" class="badge-included">{{ t('packages.breakfastIncluded') }}</span>
                      <span v-else class="badge-excluded">{{ t('packages.breakfastExcluded') }}</span>
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
              :text="t('packages.inquireDates')"
            />
          </div>
        </div>

        <!-- 3. 即時空房日曆與 OTA 雙向連動區塊 -->
        <div class="calendar-section" id="availability-section">
          <div class="section-header">
            <span class="section-tag">{{ t('packages.calendarTag') }}</span>
            <h2 class="section-title">{{ t('packages.calendarTitle') }}</h2>
            <p class="section-desc">{{ t('packages.calendarDesc') }}</p>
          </div>

          <AvailabilityCalendar />
        </div>

        <!-- 4. 加值服務區塊 -->
        <div class="extra-services-section">
          <div class="section-header">
            <span class="section-tag">{{ t('packages.addonsTag') }}</span>
            <h2 class="section-title">{{ t('packages.addonsTitle') }}</h2>
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
              <h3 class="serv-title">{{ tField(serv, 'title') }}</h3>
              <p class="serv-pricing">{{ tField(serv, 'pricing') }}</p>
              <p class="serv-note">{{ tField(serv, 'note') }}</p>
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

  @media (max-width: $bp-sm) {
    padding: 1.75rem 1rem;
    margin-bottom: 3.5rem;
  }

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

    @media (max-width: $bp-sm) {
      padding: 1.5rem 1rem;
    }

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
      .m-from {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--gold-primary);
      }
    }

    .m-subtiers {
      margin-top: 0.65rem;
      padding-top: 0.5rem;
      border-top: 1px dashed var(--border-gold-subtle, rgba(200, 169, 110, 0.3));
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      width: 100%;
      max-width: 200px;
      margin-left: auto;
      margin-right: auto;

      .tier-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.76rem;
        color: var(--text-sub);

        strong {
          color: var(--gold-primary);
          font-weight: 600;
        }
      }
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

  @media (max-width: $bp-sm) {
    padding: 1rem 0.75rem;
  }

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

      th, td {
        padding: 0.85rem 1rem;
        border-bottom: 1px solid var(--border-color);
      }

      th {
        background: var(--badge-bg);
        color: var(--gold-primary);
        font-weight: 600;
      }

      td {
        color: var(--text-primary);
      }

      tr:hover td {
        background: rgba(212, 175, 55, 0.05);
      }

      .h-price {
        font-family: $font-display;
        font-weight: 700;
        font-size: 1.05rem;
        color: var(--gold-dark);
      }

      .badge-included,
      .badge-excluded {
        display: inline-block;
        padding: 0.2rem 0.6rem;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 500;
      }

      .badge-included {
        background: rgba(34, 197, 94, 0.15);
        color: #16a34a;
      }

      .badge-excluded {
        background: rgba(239, 68, 68, 0.15);
        color: #dc2626;
      }

      .h-subnote-text {
        font-size: 0.78rem;
        color: #dc2626;
        margin-top: 2px;
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

    @media (max-width: $bp-sm) {
      padding: 1.5rem 1.15rem;
    }

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
