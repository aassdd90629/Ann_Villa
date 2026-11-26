<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { WEEKDAY_TIERS, useBookingPricing } from '../../composables/useBookingPricing'
import { Sparkles, Users, Check, CalendarDays, ChevronDown, ChevronUp } from 'lucide-vue-next'
import SpecialRateDisplayCard from './SpecialRateDisplayCard.vue'

const props = defineProps({
  selectedDate: { type: String, default: '' },
  checkOutDate: { type: String, default: '' },
  currentGuests: { type: Number, default: 18 },
  calculation: { type: Object, default: () => null }
})

const emit = defineEmits(['apply-tier'])

const { isEn } = useI18n()
const { getHolidayForDate, isWeekdayDate, isWeekendDate } = useBookingPricing()

const showWeekdayTiers = ref(false)

watch(() => props.selectedDate, () => {
  showWeekdayTiers.value = false
})

const selectedHoliday = computed(() => {
  if (!props.selectedDate) return null
  return getHolidayForDate(props.selectedDate)
})

const isSelectedWeekend = computed(() => {
  if (!props.selectedDate) return false
  return isWeekendDate(props.selectedDate)
})

const isTierActive = (tier) => {
  return props.currentGuests <= tier.max && (tier.min === 1 || props.currentGuests >= tier.min)
}

const selectTier = (tier) => {
  emit('apply-tier', tier.count)
}

const formattedDateText = computed(() => {
  if (!props.selectedDate) return ''
  const [y, m, d] = props.selectedDate.split('-').map(Number)
  const dt = new Date(y, m - 1, d, 12, 0, 0)
  if (isNaN(dt.getTime())) return props.selectedDate
  const dayNamesZh = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayStr = isEn.value ? dayNamesEn[dt.getDay()] : dayNamesZh[dt.getDay()]
  return `${props.selectedDate} (${dayStr})`
})
</script>

