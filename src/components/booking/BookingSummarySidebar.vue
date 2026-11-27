<script setup>
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useBookingPricing } from '../../composables/useBookingPricing'
import { Sparkles, CalendarDays, Send } from 'lucide-vue-next'
import BookingDateGuestPicker from './BookingDateGuestPicker.vue'

const props = defineProps({
  checkInDate: { type: String, default: null },
  checkOutDate: { type: String, default: null },
  guestCount: { type: Number, default: 18 },
  calculation: {
    type: Object,
    default: () => ({ nights: 0, weekdayNights: 0, weekendNights: 0, holidayNights: 0, holidayTotal: 0, holidayNames: [], holidayNightsList: [], baseTotal: 0, extraPersonFee: 0, grandTotal: 0 })
  },
  lineBookingUrl: { type: String, default: '' }
})

const emit = defineEmits(['update:guestCount', 'open-booking'])

const { isEn, t } = useI18n()
const { getHolidayForDate, isWeekendDate, maxCapacity } = useBookingPricing()

const checkInHoliday = computed(() => {
  if (!props.checkInDate) return null
  return getHolidayForDate(props.checkInDate)
})

const isCheckInWeekend = computed(() => {
  if (!props.checkInDate) return false
  return isWeekendDate(props.checkInDate)
})
</script>

