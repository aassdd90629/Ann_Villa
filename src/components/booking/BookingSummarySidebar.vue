<script setup>
import { useI18n } from '../../composables/useI18n'
import { WEEKDAY_TIERS } from '../../composables/useBookingPricing'
import { 
  Sparkles, 
  Users, 
  Info, 
  Send 
} from 'lucide-vue-next'

const props = defineProps({
  checkInDate: {
    type: String,
    default: null
  },
  checkOutDate: {
    type: String,
    default: null
  },
  guestCount: {
    type: Number,
    default: 18
  },
  calculation: {
    type: Object,
    default: () => ({
      nights: 0,
      weekdayNights: 0,
      weekendNights: 0,
      holidayNights: 0,
      holidayTotal: 0,
      baseTotal: 0,
      extraPersonFee: 0,
      grandTotal: 0
    })
  },
  lineBookingUrl: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:guestCount', 'open-booking'])

const { isEn, t } = useI18n()

const handleDecrement = () => {
  if (props.guestCount > 1) {
    emit('update:guestCount', props.guestCount - 1)
  }
}

const handleIncrement = () => {
  if (props.guestCount < 18) {
    emit('update:guestCount', props.guestCount + 1)
  }
}
</script>

<template>
  <div class="booking-summary-col">
    <div class="summary-box">
      <h4 class="summary-heading">
        <Sparkles :size="18" class="text-gold" />
        <span>{{ isEn ? 'Selected Itinerary & Rate' : '預選檔期與費用試算' }}</span>
      </h4>

      <!-- 入住與退房日期展示 -->
      <div class="date-pick-display">
        <div class="date-slot" :class="{ filled: checkInDate }">
          <span class="slot-label">{{ t('calendar.checkIn') }}</span>
          <span class="slot-val">{{ checkInDate || (isEn ? 'Select date' : '點選入住日期') }}</span>
        </div>
        <div class="slot-arrow">→</div>
        <div class="date-slot" :class="{ filled: checkOutDate }">
          <span class="slot-label">{{ t('calendar.checkOut') }}</span>
          <span class="slot-val">{{ checkOutDate || (isEn ? 'Select date' : '點選退房日期') }}</span>
        </div>
      </div>

      <!-- 人數選擇器 -->
      <div class="guests-selector-row">
        <label class="g-label">
          <Users :size="16" />
          <span>{{ t('calendar.guests') }}</span>
        </label>
        <div class="g-control">
          <button 
            type="button"
            class="g-btn" 
            :disabled="guestCount <= 1" 
            @click="handleDecrement"
            aria-label="Decrease guests"
          >-</button>
          <span class="g-count">{{ guestCount }} {{ t('calendar.guestCount') }}</span>
          <button 
            type="button"
            class="g-btn" 
            :disabled="guestCount >= 18" 
            @click="handleIncrement"
            aria-label="Increase guests"
          >+</button>
        </div>
      </div>

      <!-- 平日彈性分級優惠快捷鈕 -->
      <div class="weekday-quick-tiers">
        <span class="quick-title">{{ isEn ? 'Weekday tiers (Mon-Thu):' : '平日分級特惠 (週一~週四)：' }}</span>
        <div class="pills-grid">
          <button
            v-for="tier in WEEKDAY_TIERS"
            :key="tier.price"
            type="button"
            class="pill-btn"
            :class="{ active: guestCount <= tier.max && (tier.min === 1 || guestCount >= tier.min) }"
            @click="emit('update:guestCount', tier.count)"
            :title="isEn ? `Set to ${tier.labelEn}` : `點擊切換為 ${tier.labelZh}`"
          >
            <span class="p-text">{{ tier.labelZh }}</span>
            <span class="p-price">NT$ {{ (tier.price / 1000) }}k</span>
          </button>
        </div>
      </div>

      <!-- 價格計算明細 -->
      <div v-if="calculation.nights > 0" class="calc-breakdown">
        <div class="calc-row">
          <span>{{ isEn ? 'Stay Duration' : '入住晚數' }}</span>
          <span class="calc-val">{{ calculation.nights }} {{ t('calendar.nights') }}</span>
        </div>
        <div v-if="calculation.weekdayNights > 0" class="calc-row sub highlight-weekday">
          <span>{{ isEn ? 'Weekday (Mon-Thu)' : '平日 (週一~週四)' }} ({{ calculation.weekdayTier?.labelZh ? calculation.weekdayTier.labelZh + '・' : '' }}{{ calculation.weekdayNights }} {{ t('calendar.nights') }} × NT$ {{ (calculation.weekdayUnitPrice || 20000).toLocaleString() }}・含早餐)</span>
          <span>NT$ {{ (calculation.weekdayNights * (calculation.weekdayUnitPrice || 20000)).toLocaleString() }}</span>
        </div>
        <div v-if="calculation.weekendNights > 0" class="calc-row sub">
          <span>{{ isEn ? 'Regular Weekend (Fri-Sun)' : '一般假日 (週五~週日)' }} ({{ calculation.weekendNights }} {{ t('calendar.nights') }} × NT$ {{ (calculation.weekendUnitPrice || 35000).toLocaleString() }}・含早餐)</span>
          <span>NT$ {{ (calculation.weekendNights * (calculation.weekendUnitPrice || 35000)).toLocaleString() }}</span>
        </div>
        <div v-if="calculation.holidayNights > 0" class="calc-row sub highlight-holiday">
          <span>{{ isEn ? 'Consecutive Holidays' : '國定連續假期' }} ({{ calculation.holidayNights }} {{ t('calendar.nights') }}・含早餐除過年外)</span>
          <span>NT$ {{ calculation.holidayTotal.toLocaleString() }}</span>
        </div>
        <div v-if="calculation.extraPersonFee > 0" class="calc-row sub">
          <span>{{ isEn ? 'Extra Person Fee' : '加人加床費用' }}</span>
          <span>NT$ {{ calculation.extraPersonFee.toLocaleString() }}</span>
        </div>
        <div class="calc-divider"></div>
        <div class="calc-total-row">
          <span class="total-label">{{ t('calendar.estimatedTotal') }}</span>
          <span class="total-price">NT$ {{ calculation.grandTotal.toLocaleString() }}</span>
        </div>
      </div>

      <div v-else class="calc-placeholder">
        <Info :size="16" />
        <span>{{ t('calendar.selectDates') }}</span>
      </div>

      <!-- 直訂雙軌 CTA -->
      <div class="cta-actions-group">
        <button 
          type="button" 
          class="btn btn-gold btn-block btn-reserve"
          @click="emit('open-booking')"
        >
          <Sparkles :size="18" />
          <span>{{ isEn ? 'Book Directly Online' : '填單直訂（即時預留）' }}</span>
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
}

.summary-box {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;

  .summary-heading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.15rem;
    margin-bottom: 1.25rem;

    .text-gold {
      color: var(--gold-primary);
    }
  }
}

