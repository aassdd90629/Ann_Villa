<script setup>
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { WEEKDAY_TIERS } from '../../composables/useBookingPricing'
import { X, Sparkles, Users, Check, CalendarDays } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  selectedDate: {
    type: String,
    default: ''
  },
  currentGuests: {
    type: Number,
    default: 18
  }
})

const emit = defineEmits(['update:modelValue', 'apply-tier'])

const { isEn } = useI18n()

const closeModal = () => {
  emit('update:modelValue', false)
}

const selectTier = (tier) => {
  emit('apply-tier', tier.count)
  closeModal()
}

// 格式化日期星期
const formattedDateText = computed(() => {
  if (!props.selectedDate) return ''
  const d = new Date(props.selectedDate)
  if (isNaN(d.getTime())) return props.selectedDate
  const dayNamesZh = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayStr = isEn.value ? dayNamesEn[d.getDay()] : dayNamesZh[d.getDay()]
  return `${props.selectedDate} (${dayStr})`
})
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="weekday-modal-overlay" @click.self="closeModal">
      <div class="weekday-modal-card card-luxury" role="dialog" aria-modal="true">
        <!-- 關閉按鈕 -->
        <button class="modal-close-btn" @click="closeModal" aria-label="Close modal">
          <X :size="20" />
        </button>

        <!-- 頂部標題區 -->
        <div class="modal-header">
          <div class="header-icon-wrap">
            <Sparkles :size="24" class="text-gold" />
          </div>
          <div class="header-text">
            <span class="badge-tag">
              <CalendarDays :size="13" />
              <span>{{ isEn ? 'Weekday Special Privilege' : '平日專屬包棟特惠' }}</span>
            </span>
            <h3 class="modal-title">{{ isEn ? 'Weekday Flexible Pricing' : '平日彈性人數包棟價目' }}</h3>
            <p class="modal-subtitle">
              {{ isEn ? 'Weekdays are Mon - Thu. Rates are tiered by guest count (All include breakfast):' : '平日為【星期一至星期四】，依實際入住人數享有包棟特惠價（皆含早餐）：' }}
            </p>
          </div>
        </div>

        <div v-if="selectedDate" class="selected-date-banner">
          <span>{{ isEn ? 'Selected Check-in Date:' : '您選取的入住日期：' }}</span>
          <strong>{{ formattedDateText }}</strong>
        </div>

        <!-- 三大人數階梯卡片 -->
        <div class="tiers-grid">
          <div 
            v-for="tier in WEEKDAY_TIERS" 
            :key="tier.price"
            class="tier-card"
            :class="{ active: currentGuests <= tier.max && (tier.min === 1 || currentGuests >= tier.min) }"
          >
            <div class="tier-card-head">
              <div class="tier-people">
                <Users :size="16" class="text-gold" />
                <span class="p-label">{{ isEn ? tier.labelEn : tier.labelZh }}</span>
              </div>
              <span v-if="currentGuests <= tier.max && (tier.min === 1 || currentGuests >= tier.min)" class="current-badge">
                <Check :size="12" />
                <span>{{ isEn ? 'Current Selection' : '目前套用中' }}</span>
              </span>
            </div>

            <div class="tier-price-row">
              <span class="currency">NT$</span>
              <span class="amount">{{ tier.price.toLocaleString() }}</span>
              <span class="unit">{{ isEn ? '/ night (w/ Breakfast)' : '/ 晚 (含早餐)' }}</span>
            </div>

            <p class="tier-desc">
              <template v-if="tier.max === 10">
                {{ isEn ? 'Ideal for intimate groups & small families. Full exclusive estate privacy with breakfast.' : '10人以下2萬元含早餐。小家庭與摯友首選，享全棟5間客房與所有公設。' }}
              </template>
              <template v-else-if="tier.max === 14">
                {{ isEn ? 'Comfortable space for medium gathering with breakfast included.' : '11-14人以下2.5萬元含早餐。中型團體推薦，頂級KTV、電動麻將與戶外空間。' }}
              </template>
              <template v-else>
                {{ isEn ? 'Full capacity up to 18 guests with breakfast included.' : '15-18人以下3萬元含早餐。全棟頂級享受，最多可容納18位貴賓同樂放鬆。' }}
              </template>
            </p>

            <button 
              type="button" 
              class="btn-tier-select"
              @click="selectTier(tier)"
            >
              <span>{{ isEn ? `Select ${tier.labelEn} (NT$ ${tier.price.toLocaleString()} w/ Breakfast)` : `選擇 ${tier.labelZh} (${(tier.price / 10000)}萬元含早餐)` }}</span>
            </button>
          </div>
        </div>

        <!-- 底部說明 -->
        <div class="modal-footer-notes">
          <ul class="policy-note-list">
            <li><strong>{{ isEn ? 'Weekdays (Mon-Thu):' : '平日 (週一至週四)：' }}</strong>{{ isEn ? '≤10 guests NT$20,000 / 11-14 guests NT$25,000 / 15-18 guests NT$30,000 (All include breakfast)' : '10人以下2萬元含早餐、11-14人以下2.5萬元含早餐、15-18人以下3萬元含早餐' }}</li>
            <li><strong>{{ isEn ? 'Weekends (Fri-Sun):' : '一般假日 (週五、六、日)：' }}</strong>{{ isEn ? 'NT$ 35,000 / night (Includes breakfast)' : '3.5萬元含早餐' }}</li>
            <li><strong>{{ isEn ? 'Holidays:' : '國定假日：' }}</strong>{{ isEn ? 'Calculated from the eve of the holiday (Includes breakfast), except Lunar New Year (breakfast not provided)' : '一律自國定假日前一天起算國定假日房價含早餐，但過年房價不提供早餐' }}</li>
          </ul>
          <div class="modal-btn-row">
            <button type="button" class="btn btn-outline btn-close-confirm" @click="closeModal">
              <span>{{ isEn ? 'Continue Booking' : '我知道了，繼續預訂' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.weekday-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  animation: fadeInOverlay 0.25s ease-out;
}

@keyframes fadeInOverlay {
  from { opacity: 0; }
  to { opacity: 1; }
}

.weekday-modal-card {
  position: relative;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--bg-surface, #1e2420);
  border: 1px solid var(--border-gold-subtle, rgba(200, 169, 110, 0.3));
  border-radius: 1.25rem;
  padding: 2rem 2.25rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  animation: scaleUpCard 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  @media (max-width: 768px) {
    padding: 1.5rem 1.25rem;
    border-radius: 1rem;
  }
}

@keyframes scaleUpCard {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-close-btn {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: var(--text-primary);
    transform: rotate(90deg);
  }
}

.modal-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;

  .header-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(200, 169, 110, 0.12);
    border: 1px solid rgba(200, 169, 110, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .badge-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--gold-primary, #c8a96e);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 0.25rem;
  }

  .modal-title {
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 0.25rem;
  }

  .modal-subtitle {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.45;
  }
}

