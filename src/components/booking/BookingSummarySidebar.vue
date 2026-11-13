<script setup>
import { useI18n } from '../../composables/useI18n'
import pricingData from '../../data/pricing.json'
import channelsData from '../../data/channels.json'
import { 
  Sparkles, 
  Users, 
  Info, 
  ShieldCheck, 
  CheckCircle2, 
  Send, 
  ExternalLink 
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

      <!-- 價格計算明細 -->
      <div v-if="calculation.nights > 0" class="calc-breakdown">
        <div class="calc-row">
          <span>{{ isEn ? 'Stay Duration' : '入住晚數' }}</span>
          <span class="calc-val">{{ calculation.nights }} {{ t('calendar.nights') }}</span>
        </div>
        <div v-if="calculation.weekdayNights > 0" class="calc-row sub">
          <span>{{ isEn ? 'Weekday' : '平日' }} ({{ calculation.weekdayNights }} {{ t('calendar.nights') }} × NT$ {{ pricingData.exclusivePackage.weekday.toLocaleString() }})</span>
          <span>NT$ {{ (calculation.weekdayNights * pricingData.exclusivePackage.weekday).toLocaleString() }}</span>
        </div>
        <div v-if="calculation.weekendNights > 0" class="calc-row sub">
          <span>{{ isEn ? 'Weekend' : '假日' }} ({{ calculation.weekendNights }} {{ t('calendar.nights') }} × NT$ {{ pricingData.exclusivePackage.weekend.toLocaleString() }})</span>
          <span>NT$ {{ (calculation.weekendNights * pricingData.exclusivePackage.weekend).toLocaleString() }}</span>
        </div>
        <div v-if="calculation.holidayNights > 0" class="calc-row sub highlight-holiday">
          <span>{{ isEn ? 'Consecutive Holidays' : '國定連續假期' }} ({{ calculation.holidayNights }} {{ t('calendar.nights') }})</span>
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

      <!-- 官方直訂專屬禮遇 (Perks) -->
      <div class="direct-perks-box">
        <div class="perks-title">
          <ShieldCheck :size="16" class="perk-icon" />
          <span>{{ isEn ? 'Direct Booking Privileges' : '山語 Villa 官方直訂禮遇' }}</span>
        </div>
        <ul class="perks-list">
          <li v-for="(perk, pIdx) in (isEn ? channelsData.directBooking.perksEn : channelsData.directBooking.perksZh)" :key="pIdx">
            <CheckCircle2 :size="13" class="p-check" />
            <span>{{ perk }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- 合作 OTA 渠道標籤 -->
    <div class="ota-channels-footer">
      <span class="ota-label">{{ isEn ? 'Official OTA Partner' : '亦可在官方 Airbnb 預約：' }}</span>
      <div class="ota-badges">
        <a 
          v-for="ota in channelsData.otaPlatforms" 
          :key="ota.id" 
          :href="ota.url" 
          target="_blank" 
          rel="noopener noreferrer"
          class="ota-badge"
          :title="ota.name"
        >
          <span>{{ ota.name }}</span>
          <ExternalLink :size="12" />
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

  .perks-title {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--gold-primary);
    margin-bottom: 0.75rem;

    .perk-icon {
      color: var(--gold-primary);
    }
  }

  .perks-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    li {
      display: flex;
      align-items: flex-start;
      gap: 0.45rem;
      font-size: 0.82rem;
      color: var(--text-sub);
      line-height: 1.5;

      .p-check {
        color: var(--gold-primary);
        flex-shrink: 0;
        margin-top: 2px;
      }
    }
  }
}

.ota-channels-footer {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  .ota-label {
    font-size: 0.78rem;
    color: var(--text-muted);
  }

  .ota-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;

    .ota-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.85rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-size: 0.82rem;
      color: var(--text-sub);
      font-weight: 500;
      transition: $transition-base;

      &:hover {
        border-color: var(--gold-primary);
        color: var(--gold-primary);
        background: var(--bg-card);
      }
    }
  }
}
</style>

