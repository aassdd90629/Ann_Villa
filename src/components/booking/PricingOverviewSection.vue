<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { WEEKDAY_TIERS, useBookingPricing } from '../../composables/useBookingPricing'
import { Sparkles, CalendarCheck, PartyPopper, Users, Check, CalendarDays } from 'lucide-vue-next'

const props = defineProps({
  selectedDate: { type: String, default: '' },
  checkOutDate: { type: String, default: '' },
  currentGuests: { type: Number, default: 18 },
  calculation: { type: Object, default: () => null }
})

const emit = defineEmits(['apply-tier'])
const { isEn, t } = useI18n()
const { getHolidayForDate, isWeekdayDate, isWeekendDate, pricingData, dynamicWeekdayTiers, maxCapacity } = useBookingPricing()

const DEFAULT_HOLIDAY_TIERS = [
  { price: 35000, labelZh: '端午/中秋等', labelEn: 'Dragon/Moon', tagZh: 'NT$ 35,000' },
  { price: 38000, labelZh: '和平紀念日/清明等', labelEn: 'Memorial/Tomb', tagZh: 'NT$ 38,000' },
  { price: 40000, labelZh: '聖誕節連假專案', labelEn: 'Christmas Special', tagZh: 'NT$ 40,000' },
  { price: 47000, labelZh: '跨年/元旦假期', labelEn: 'New Year Holiday', tagZh: 'NT$ 47,000' },
  { price: 50000, labelZh: '農曆春節過年', labelEn: 'Lunar New Year', tagZh: 'NT$ 50,000' }
]

const weekendPrice = computed(() => props.calculation?.weekendUnitPrice || pricingData.value?.exclusivePackage?.weekend || 35000)

const dynamicHolidayTiers = computed(() => {
  const list = pricingData.value?.holidays || []
  if (!list.length) return DEFAULT_HOLIDAY_TIERS
  const priceMap = new Map()
  list.forEach(h => {
    const p = Number(h.price)
    if (!p) return
    if (!priceMap.has(p)) priceMap.set(p, [])
    const name = (h.nameZh || h.name || '').replace(/^\d{4}\s*/, '').replace(/連假|假期/, '')
    if (name && !priceMap.get(p).includes(name)) priceMap.get(p).push(name)
  })
  const prices = Array.from(priceMap.keys()).sort((a, b) => a - b)
  if (!prices.length) return DEFAULT_HOLIDAY_TIERS
  return prices.map(price => {
    const names = priceMap.get(price)
    const labelZh = names.length > 2 ? `${names.slice(0, 2).join('/')}等` : names.join('/')
    return { price, labelZh: labelZh || '連續假期專案', labelEn: 'Holiday Special', tagZh: `NT$ ${price.toLocaleString()}` }
  })
})

const activeTab = ref('weekday')
const selectedHoliday = computed(() => props.selectedDate ? getHolidayForDate(props.selectedDate) : null)
const isSelectedWeekend = computed(() => props.selectedDate ? isWeekendDate(props.selectedDate) : false)
const isSelectedWeekday = computed(() => props.selectedDate ? isWeekdayDate(props.selectedDate) : false)

watch(
  () => [props.selectedDate, props.checkOutDate, props.calculation?.nights],
  () => {
    if (selectedHoliday.value || props.calculation?.holidayNights > 0) activeTab.value = 'holiday'
    else if (isSelectedWeekend.value || props.calculation?.weekendNights > 0) activeTab.value = 'weekend'
    else if (isSelectedWeekday.value || props.calculation?.weekdayNights > 0) activeTab.value = 'weekday'
  },
  { immediate: true }
)

const formattedDateText = computed(() => {
  if (!props.selectedDate) return ''
  const [y, m, d] = props.selectedDate.split('-').map(Number)
  const dt = new Date(y, m - 1, d, 12, 0, 0)
  if (isNaN(dt.getTime())) return props.selectedDate
  const dayNamesZh = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return `${props.selectedDate} (${isEn.value ? dayNamesEn[dt.getDay()] : dayNamesZh[dt.getDay()]})`
})