<template>
  <div class="weekday-pricing-section">
    <!-- 當點選為【國定連續假期】或【一般假日】時，呈現專屬特惠卡片 -->
    <template v-if="selectedHoliday || isSelectedWeekend">
      <SpecialRateDisplayCard
        :selected-date="selectedDate"
        :check-out-date="checkOutDate"
        :formatted-date-text="formattedDateText"
        :holiday="selectedHoliday"
        :is-weekend="isSelectedWeekend"
        :calculation="calculation"
      />

      <div class="toggle-weekday-row">
        <button type="button" class="btn-toggle-weekday" @click="showWeekdayTiers = !showWeekdayTiers">
          <span>{{ showWeekdayTiers ? (isEn ? 'Hide weekday tiered rates' : '收合平日分級特惠參考') : (isEn ? 'View regular weekday tiered rates (Mon-Thu)' : '查看常態平日分級特惠參考 (週一~週四)') }}</span>
          <ChevronUp v-if="showWeekdayTiers" :size="14" />
          <ChevronDown v-else :size="14" />
        </button>
      </div>
    </template>

    <!-- 常態平日分級特惠區塊 (未選日期、選平日或手動展開時顯示) -->
    <template v-if="(!selectedHoliday && !isSelectedWeekend) || showWeekdayTiers">
      <div class="pricing-header" :class="{ 'mt-sub-section': selectedHoliday || isSelectedWeekend }">
        <div class="header-main">
          <div class="header-badge">
            <Sparkles :size="15" class="text-gold" />
            <span>{{ isEn ? 'Weekday Buyout Privilege' : '平日專屬包棟特惠' }}</span>
          </div>
          <p class="header-desc">
            {{ isEn ? 'Mon - Thu stay. Select party size for tailored pricing (All include breakfast):' : '週一至週四入住・依人數彈性計價，享整座莊園私密包棟（皆含早餐）：' }}
          </p>
        </div>

        <div class="header-date-tag">
          <CalendarDays :size="14" class="text-gold" />
          <template v-if="selectedDate">
            <span class="tag-label">{{ isEn ? 'Check-in:' : '預選入住：' }}</span>
            <strong class="tag-val">{{ formattedDateText }}</strong>
          </template>
          <template v-else>
            <span class="tag-label">{{ isEn ? 'Select check-in on calendar' : '點選日曆開始預訂' }}</span>
          </template>
        </div>
      </div>

      <div class="tiers-grid">
        <div 
          v-for="tier in WEEKDAY_TIERS" 
          :key="tier.price"
          class="tier-card"
          :class="{ active: isTierActive(tier) }"
          role="button"
          tabindex="0"
          :aria-pressed="isTierActive(tier)"
          @click="selectTier(tier)"
          @keydown.enter.space.prevent="selectTier(tier)"
        >
          <div class="tier-card-top">
            <div class="tier-label-wrap">
              <Users :size="16" class="text-gold" />
              <span class="tier-label">{{ isEn ? tier.labelEn : tier.labelZh }}</span>
            </div>

            <span v-if="isTierActive(tier)" class="status-badge active-badge">
              <Check :size="12" />
              <span>{{ isEn ? 'Active' : '目前套用' }}</span>
            </span>
            <span v-else class="status-badge tap-hint">
              <span>{{ isEn ? 'Tap to apply' : '點選套用' }}</span>
            </span>
          </div>

          <div class="tier-price-wrap">
            <span class="currency">NT$</span>
            <span class="price-amount">{{ tier.price.toLocaleString() }}</span>
            <span class="price-unit">{{ isEn ? '/ night' : '/ 晚' }}</span>
          </div>

          <p class="tier-summary">
            <template v-if="tier.max === 10">
              {{ isEn ? 'Exclusive 5 suites & grounds for intimate groups & small families.' : '享全棟 5 間客房與所有公設，小家庭與好友專屬' }}
            </template>
            <template v-else-if="tier.max === 14">
              {{ isEn ? 'Comfortable space for medium gathering with KTV & mahjong.' : '中型朋友聚會首選，歡唱 KTV、電動麻將與戶外空間' }}
            </template>
            <template v-else>
              {{ isEn ? 'Full capacity up to 18 guests with full luxury perks.' : '全棟頂級尊榮享受，最多可容納 18 位貴賓同樂放鬆' }}
            </template>
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.weekday-pricing-section {
  width: 100%;
  margin-top: 1.25rem;
  margin-bottom: 1.25rem;
  padding: 1.35rem 1.25rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  min-height: 210px;

  @media (min-width: $bp-sm) {
    padding: 1.5rem 1.6rem;
  }
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

  &.mt-sub-section {
    margin-top: 1.25rem;
    padding-top: 1.25rem;
    border-top: 1px dashed var(--border-color);
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

.toggle-weekday-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.45rem;
  margin-bottom: 0.35rem;

  .btn-toggle-weekday {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 0.78rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    transition: color 0.2s ease;

    &:hover {
      color: var(--gold-primary);
    }
  }
}

.tiers-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  align-items: stretch;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.tier-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 125px;
  padding: 1.15rem 1.15rem 1.25rem;
  border-radius: 8px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  cursor: pointer;
  outline: none;
  text-align: left;
  user-select: none;
  transition: border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    border-color: var(--gold-primary);
    background: var(--badge-bg);

    .status-badge.tap-hint {
      color: var(--gold-primary);
      border-color: var(--gold-primary);
      background: var(--bg-surface);
    }
  }

  &:focus-visible {
    border-color: var(--gold-primary);
    box-shadow: 0 0 0 2px var(--gold-primary);
  }

  &.active {
    border-color: var(--gold-primary);
    background: var(--badge-bg);
    box-shadow: 0 4px 16px rgba(197, 168, 128, 0.18);

    .tier-label {
      color: var(--gold-primary);
      font-weight: 700;
    }
  }

  .tier-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.65rem;

    .tier-label-wrap {
      display: flex;
      align-items: center;
      gap: 0.4rem;

      .tier-label {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      transition: $transition-base;

      &.active-badge {
        background: var(--gold-primary);
        color: var(--bg-card);
        font-weight: 700;
      }

      &.tap-hint {
        color: var(--text-muted);
        background: transparent;
        border: 1px dashed var(--border-color);
      }
    }
  }

  .tier-price-wrap {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    margin-bottom: 0.55rem;

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

  .tier-summary {
    font-size: 0.8rem;
    color: var(--text-sub);
    line-height: 1.45;
    margin: 0;
    flex-grow: 1;
    min-height: 2.9em;
  }
}
</style>
