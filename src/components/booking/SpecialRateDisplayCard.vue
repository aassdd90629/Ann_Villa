<script setup>
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useBookingPricing } from '../../composables/useBookingPricing'
import { PartyPopper, Sparkles, CalendarDays } from 'lucide-vue-next'

const props = defineProps({
  selectedDate: { type: String, default: '' },
  checkOutDate: { type: String, default: '' },
  formattedDateText: { type: String, default: '' },
  holiday: { type: Object, default: () => null },
  isWeekend: { type: Boolean, default: false },
  calculation: { type: Object, default: () => null }
})

const { isEn, t } = useI18n()
const { maxCapacity } = useBookingPricing()

const isHoliday = computed(() => Boolean(props.holiday))

const displayTitle = computed(() => {
  if (props.holiday) {
    return isEn.value ? (props.holiday.nameEn || props.holiday.nameZh) : (props.holiday.nameZh || props.holiday.name)
  }
  return t('pricingOverview.specialWeekendTitle')
})

const displayPrice = computed(() => {
  if (props.holiday) {
    return (Number(props.holiday.price) || 47000).toLocaleString()
  }
  return '35,000'
})
</script>

<template>
  <div class="special-rate-container">
    <div class="pricing-header" :class="isHoliday ? 'holiday-header' : 'weekend-header'">
      <div class="header-main">
        <div class="header-badge" :class="{ 'holiday-badge': isHoliday }">
          <PartyPopper v-if="isHoliday" :size="16" class="text-gold" />
          <Sparkles v-else :size="15" class="text-gold" />
          <span>{{ isHoliday ? t('pricingOverview.specialHolidayBadge') : t('pricingOverview.specialWeekendBadge') }}</span>
        </div>
        <h4 class="holiday-title">{{ displayTitle }}</h4>
        <p class="header-desc">
          {{ isHoliday ? t('pricingOverview.specialHolidayDesc', { max: maxCapacity }) : t('pricingOverview.specialWeekendDesc', { max: maxCapacity }) }}
        </p>
      </div>

      <div class="header-date-tag">
        <CalendarDays :size="14" class="text-gold" />
        <span class="tag-label">{{ t('pricingOverview.checkInLabel') }}</span>
        <strong class="tag-val">{{ formattedDateText }}</strong>
      </div>
    </div>

    <div class="special-rate-card" :class="isHoliday ? 'holiday-card' : 'weekend-card'">
      <div class="rate-card-top">
        <div class="rate-badge">
          {{ isHoliday ? t('pricingOverview.rateCardHolidayBadge') : t('pricingOverview.rateCardWeekendBadge') }}
        </div>
        <div class="breakfast-badge" :class="{ 'no-breakfast': isHoliday && !holiday.breakfast }">
          {{ isHoliday ? (holiday.breakfast ? t('pricingOverview.breakfastIncluded') : t('pricingOverview.cnyNoBreakfast')) : t('pricingOverview.breakfastIncluded') }}
        </div>
      </div>

      <div class="rate-price-row">
        <div class="tier-price-wrap">
          <span class="currency">NT$</span>
          <span class="price-amount">{{ displayPrice }}</span>
          <span class="price-unit">{{ t('pricingOverview.rateUnit', { max: maxCapacity }) }}</span>
        </div>
      </div>

      <p class="rate-perks">
        {{ isHoliday ? (holiday.noteZh || t('pricingOverview.holidayPerksDefault')) : t('pricingOverview.weekendPerksDefault') }}
      </p>

      <div class="rate-step-prompt">
        <template v-if="checkOutDate && calculation && calculation.nights > 0">
          <span class="prompt-text highlight-gold">
            {{ t('pricingOverview.selectedIntervalPrompt', { checkIn: selectedDate, checkOut: checkOutDate, nights: calculation.nights, total: calculation.grandTotal.toLocaleString() }) }}
          </span>
        </template>
        <template v-else>
          <span class="prompt-text">
            {{ t('pricingOverview.clickCheckOutPrompt') }}
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.special-rate-container {
  width: 100%;
}

.pricing-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px dashed var(--border-color);
  min-height: 42px;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 1.25rem;
  }

  .header-main {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--gold-primary);
      letter-spacing: 0.03em;
    }

    .holiday-title {
      font-family: $font-display;
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0.15rem 0 0.1rem;
    }

    .header-desc {
      font-size: 0.84rem;
      color: var(--text-sub);
      margin: 0;
      line-height: 1.4;
    }
  }

  .header-date-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.4rem 0.85rem;
    background: var(--badge-bg);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 0.82rem;
    white-space: nowrap;
    align-self: flex-start;

    @media (min-width: 768px) {
      align-self: center;
    }

    .tag-label {
      color: var(--text-muted);
    }

    .tag-val {
      color: var(--gold-primary);
      font-weight: 600;
    }
  }
}

.special-rate-card {
  padding: 1.25rem 1.35rem;
  background: var(--bg-card);
  border: 1px solid var(--gold-primary);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(197, 168, 128, 0.15);
  margin-bottom: 0.75rem;

  .rate-card-top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.65rem;

    .rate-badge {
      display: inline-flex;
      align-items: center;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--gold-primary);
      letter-spacing: 0.04em;
    }

    .breakfast-badge {
      font-size: 0.75rem;
      padding: 0.2rem 0.6rem;
      background: var(--badge-bg);
      color: var(--gold-primary);
      border: 1px solid var(--gold-primary);
      border-radius: 4px;
      font-weight: 600;

      &.no-breakfast {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        border-color: rgba(239, 68, 68, 0.3);
      }
    }
  }

  .rate-price-row {
    margin-bottom: 0.6rem;
  }

  .rate-perks {
    font-size: 0.84rem;
    color: var(--text-sub);
    line-height: 1.5;
    margin: 0 0 0.85rem;
  }

  .rate-step-prompt {
    padding: 0.65rem 0.85rem;
    background: var(--bg-surface);
    border-radius: 6px;
    border: 1px dashed var(--border-color);
    font-size: 0.82rem;

    .prompt-text {
      color: var(--text-primary);
      font-weight: 500;

      &.highlight-gold {
        color: var(--gold-primary);
        font-weight: 600;
      }
    }
  }
}

.tier-price-wrap {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;

  .currency {
    font-size: 0.82rem;
    color: var(--gold-primary);
    font-weight: 600;
  }

  .price-amount {
    font-family: $font-display;
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--gold-primary);
    letter-spacing: -0.02em;
    line-height: 1;
  }

  .price-unit {
    font-size: 0.76rem;
    color: var(--text-muted);
  }
}
</style>