const isTierActive = (tier) => props.currentGuests <= tier.max && (tier.min === 1 || props.currentGuests >= tier.min)
const selectTier = (tier) => emit('apply-tier', tier.count)
</script>

<template>
  <div class="pricing-overview-section">
    <div class="pricing-header">
      <div class="header-main">
        <div class="header-badge">
          <Sparkles :size="15" class="text-gold" />
          <span>{{ t('pricingOverview.badge') }}</span>
        </div>
        <p class="header-desc">
          {{ t('pricingOverview.desc') }}
        </p>
      </div>
      <div class="header-date-tag">
        <CalendarDays :size="14" class="text-gold" />
        <span class="tag-label">{{ selectedDate ? t('pricingOverview.checkInLabel') : t('pricingOverview.selectDatePrompt') }}</span>
        <strong v-if="selectedDate" class="tag-val">{{ formattedDateText }}</strong>
      </div>
    </div>

    <!-- 價格分類切換 Tabs -->
    <div class="tier-nav-tabs" role="tablist">
      <button type="button" class="tab-btn" :class="{ active: activeTab === 'weekday' }" @click="activeTab = 'weekday'">
        <Sparkles :size="13" />
        <span>{{ t('pricingOverview.tabWeekday') }}</span>
      </button>
      <button type="button" class="tab-btn" :class="{ active: activeTab === 'weekend' }" @click="activeTab = 'weekend'">
        <CalendarCheck :size="13" />
        <span>{{ t('pricingOverview.tabWeekend') }}</span>
      </button>
      <button type="button" class="tab-btn" :class="{ active: activeTab === 'holiday' }" @click="activeTab = 'holiday'">
        <PartyPopper :size="13" />
        <span>{{ t('pricingOverview.tabHoliday') }}</span>
      </button>
    </div>

    <!-- Tab 1: 平日分級特惠卡片 (3欄寬敞展開) -->
    <div v-if="activeTab === 'weekday'" class="tab-panel">
      <div class="tiers-grid">
        <div
          v-for="tier in (dynamicWeekdayTiers || WEEKDAY_TIERS)"
          :key="tier.price"
          class="tier-card"
          :class="{ active: isTierActive(tier) }"
          role="button"
          tabindex="0"
          @click="selectTier(tier)"
          @keydown.enter.space.prevent="selectTier(tier)"
        >
          <div class="tier-card-top">
            <div class="tier-label-wrap">
              <Users :size="15" class="text-gold" />
              <span class="tier-label">{{ isEn ? tier.labelEn : tier.labelZh }}</span>
            </div>
            <span v-if="isTierActive(tier)" class="status-badge active-badge"><Check :size="12" /><span>{{ t('pricingOverview.applied') }}</span></span>
            <span v-else class="status-badge tap-hint"><span>{{ t('pricingOverview.tapToApply') }}</span></span>
          </div>
          <div class="tier-price-wrap">
            <span class="currency">NT$</span>
            <span class="price-amount">{{ tier.price.toLocaleString() }}</span>
            <span class="price-unit">{{ t('pricingOverview.perNight') }}</span>
          </div>
          <p class="tier-summary">
            <template v-if="tier.count === (pricingData?.weekdayTier1MaxGuests || 10)">{{ t('pricingOverview.tierSummary1') }}</template>
            <template v-else-if="tier.count === (pricingData?.weekdayTier2MaxGuests || 14)">{{ t('pricingOverview.tierSummary2') }}</template>
            <template v-else>{{ t('pricingOverview.tierSummary3', { max: maxCapacity }) }}</template>
          </p>
        </div>
      </div>
    </div>

    <!-- Tab 2: 一般假日價格卡片 (寬版橫幅) -->
    <div v-else-if="activeTab === 'weekend'" class="tab-panel">
      <div class="weekend-feature-card">
        <div class="wf-content">
          <div class="wf-badge"><CalendarCheck :size="14" class="text-gold" /><span>{{ t('pricingOverview.weekendBuyoutBadge') }}</span></div>
          <h4 class="wf-title">{{ t('pricingOverview.weekendTitle') }}</h4>
          <p class="wf-desc">{{ t('pricingOverview.weekendDesc', { max: maxCapacity }) }}</p>
          <div class="wf-perks">
            <span class="perk-pill">{{ t('pricingOverview.weekendPerk1') }}</span>
            <span class="perk-pill">{{ t('pricingOverview.weekendPerk2', { max: maxCapacity }) }}</span>
            <span class="perk-pill">{{ t('pricingOverview.weekendPerk3') }}</span>
          </div>
        </div>
        <div class="wf-price-box">
          <div class="wf-p-row"><span class="currency">NT$</span><span class="price-amount">{{ weekendPrice.toLocaleString() }}</span><span class="price-unit">{{ t('pricingOverview.perNight') }}</span></div>
          <button type="button" class="btn-apply-weekend" @click="emit('apply-tier', maxCapacity)">{{ t('pricingOverview.applyWeekendBtn', { max: maxCapacity }) }}</button>
        </div>
      </div>
    </div>

    <!-- Tab 3: 國定連續假期專案 (寬敞網格呈現各連假價格) -->
    <div v-else-if="activeTab === 'holiday'" class="tab-panel">
      <div class="holiday-overview-wrap">
        <div class="holiday-header-bar">
          <span class="h-title">{{ t('pricingOverview.holidayPackagesTitle') }}</span>
          <span v-if="selectedHoliday" class="active-h-tag">{{ t('pricingOverview.selectedHolidayPrefix') }} {{ selectedHoliday.nameZh || selectedHoliday.name }}</span>
        </div>
        <div class="holiday-cards-grid">
          <div v-for="hTier in dynamicHolidayTiers" :key="hTier.price" class="holiday-rate-card" :class="{ active: selectedHoliday && Number(selectedHoliday.price) === hTier.price }">
            <div class="h-name">{{ isEn ? hTier.labelEn : hTier.labelZh }}</div>
            <div class="h-price">NT$ {{ hTier.price.toLocaleString() }}</div>
            <div class="h-unit">{{ t('pricingOverview.perNight') }}</div>
          </div>
        </div>
        <p class="holiday-footer-notice">{{ t('pricingOverview.holidayFooter', { max: maxCapacity }) }}</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.pricing-overview-section {
  width: 100%;
  margin: 1.25rem 0;
  padding: 1.35rem 1.25rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  min-height: 220px;
  @media (min-width: $bp-sm) { padding: 1.5rem 1.6rem; }
}