<template>
  <div class="booking-summary-col">
    <div class="summary-box">
      <h4 class="summary-heading">
        <Sparkles :size="18" class="text-gold" />
        <span>{{ t('calendar.sidebar.summaryHeading') }}</span>
      </h4>

      <!-- 日期與人數選擇器 (獨立子組件) -->
      <BookingDateGuestPicker
        :check-in-date="checkInDate"
        :check-out-date="checkOutDate"
        :guest-count="guestCount"
        :max-capacity="maxCapacity"
        :calculation="calculation"
        @update:guest-count="emit('update:guestCount', $event)"
      />

      <!-- 價格計算明細 (入住與退房日期皆完成選取時) -->
      <div v-if="calculation.nights > 0" class="calc-breakdown">
        <div class="calc-row">
          <span>{{ t('calendar.sidebar.stayDuration') }}</span>
          <span class="calc-val">{{ calculation.nights }} {{ t('calendar.nights') }}</span>
        </div>
        <div v-if="calculation.weekdayNights > 0" class="calc-row sub highlight-weekday">
          <span>{{ t('calendar.sidebar.weekdayLabel') }} ({{ calculation.weekdayTier?.labelZh ? calculation.weekdayTier.labelZh + '・' : '' }}{{ calculation.weekdayNights }} {{ t('calendar.nights') }} × NT$ {{ (calculation.weekdayUnitPrice || 20000).toLocaleString() }}・{{ t('calendar.sidebar.breakfastIncluded') }})</span>
          <span>NT$ {{ (calculation.weekdayNights * (calculation.weekdayUnitPrice || 20000)).toLocaleString() }}</span>
        </div>
        <div v-if="calculation.weekendNights > 0" class="calc-row sub">
          <span>{{ t('calendar.sidebar.weekendLabel') }} ({{ calculation.weekendNights }} {{ t('calendar.nights') }} × NT$ {{ (calculation.weekendUnitPrice || 35000).toLocaleString() }}・{{ t('calendar.sidebar.breakfastIncluded') }})</span>
          <span>NT$ {{ (calculation.weekendNights * (calculation.weekendUnitPrice || 35000)).toLocaleString() }}</span>
        </div>
        <div v-if="calculation.holidayNights > 0" class="calc-row sub highlight-holiday">
          <span>
            {{ t('calendar.sidebar.holidayLabel') }}
            <template v-if="calculation.holidayNames && calculation.holidayNames.length > 0">
              ({{ (isEn && calculation.holidayNamesEn && calculation.holidayNamesEn.length > 0 ? calculation.holidayNamesEn.join(', ') : calculation.holidayNames.join('、')) }}・{{ calculation.holidayNights }} {{ t('calendar.nights') }}{{ t('calendar.sidebar.holidayDesc') }})
            </template>
            <template v-else>
              ({{ calculation.holidayNights }} {{ t('calendar.nights') }}{{ t('calendar.sidebar.holidayDesc') }})
            </template>
          </span>
          <span>NT$ {{ calculation.holidayTotal.toLocaleString() }}</span>
        </div>
        <div v-if="calculation.extraPersonFee > 0" class="calc-row sub">
          <span>{{ t('calendar.sidebar.extraPersonFee') }}</span>
          <span>NT$ {{ calculation.extraPersonFee.toLocaleString() }}</span>
        </div>
        <div class="calc-divider"></div>
        <div class="calc-total-row">
          <span class="total-label">{{ t('calendar.estimatedTotal') }}</span>
          <span class="total-price">NT$ {{ calculation.grandTotal.toLocaleString() }}</span>
        </div>
      </div>

      <!-- 當已選入住但未選退房時的價格預覽 -->
      <div v-else-if="checkInDate && !checkOutDate" class="calc-checkin-preview">
        <span class="preview-badge" :class="{ 'is-holiday': checkInHoliday }">
          {{ checkInHoliday ? t('calendar.sidebar.holidayPreviewBadge') : (isCheckInWeekend ? t('calendar.sidebar.weekendPreviewBadge') : t('calendar.sidebar.weekdayPreviewBadge')) }}
        </span>
        <h5 class="preview-title">
          {{ checkInHoliday ? (isEn ? (checkInHoliday.nameEn || checkInHoliday.nameZh) : (checkInHoliday.nameZh || checkInHoliday.name)) : (isCheckInWeekend ? t('calendar.sidebar.weekendPreviewTitle') : t('calendar.sidebar.weekdayPreviewTitle')) }}
        </h5>
        <div class="preview-price-row">
          <span class="currency">NT$</span>
          <span class="price-val">
            {{ checkInHoliday ? (Number(checkInHoliday.price) || 47000).toLocaleString() : (isCheckInWeekend ? '35,000' : (calculation.weekdayUnitPrice || 20000).toLocaleString()) }}
          </span>
          <span class="unit">{{ t('calendar.sidebar.perNight') }}</span>
        </div>
        <p class="preview-breakfast">
          {{ checkInHoliday ? (checkInHoliday.breakfast ? t('calendar.sidebar.breakfastIncluded') : t('calendar.sidebar.cnyNoBreakfast')) : t('calendar.sidebar.breakfastIncluded') }}
        </p>
        <div class="preview-hint">
          {{ t('calendar.sidebar.previewHint') }}
        </div>
      </div>

      <!-- 未點選任何日期時之預設導引 -->
      <div v-else class="calc-placeholder">
        <div class="placeholder-icon">
          <CalendarDays :size="24" class="text-gold" />
        </div>
        <div class="placeholder-content">
          <p class="placeholder-title">{{ t('calendar.selectDates') }}</p>
          <p class="placeholder-desc">{{ t('calendar.sidebar.placeholderDesc') }}</p>
        </div>
      </div>

      <!-- 直訂雙軌 CTA -->
      <div class="cta-actions-group">
        <button 
          type="button" 
          class="btn btn-gold btn-block btn-reserve"
          @click="emit('open-booking')"
        >
          <Sparkles :size="18" />
          <span>{{ t('calendar.sidebar.bookDirect') }}</span>
        </button>

        <a 
          :href="lineBookingUrl" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="btn btn-line-secondary btn-block"
        >
          <Send :size="16" />
          <span>{{ t('calendar.inquireViaLine') }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.booking-summary-col {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.summary-box {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 520px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 1.5rem;
  margin-bottom: 0;

  @media (min-width: 1250px) {
    padding: 2rem 1.75rem;
  }

  .summary-heading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.15rem;
    margin-bottom: 1.5rem;

    .text-gold {
      color: var(--gold-primary);
    }
  }
}

.calc-breakdown {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 1.15rem;
  margin-bottom: 1.5rem;

  .calc-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
    font-size: 0.88rem;
    margin-bottom: 0.4rem;
    color: var(--text-sub);

    span:last-child {
      flex-shrink: 0;
    }

    &.sub {
      font-size: 0.82rem;
      color: var(--text-muted);

      &.highlight-holiday,
      &.highlight-weekday {
        color: var(--gold-primary);
        font-weight: 500;
      }
    }
  }

  .calc-divider {
    height: 1px;
    background: var(--border-color);
    margin: 0.75rem 0;
  }

  .calc-total-row {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .total-label {
      font-weight: 600;
      font-size: 0.95rem;
      color: var(--text-primary);
    }

    .total-price {
      font-family: $font-display;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--gold-primary);
    }
  }
}

