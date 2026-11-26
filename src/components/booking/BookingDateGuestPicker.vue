<script setup>
import { useI18n } from '../../composables/useI18n'
import { WEEKDAY_TIERS, useBookingPricing } from '../../composables/useBookingPricing'
import { Users } from 'lucide-vue-next'

const props = defineProps({
  checkInDate: { type: String, default: null },
  checkOutDate: { type: String, default: null },
  guestCount: { type: Number, default: 18 },
  calculation: {
    type: Object,
    default: () => null
  }
})

const emit = defineEmits(['update:guestCount'])

const { isEn, t } = useI18n()
const { dynamicWeekdayTiers } = useBookingPricing()

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
  <div class="date-guest-picker-wrapper">
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

    <!-- 平日彈性分級優惠快捷鈕 (右上側欄：精簡俐落，完全契合側欄寬度) -->
    <div class="weekday-quick-tiers">
      <div class="quick-title-row">
        <span class="quick-title">{{ isEn ? 'Weekday tiers (Mon-Thu):' : '平日分級特惠 (週一~週四適用)：' }}</span>
        <span class="capacity-hint">{{ isEn ? 'Breakfast included' : '皆含手作早餐' }}</span>
      </div>
      <div class="pills-grid">
        <button
          v-for="tier in (dynamicWeekdayTiers || WEEKDAY_TIERS)"
          :key="tier.price"
          type="button"
          class="pill-btn"
          :class="{ active: guestCount <= tier.max && (tier.min === 1 || guestCount >= tier.min) }"
          @click="emit('update:guestCount', tier.count)"
          :title="isEn ? `Set to ${tier.labelEn}` : `點擊切換為 ${tier.labelZh}`"
        >
          <span class="p-text">{{ isEn ? tier.labelEn : tier.labelZh }}</span>
          <span class="p-price">NT$ {{ (tier.price / 1000) }}k</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.date-guest-picker-wrapper {
  display: flex;
  flex-direction: column;
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

  .quick-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.45rem;

    .quick-title {
      font-size: 0.76rem;
      font-weight: 600;
      color: var(--gold-primary);
    }

    .capacity-hint {
      font-size: 0.68rem;
      color: var(--text-muted);
    }
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
        box-shadow: 0 0 6px rgba(197, 168, 128, 0.2);
      }

      &:hover:not(.active) {
        border-color: var(--gold-primary);
      }
    }
  }
}
</style>