.pricing-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px dashed var(--border-color);
  @media (min-width: 768px) { flex-direction: row; align-items: center; justify-content: space-between; }
  .header-main {
    display: flex; flex-direction: column; gap: 0.3rem;
    .header-badge { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.95rem; font-weight: 700; color: var(--gold-primary); }
    .header-desc { font-size: 0.84rem; color: var(--text-sub); margin: 0; line-height: 1.4; }
  }
  .header-date-tag {
    display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.4rem 0.85rem; background: var(--badge-bg);
    border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.82rem; white-space: nowrap;
    .tag-label { color: var(--text-muted); }
    .tag-val { color: var(--gold-primary); font-weight: 600; }
  }
}

.tier-nav-tabs {
  display: flex; 
  gap: 0.5rem; 
  margin-bottom: 1.15rem; 
  flex-wrap: wrap;

  @media (max-width: $bp-sm) {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 0.35rem;
    -webkit-overflow-scrolling: touch;
    gap: 0.45rem;

    .tab-btn {
      white-space: nowrap;
      flex-shrink: 0;
      padding: 0.45rem 0.85rem;
      font-size: 0.8rem;
    }
  }

  .tab-btn {
    display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.5rem 1rem; font-size: 0.84rem; font-weight: 600;
    border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-primary); color: var(--text-sub); cursor: pointer; transition: $transition-base;
    &.active { background: var(--badge-bg); border-color: var(--gold-primary); color: var(--gold-primary); box-shadow: 0 0 8px rgba(197, 168, 128, 0.15); }
    &:hover:not(.active) { border-color: var(--gold-primary); color: var(--text-primary); }
  }
}