.selected-date-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  margin-bottom: 1.25rem;
  background: rgba(200, 169, 110, 0.08);
  border: 1px dashed rgba(200, 169, 110, 0.35);
  border-radius: 0.5rem;
  font-size: 0.88rem;
  color: var(--text-primary);

  strong {
    color: var(--gold-primary, #c8a96e);
  }
}

.tiers-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 0.85rem;
  }
}

.tier-card {
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1rem;
  border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.25s ease;

  &.active {
    background: rgba(200, 169, 110, 0.1);
    border-color: var(--gold-primary, #c8a96e);
    box-shadow: 0 0 15px rgba(200, 169, 110, 0.15);
  }

  &:hover {
    border-color: rgba(200, 169, 110, 0.6);
    transform: translateY(-2px);
  }

  .tier-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;

    .tier-people {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-weight: 600;
      font-size: 0.95rem;
      color: var(--text-primary);
    }

    .current-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      font-size: 0.72rem;
      padding: 0.15rem 0.4rem;
      background: var(--gold-primary, #c8a96e);
      color: #121614;
      font-weight: 700;
      border-radius: 0.25rem;
    }
  }

  .tier-price-row {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    margin-bottom: 0.6rem;

    .currency {
      font-size: 0.85rem;
      color: var(--gold-primary, #c8a96e);
      font-weight: 600;
    }

    .amount {
      font-size: 1.45rem;
      font-weight: 800;
      color: var(--gold-primary, #c8a96e);
      letter-spacing: -0.02em;
    }

    .unit {
      font-size: 0.78rem;
      color: var(--text-muted);
    }
  }

  .tier-desc {
    font-size: 0.82rem;
    color: var(--text-secondary);
    line-height: 1.45;
    margin: 0 0 1rem;
    flex-grow: 1;
  }

  .btn-tier-select {
    width: 100%;
    padding: 0.55rem 0.5rem;
    font-size: 0.82rem;
    font-weight: 600;
    border-radius: 0.5rem;
    border: 1px solid var(--gold-primary, #c8a96e);
    background: transparent;
    color: var(--gold-primary, #c8a96e);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: var(--gold-primary, #c8a96e);
      color: #121614;
    }
  }
}

.modal-footer-notes {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 1.25rem;

  .policy-note-list {
    list-style: none;
    padding: 0;
    margin: 0 0 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;

    li {
      font-size: 0.8rem;
      color: var(--text-secondary);
      line-height: 1.45;

      strong {
        color: var(--gold-primary, #c8a96e);
      }
    }
  }

  .modal-btn-row {
    display: flex;
    justify-content: flex-end;

    .btn-close-confirm {
      padding: 0.6rem 1.5rem;
      font-size: 0.9rem;
    }
  }
}
</style>
