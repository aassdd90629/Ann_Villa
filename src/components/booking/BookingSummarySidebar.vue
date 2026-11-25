<script setup>
import { useI18n } from '../../composables/useI18n'
import { WEEKDAY_TIERS } from '../../composables/useBookingPricing'
import { 
  Sparkles, 
  Users, 
  CalendarDays, 
  Send 
} from 'lucide-vue-next'

const props = defineProps({
  checkInDate: { type: String, default: null },
  checkOutDate: { type: String, default: null },
  guestCount: { type: Number, default: 18 },
  calculation: {
    type: Object,
    default: () => ({ nights: 0, weekdayNights: 0, weekendNights: 0, holidayNights: 0, holidayTotal: 0, baseTotal: 0, extraPersonFee: 0, grandTotal: 0 })
  },
  lineBookingUrl: { type: String, default: '' }
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
        <div class="placeholder-icon">
          <CalendarDays :size="24" class="text-gold" />
        </div>
        <div class="placeholder-content">
          <p class="placeholder-title">{{ t('calendar.selectDates') }}</p>
          <p class="placeholder-desc">{{ isEn ? 'Pick check-in & check-out dates on the calendar to get instant pricing.' : '請於日曆上選擇入住與退房日期，系統將自動即時為您試算包棟總價。' }}</p>
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

.date-pick-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  background: var(--bg-card);
  padding: 0.95rem 1.15rem;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  margin-bottom: 1.35rem;

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
  padding: 0.85rem 1.15rem;
  background: var(--bg-card);
  border-radius: 4px;
  border: 1px solid var(--border-color);
  margin-bottom: 1.35rem;

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
  border: 1px dashed var(--border-color);
  border-radius: 6px;
  padding: 0.75rem 0.85rem;
  margin-bottom: 1.35rem;

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
      padding: 0.45rem 0.25rem;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      background: var(--bg-primary);
      color: var(--text-sub);
      cursor: pointer;
      transition: $transition-base;

      .p-text { font-size: 0.72rem; font-weight: 500; }
      .p-price { font-size: 0.74rem; font-weight: 700; color: var(--gold-primary); }

      &.active {
        border-color: var(--gold-primary);
        background: var(--badge-bg);
        color: var(--gold-primary);
        box-shadow: 0 0 6px rgba(197, 168, 128, 0.2);
      }

      &:hover:not(.active) { border-color: var(--gold-primary); }
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
    font-size: 0.88rem;
    margin-bottom: 0.4rem;
    color: var(--text-sub);

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
</style>

