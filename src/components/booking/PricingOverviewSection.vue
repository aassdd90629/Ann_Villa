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
const { isEn } = useI18n()
const { getHolidayForDate, isWeekdayDate, isWeekendDate, pricingData, dynamicWeekdayTiers } = useBookingPricing()

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
          <span>{{ isEn ? 'Rates & Buyout Privilege' : '包棟價格方案與特惠一覽' }}</span>
        </div>
        <p class="header-desc">
          {{ isEn ? 'Transparent rates synchronized with calendar dates (All include breakfast except CNY):' : '依人數與檔期透明計價，動態連動月曆選取（除農曆春節外皆含精緻手作早餐）：' }}
        </p>
      </div>
      <div class="header-date-tag">
        <CalendarDays :size="14" class="text-gold" />
        <span class="tag-label">{{ selectedDate ? (isEn ? 'Check-in:' : '預選入住：') : (isEn ? 'Select date on calendar' : '點選日曆開始預訂') }}</span>
        <strong v-if="selectedDate" class="tag-val">{{ formattedDateText }}</strong>
      </div>
    </div>

    <!-- 價格分類切換 Tabs -->
    <div class="tier-nav-tabs" role="tablist">
      <button type="button" class="tab-btn" :class="{ active: activeTab === 'weekday' }" @click="activeTab = 'weekday'">
        <Sparkles :size="13" />
        <span>{{ isEn ? 'Weekday Tiers (Mon-Thu)' : '平日分級特惠 (週一~週四)' }}</span>
      </button>
      <button type="button" class="tab-btn" :class="{ active: activeTab === 'weekend' }" @click="activeTab = 'weekend'">
        <CalendarCheck :size="13" />
        <span>{{ isEn ? 'Regular Weekend (Fri-Sun)' : '一般假日 (週五~週日)' }}</span>
      </button>
      <button type="button" class="tab-btn" :class="{ active: activeTab === 'holiday' }" @click="activeTab = 'holiday'">
        <PartyPopper :size="13" />
        <span>{{ isEn ? 'National Holiday Specials' : '國定連續假期專案' }}</span>
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
            <span v-if="isTierActive(tier)" class="status-badge active-badge"><Check :size="12" /><span>{{ isEn ? 'Active' : '目前套用' }}</span></span>
            <span v-else class="status-badge tap-hint"><span>{{ isEn ? 'Tap to apply' : '點選套用' }}</span></span>
          </div>
          <div class="tier-price-wrap">
            <span class="currency">NT$</span>
            <span class="price-amount">{{ tier.price.toLocaleString() }}</span>
            <span class="price-unit">{{ isEn ? '/ night' : '/ 晚' }}</span>
          </div>
          <p class="tier-summary">
            <template v-if="tier.max === 10">{{ isEn ? 'Exclusive 5 suites & grounds for intimate groups & small families.' : '享全棟 5 間客房與所有公設，小家庭與好友專屬' }}</template>
            <template v-else-if="tier.max === 14">{{ isEn ? 'Comfortable space for medium gathering with KTV & mahjong.' : '中型朋友聚會首選，歡唱 KTV、電動麻將與戶外空間' }}</template>
            <template v-else>{{ isEn ? 'Full capacity up to 18 guests with full luxury perks.' : '全棟頂級尊榮享受，最多可容納 18 位貴賓同樂放鬆' }}</template>
          </p>
        </div>
      </div>
    </div>

    <!-- Tab 2: 一般假日價格卡片 (寬版橫幅) -->
    <div v-else-if="activeTab === 'weekend'" class="tab-panel">
      <div class="weekend-feature-card">
        <div class="wf-content">
          <div class="wf-badge"><CalendarCheck :size="14" class="text-gold" /><span>{{ isEn ? 'Regular Weekend Buyout (Fri - Sun)' : '一般假日全區包棟（週五至週日適用）' }}</span></div>
          <h4 class="wf-title">{{ isEn ? 'Friday - Sunday Luxury Buyout' : '週五至週日尊榮私密包棟' }}</h4>
          <p class="wf-desc">{{ isEn ? '5 Exclusive suites · Accommodate up to 18 guests · KTV, Mahjong & Lawn · Handmade breakfast included.' : '獨享 5 間獨立客房與整座庭園公設，歡唱 KTV、電動麻將與景觀戶外空間，包含翌日晨光手作早餐。' }}</p>
          <div class="wf-perks">
            <span class="perk-pill">✨ 5 間獨立景觀套房</span>
            <span class="perk-pill">✨ 最多容納 18 位貴賓</span>
            <span class="perk-pill">✨ 附贈手作精緻早餐</span>
          </div>
        </div>
        <div class="wf-price-box">
          <div class="wf-p-row"><span class="currency">NT$</span><span class="price-amount">{{ weekendPrice.toLocaleString() }}</span><span class="price-unit">{{ isEn ? '/ night' : '/ 晚' }}</span></div>
          <button type="button" class="btn-apply-weekend" @click="emit('apply-tier', 18)">{{ isEn ? 'Apply 18 Guests' : '套用 18 位包棟' }}</button>
        </div>
      </div>
    </div>

    <!-- Tab 3: 國定連續假期專案 (寬敞網格呈現各連假價格) -->
    <div v-else-if="activeTab === 'holiday'" class="tab-panel">
      <div class="holiday-overview-wrap">
        <div class="holiday-header-bar">
          <span class="h-title">{{ isEn ? 'National Holiday Buyout Packages (by holiday season):' : '國定連續假期專案價格（依各專案檔期計價）：' }}</span>
          <span v-if="selectedHoliday" class="active-h-tag">🎯 {{ isEn ? 'Selected:' : '預選日適逢：' }} {{ selectedHoliday.nameZh || selectedHoliday.name }}</span>
        </div>
        <div class="holiday-cards-grid">
          <div v-for="hTier in dynamicHolidayTiers" :key="hTier.price" class="holiday-rate-card" :class="{ active: selectedHoliday && Number(selectedHoliday.price) === hTier.price }">
            <div class="h-name">{{ isEn ? hTier.labelEn : hTier.labelZh }}</div>
            <div class="h-price">NT$ {{ hTier.price.toLocaleString() }}</div>
            <div class="h-unit">{{ isEn ? '/ night' : '/ 晚' }}</div>
          </div>
        </div>
        <p class="holiday-footer-notice">✨ {{ isEn ? 'Full buyout for up to 18 guests. Handmade breakfast included for all holidays except CNY.' : '國定連假皆享全區 18 位包棟尊榮禮遇；除農曆春節期間外，其餘連假皆包含翌日精緻手作早餐。' }}</p>
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
</style>