.date-pick-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  background: var(--bg-card);
  padding: 0.75rem 1rem;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  margin-bottom: 1.25rem;

  .date-slot {
    display: flex;
    flex-direction: column;

    .slot-label {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .slot-val {
      font-family: $font-display;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-top: 2px;
    }

    &.filled .slot-val {
      color: var(--gold-primary);
    }
  }

  .slot-arrow {
    color: var(--text-muted);
    font-size: 1.1rem;
  }
}

.guests-selector-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--bg-card);
  border-radius: 4px;
  border: 1px solid var(--border-color);
  margin-bottom: 1.25rem;

  .g-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.88rem;
    color: var(--text-sub);
    font-weight: 500;
  }

  .g-control {
    display: flex;
    align-items: center;
    gap: 0.65rem;

    .g-btn {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 1px solid var(--border-color);
      background: var(--bg-primary);
      color: var(--text-primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      transition: $transition-base;

      &:hover:not(:disabled) {
        border-color: var(--gold-primary);
        color: var(--gold-primary);
      }

      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }

    .g-count {
      font-size: 0.9rem;
      font-weight: 600;
      min-width: 50px;
      text-align: center;
    }
  }
}

.weekday-quick-tiers {
  background: var(--bg-card);
  border: 1px dashed var(--border-gold-subtle, rgba(200, 169, 110, 0.3));
  border-radius: 6px;
  padding: 0.65rem 0.75rem;
  margin-bottom: 1.25rem;

  .quick-title {
    display: block;
    font-size: 0.76rem;
    font-weight: 600;
    color: var(--gold-primary);
    margin-bottom: 0.45rem;
  }

  .pills-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.4rem;

    .pill-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0.35rem 0.2rem;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      background: var(--bg-primary);
      color: var(--text-sub);
      cursor: pointer;
      transition: $transition-base;

      .p-text {
        font-size: 0.72rem;
        font-weight: 500;
      }

      .p-price {
        font-size: 0.74rem;
        font-weight: 700;
        color: var(--gold-primary);
      }

      &.active {
        border-color: var(--gold-primary);
        background: var(--badge-bg);
        color: var(--gold-primary);
        box-shadow: 0 0 6px rgba(200, 169, 110, 0.2);
      }

      &:hover:not(.active) {
        border-color: var(--border-gold-subtle, rgba(200, 169, 110, 0.5));
      }
    }
  }
}

.calc-breakdown {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1.5rem;

  .calc-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.88rem;
    margin-bottom: 0.4rem;
    color: var(--text-sub);

    &.sub {
      font-size: 0.82rem;
      color: var(--text-muted);

      &.highlight-holiday {
        color: var(--gold-primary);
        font-weight: 500;
      }

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

.calc-placeholder {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--bg-card);
  border-radius: 4px;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.cta-actions-group {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-bottom: 1.5rem;

  .btn-reserve {
    padding: 0.9rem 1.5rem;
    font-size: 1rem;
    box-shadow: 0 4px 16px var(--badge-bg);
  }

  .btn-line-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.75rem 1.25rem;
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

.direct-perks-box {
  border-top: 1px solid var(--border-color);
  padding-top: 1.25rem;
}
</style>