.calc-checkin-preview {
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1.15rem;
  background: var(--bg-card);
  border-radius: 6px;
  border: 1px solid var(--gold-primary);
  box-shadow: 0 4px 14px rgba(197, 168, 128, 0.15);
  margin-bottom: 1.5rem;

  .preview-badge {
    align-self: flex-start;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    border-radius: 3px;
    background: var(--badge-bg);
    color: var(--gold-primary);
    border: 1px solid var(--gold-primary);
    margin-bottom: 0.4rem;

    &.is-holiday {
      background: var(--gold-primary);
      color: var(--bg-card);
    }
  }

  .preview-title {
    font-family: $font-display;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 0.35rem;
  }

  .preview-price-row {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    margin-bottom: 0.25rem;

    .currency {
      font-size: 0.82rem;
      color: var(--gold-primary);
      font-weight: 600;
    }
    .price-val {
      font-family: $font-display;
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--gold-primary);
    }
    .unit {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
  }

  .preview-breakfast {
    font-size: 0.78rem;
    color: var(--text-sub);
    margin: 0 0 0.65rem;
  }

  .preview-hint {
    padding: 0.45rem 0.65rem;
    background: var(--bg-surface);
    border-radius: 4px;
    font-size: 0.76rem;
    color: var(--gold-primary);
    font-weight: 600;
  }
}

.calc-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.65rem;
  padding: 2.25rem 1.25rem;
  background: var(--bg-card);
  border-radius: 6px;
  border: 1px dashed var(--border-color);
  margin-bottom: 1.5rem;
  flex-grow: 1;

  .placeholder-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--badge-bg);
    display: flex;
    align-items: center;
    justify-content: center;

    .text-gold { color: var(--gold-primary); }
  }

  .placeholder-title {
    font-size: 0.92rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .placeholder-desc {
    font-size: 0.78rem;
    color: var(--text-muted);
    line-height: 1.45;
    margin: 0;
    max-width: 250px;
  }
}

.cta-actions-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: auto;
  padding-top: 1.25rem;

  .btn-reserve {
    padding: 0.95rem 1.5rem;
    font-size: 1rem;
    box-shadow: 0 4px 16px var(--badge-bg);
  }

  .btn-line-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.85rem 1.25rem;
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    font-size: 0.9rem;
    border-radius: 4px;
    font-weight: 500;
    transition: $transition-base;
    text-decoration: none;

    &:hover {
      border-color: var(--color-line);
      color: var(--color-line);
      background: var(--color-line-bg);
    }
  }
}

// 暗黑模式對比度增強
:root[data-theme="dark"] {
  .summary-box {
    background: rgba(255, 255, 255, 0.02);
    border-color: rgba(255, 255, 255, 0.14);
  }

  .calc-breakdown {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.12);

    .calc-row {
      color: var(--text-primary);

      &.sub {
        color: var(--text-sub);

        &.highlight-weekday,
        &.highlight-holiday {
          color: var(--gold-light);
        }
      }
    }

    .calc-divider {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .calc-checkin-preview {
    background: rgba(255, 255, 255, 0.035);
    border-color: var(--gold-primary);
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);

    .preview-hint {
      background: rgba(255, 255, 255, 0.06);
      color: var(--gold-light);
    }
  }

  .calc-placeholder {
    background: rgba(255, 255, 255, 0.025);
    border-color: rgba(255, 255, 255, 0.15);

    .placeholder-desc {
      color: var(--text-sub);
    }
  }

  .btn-line-secondary {
    border-color: rgba(255, 255, 255, 0.18);
    color: var(--text-primary);

    &:hover {
      border-color: var(--color-line);
      color: var(--color-line);
      background: rgba(6, 199, 85, 0.15);
    }
  }
}
</style>