.tiers-grid {
  display: grid; grid-template-columns: 1fr; gap: 1rem;
  @media (min-width: $bp-md) { grid-template-columns: repeat(3, 1fr); }
}

.tier-card {
  display: flex; flex-direction: column; padding: 1.15rem 1.15rem 1.25rem; border-radius: 8px; background: var(--bg-card);
  border: 1px solid var(--border-color); cursor: pointer; transition: border-color 0.25s ease, background 0.25s ease;

  @media (max-width: $bp-sm) {
    padding: 1rem;
  }

  &:hover { border-color: var(--gold-primary); background: var(--badge-bg); }
  &.active { border-color: var(--gold-primary); background: var(--badge-bg); box-shadow: 0 0 12px rgba(197, 168, 128, 0.22); }

  .tier-card-top {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;
    .tier-label-wrap { display: flex; align-items: center; gap: 0.45rem; font-weight: 600; font-size: 0.95rem; color: var(--text-primary); }
    .status-badge {
      display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.72rem; padding: 0.2rem 0.5rem; border-radius: 4px;
      &.active-badge { background: var(--gold-primary); color: #fff; font-weight: 600; }
      &.tap-hint { color: var(--text-muted); border: 1px solid var(--border-color); }
    }
  }

  .tier-price-wrap {
    display: flex; align-items: baseline; gap: 0.25rem; margin-bottom: 0.65rem;
    .currency { font-size: 0.85rem; color: var(--gold-primary); font-weight: 600; }
    .price-amount { font-family: $font-display; font-size: 1.55rem; font-weight: 700; color: var(--gold-primary); }
    .price-unit { font-size: 0.8rem; color: var(--text-muted); }
  }

  .tier-summary { font-size: 0.82rem; color: var(--text-sub); line-height: 1.45; margin: 0; }
}

.weekend-feature-card {
  display: flex; flex-direction: column; justify-content: space-between; gap: 1.25rem; padding: 1.4rem 1.5rem;
  background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px;
  @media (min-width: 768px) { flex-direction: row; align-items: center; }

  .wf-content {
    display: flex; flex-direction: column; gap: 0.45rem;
    .wf-badge { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 600; color: var(--gold-primary); }
    .wf-title { font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .wf-desc { font-size: 0.84rem; color: var(--text-sub); margin: 0; line-height: 1.45; max-width: 580px; }
    .wf-perks { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.35rem; }
    .perk-pill { font-size: 0.76rem; color: var(--gold-primary); background: var(--badge-bg); padding: 0.2rem 0.55rem; border-radius: 4px; border: 1px solid var(--border-color); }
  }

  .wf-price-box {
    display: flex; flex-direction: column; align-items: flex-start; gap: 0.4rem; padding-left: 0;
    @media (min-width: 768px) { align-items: flex-end; border-left: 1px dashed var(--border-color); padding-left: 1.75rem; }
    .wf-p-row { display: flex; align-items: baseline; gap: 0.25rem; }
    .currency { font-size: 0.9rem; color: var(--gold-primary); font-weight: 600; }
    .price-amount { font-family: $font-display; font-size: 1.85rem; font-weight: 700; color: var(--gold-primary); }
    .price-unit { font-size: 0.8rem; color: var(--text-muted); }
    .btn-apply-weekend {
      margin-top: 0.45rem; padding: 0.4rem 0.9rem; background: var(--badge-bg); border: 1px solid var(--gold-primary);
      color: var(--gold-primary); border-radius: 4px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: $transition-base;
      &:hover { background: var(--gold-primary); color: #fff; }
    }
  }
}

.holiday-overview-wrap {
  display: flex; flex-direction: column; gap: 0.85rem;
  .holiday-header-bar {
    display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; flex-wrap: wrap;
    .h-title { font-size: 0.88rem; font-weight: 600; color: var(--text-primary); }
    .active-h-tag { font-size: 0.8rem; font-weight: 600; color: var(--gold-primary); background: var(--badge-bg); border: 1px solid var(--gold-primary); padding: 0.25rem 0.65rem; border-radius: 4px; }
  }
  .holiday-cards-grid {
    display: grid; 
    grid-template-columns: repeat(2, 1fr); 
    gap: 0.65rem;

    @media (min-width: $bp-sm) { 
      grid-template-columns: repeat(3, 1fr); 
      gap: 0.75rem; 
    }

    @media (min-width: $bp-lg) { 
      grid-template-columns: repeat(5, 1fr); 
    }

    .holiday-rate-card {
      display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.85rem 0.5rem;
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 6px; text-align: center; transition: $transition-base;
      word-break: break-word;
      .h-name { font-size: 0.8rem; font-weight: 600; color: var(--text-sub); margin-bottom: 0.35rem; }
      .h-price { font-family: $font-display; font-size: 1.05rem; font-weight: 700; color: var(--gold-dark); }
      .h-unit { font-size: 0.72rem; color: var(--text-muted); }
      &.active { border-color: var(--gold-primary); background: var(--badge-bg); box-shadow: 0 0 10px rgba(197, 168, 128, 0.2); .h-name { color: var(--gold-primary); font-weight: 700; } }
    }
  }
  .holiday-footer-notice { font-size: 0.8rem; color: var(--text-muted); margin: 0; line-height: 1.45; }
}

// 暗黑模式對比度增強
:root[data-theme="dark"] {
  .tier-nav-tabs .tab-btn {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.14);
    color: var(--text-sub);

    &:hover:not(.active) {
      border-color: var(--gold-primary);
      color: var(--text-primary);
    }

    &.active {
      background: rgba(212, 188, 155, 0.16);
      border-color: var(--gold-primary);
      color: var(--gold-light);
      box-shadow: 0 0 12px rgba(212, 188, 155, 0.25);
    }
  }

  .tier-card {
    background: rgba(255, 255, 255, 0.025);
    border-color: rgba(255, 255, 255, 0.1);

    &:hover {
      background: rgba(212, 188, 155, 0.08);
      border-color: var(--gold-primary);
    }

    &.active {
      background: rgba(212, 188, 155, 0.12);
      border-color: var(--gold-primary);
      box-shadow: 0 0 16px rgba(212, 188, 155, 0.22);

      .status-badge.active-badge {
        background: var(--gold-primary);
        color: #121415;
      }
    }

    .tier-price-wrap .price-amount {
      color: var(--gold-light);
    }

    .tier-summary {
      color: var(--text-sub);
    }
  }

  .weekend-feature-card {
    background: rgba(255, 255, 255, 0.025);
    border-color: rgba(255, 255, 255, 0.1);

    .wf-price-box .price-amount {
      color: var(--gold-light);
    }

    .wf-price-box .btn-apply-weekend:hover {
      background: var(--gold-primary);
      color: #121415;
    }
  }

  .holiday-overview-wrap .holiday-rate-card {
    background: rgba(255, 255, 255, 0.025);
    border-color: rgba(255, 255, 255, 0.1);

    .h-name {
      color: var(--text-sub);
    }

    .h-price {
      color: var(--gold-light);
    }

    &.active {
      background: rgba(212, 188, 155, 0.12);
      border-color: var(--gold-primary);
    }
  }
}
</style>
