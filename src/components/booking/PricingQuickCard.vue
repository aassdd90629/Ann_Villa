<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { WEEKDAY_TIERS, useBookingPricing } from '../../composables/useBookingPricing'
import { Sparkles, CalendarCheck, PartyPopper } from 'lucide-vue-next'

const props = defineProps({
  guestCount: { type: Number, default: 18 },
  checkInDate: { type: String, default: null },
  checkOutDate: { type: String, default: null },
  calculation: { type: Object, default: () => null }
})

const emit = defineEmits(['update:guestCount'])

const { isEn } = useI18n()
const { getHolidayForDate, isWeekendDate, isWeekdayDate } = useBookingPricing()

// 國定假日 4 大代表價位（38000, 40000, 47000, 50000）
const HOLIDAY_TIERS = [
  { price: 38000, labelZh: '和平/清明/雙十', labelEn: 'Memorial/Tomb/Natl', tagZh: 'NT$ 38,000' },
  { price: 40000, labelZh: '聖誕節連假專案', labelEn: 'Christmas Holiday', tagZh: 'NT$ 40,000' },
  { price: 47000, labelZh: '跨年/元旦假期', labelEn: 'New Year Holiday', tagZh: 'NT$ 47,000' },
  { price: 50000, labelZh: '農曆春節過年', labelEn: 'Lunar New Year', tagZh: 'NT$ 50,000' }
]

const activeTab = ref('weekday') // 'weekday' | 'weekend' | 'holiday'

// 當前點選日期的連假判定
const checkInHoliday = computed(() => {
  if (!props.checkInDate) return null
  return getHolidayForDate(props.checkInDate)
})

const hasHolidayNight = computed(() => {
  if (props.calculation?.holidayNights > 0) return true
  return Boolean(checkInHoliday.value)
})

const hasWeekendNight = computed(() => {
  if (props.calculation?.weekendNights > 0) return true
  if (props.checkInDate && !checkInHoliday.value) {
    return isWeekendDate(props.checkInDate)
  }
  return false
})

const hasWeekdayNight = computed(() => {
  if (props.calculation?.weekdayNights > 0) return true
  if (props.checkInDate && !checkInHoliday.value) {
    return isWeekdayDate(props.checkInDate)
  }
  return false
})

const isMixedStay = computed(() => {
  let count = 0
  if (props.calculation?.weekdayNights > 0) count++
  if (props.calculation?.weekendNights > 0) count++
  if (props.calculation?.holidayNights > 0) count++
  return count > 1
})

// 當日期變更時，自動切換至匹配之價格分頁
watch(
  () => [props.checkInDate, props.checkOutDate, props.calculation?.nights],
  () => {
    if (hasHolidayNight.value) {
      activeTab.value = 'holiday'
    } else if (hasWeekendNight.value) {
      activeTab.value = 'weekend'
    } else if (hasWeekdayNight.value) {
      activeTab.value = 'weekday'
    }
  },
  { immediate: true }
)

// 目前適用的連假名稱與價格
const currentHolidayInfo = computed(() => {
  if (props.calculation?.holidayNightsList?.length > 0) {
    const first = props.calculation.holidayNightsList[0]
    return {
      name: first.nameZh || '國定連續假期',
      price: first.price || 40000
    }
  }
  if (checkInHoliday.value) {
    return {
      name: checkInHoliday.value.nameZh || checkInHoliday.value.name || '國定連續假期',
      price: checkInHoliday.value.price || 40000
    }
  }
  return null
})

const selectWeekdayTier = (count) => {
  emit('update:guestCount', count)
}

const selectWeekendTier = () => {
  emit('update:guestCount', 18)
}
</script>

<template>
  <div class="pricing-quick-card">
    <!-- 價格分類切換 Tabs -->
    <div class="tier-nav-tabs" role="tablist">
      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === 'weekday' }"
        @click="activeTab = 'weekday'"
      >
        <Sparkles :size="12" />
        <span>{{ isEn ? 'Weekday' : '平日分級' }}</span>
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === 'weekend' }"
        @click="activeTab = 'weekend'"
      >
        <CalendarCheck :size="12" />
        <span>{{ isEn ? 'Weekend 35k' : '一般假日 35k' }}</span>
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === 'holiday' }"
        @click="activeTab = 'holiday'"
      >
        <PartyPopper :size="12" />
        <span>{{ isEn ? 'Holidays' : '國定假日' }}</span>
      </button>
    </div>

    <!-- 跨夜多重計價提示 -->
    <div v-if="isMixedStay" class="mixed-stay-notice">
      <span>✨ {{ isEn ? 'Selected stay includes multiple rates' : '預選檔期包含多重計價（平日/假日/連假）' }}</span>
    </div>

    <!-- 1. 平日分級特惠 (週一~週四適用) -->
    <div v-if="activeTab === 'weekday'" class="tab-content-panel">
      <div class="quick-title-row">
        <span class="quick-title">{{ isEn ? 'Weekday tiers (Mon-Thu):' : '平日分級特惠 (週一~週四適用)：' }}</span>
        <span class="capacity-hint">{{ isEn ? 'All incl. breakfast' : '皆含手作早餐' }}</span>
      </div>
      <div class="pills-grid weekday-grid">
        <button
          v-for="tier in WEEKDAY_TIERS"
          :key="tier.price"
          type="button"
          class="pill-btn"
          :class="{ active: guestCount <= tier.max && (tier.min === 1 || guestCount >= tier.min) }"
          @click="selectWeekdayTier(tier.count)"
          :title="isEn ? `Set to ${tier.labelEn}` : `點擊切換為 ${tier.labelZh}`"
        >
          <span class="p-text">{{ isEn ? tier.labelEn : tier.labelZh }}</span>
          <span class="p-price">NT$ {{ (tier.price / 1000) }}k</span>
        </button>
      </div>
    </div>

    <!-- 2. 一般假日價格 (週五~週日適用: 35000$) -->
    <div v-else-if="activeTab === 'weekend'" class="tab-content-panel">
      <div class="quick-title-row">
        <span class="quick-title">{{ isEn ? 'Regular Weekend Rate (Fri-Sun):' : '一般假日價格 (週五~週日適用)：' }}</span>
      </div>
      <button
        type="button"
        class="weekend-banner-btn"
        :class="{ active: hasWeekendNight }"
        @click="selectWeekendTier"
        :title="isEn ? 'Full buyout 18 guests' : '尊榮包棟最多 18 位'"
      >
        <div class="wb-left">
          <span class="wb-name">{{ isEn ? 'Weekend Buyout (Fri-Sun)' : '一般假日全區包棟' }}</span>
          <span class="wb-sub">{{ isEn ? '5 Suites · Up to 18 guests · Breakfast incl.' : '5 間獨立套房 · 最多 18 位 · 含手作早餐' }}</span>
        </div>
        <div class="wb-right">
          <span class="wb-price">NT$ 35,000</span>
          <span class="wb-unit">{{ isEn ? '/ night' : '/ 晚' }}</span>
        </div>
      </button>
    </div>

    <!-- 3. 國定假日價格 (連假專案: 40000$, 47000$, 38000$, 50000$) -->
    <div v-else-if="activeTab === 'holiday'" class="tab-content-panel">
      <div class="quick-title-row">
        <span class="quick-title">{{ isEn ? 'National Holiday Buyout Rates:' : '國定假日價格 (依連續假期專案)：' }}</span>
        <span v-if="currentHolidayInfo" class="active-holiday-tag">
          {{ currentHolidayInfo.name }}
        </span>
      </div>
      <div class="pills-grid holiday-grid">
        <div
          v-for="hTier in HOLIDAY_TIERS"
          :key="hTier.price"
          class="pill-btn holiday-pill"
          :class="{ active: currentHolidayInfo && currentHolidayInfo.price === hTier.price }"
        >
          <span class="p-text">{{ isEn ? hTier.labelEn : hTier.labelZh }}</span>
          <span class="p-price">{{ hTier.tagZh }}</span>
        </div>
      </div>
      <p class="holiday-note-desc">
        {{ isEn ? 'Buyout for up to 18 guests (Breakfast included except CNY)' : '最多 18 位全區包棟（含精緻手作早餐，春節除外）' }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.pricing-quick-card {
  background: var(--bg-card);
  border: 1px dashed var(--border-color);
  border-radius: 6px;
  padding: 0.75rem 0.85rem;
  margin-bottom: 1.35rem;

  .tier-nav-tabs {
    display: flex;
    gap: 0.35rem;
    margin-bottom: 0.65rem;

    .tab-btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
      padding: 0.38rem 0.2rem;
      font-size: 0.72rem;
      font-weight: 600;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background: var(--bg-primary);
      color: var(--text-muted);
      cursor: pointer;
      transition: $transition-base;

      &.active {
        background: var(--badge-bg);
        border-color: var(--gold-primary);
        color: var(--gold-primary);
      }

      &:hover:not(.active) {
        border-color: var(--gold-primary);
        color: var(--text-primary);
      }
    }
  }

  .mixed-stay-notice {
    font-size: 0.72rem;
    color: var(--gold-primary);
    padding: 0.28rem 0.5rem;
    background: var(--badge-bg);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    margin-bottom: 0.55rem;
    text-align: center;
    font-weight: 500;
  }

  .tab-content-panel {
    display: flex;
    flex-direction: column;

    .quick-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.4rem;
      margin-bottom: 0.45rem;

      .quick-title {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--gold-primary);
      }

      .capacity-hint {
        font-size: 0.68rem;
        color: var(--text-muted);
      }

      .active-holiday-tag {
        font-size: 0.68rem;
        font-weight: 600;
        color: var(--gold-primary);
        background: var(--badge-bg);
        padding: 0.15rem 0.4rem;
        border-radius: 3px;
        border: 1px solid var(--gold-primary);
      }
    }
  }

  .pills-grid {
    display: grid;
    gap: 0.4rem;

    &.weekday-grid { grid-template-columns: repeat(3, 1fr); }
    &.holiday-grid { grid-template-columns: repeat(2, 1fr); }

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
        font-size: 0.7rem;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }

      .p-price {
        font-size: 0.74rem;
        font-weight: 700;
        color: var(--gold-primary);
        margin-top: 1px;
      }

      &.active {
        border-color: var(--gold-primary);
        background: var(--badge-bg);
        color: var(--gold-primary);
        box-shadow: 0 0 6px rgba(197, 168, 128, 0.2);
      }

      &:hover:not(.active) { border-color: var(--gold-primary); }
      &.holiday-pill { cursor: default; }
    }
  }

  .weekend-banner-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.55rem 0.75rem;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    cursor: pointer;
    transition: $transition-base;
    text-align: left;

    .wb-left {
      display: flex;
      flex-direction: column;

      .wb-name { font-size: 0.78rem; font-weight: 600; color: var(--text-primary); }
      .wb-sub { font-size: 0.68rem; color: var(--text-muted); margin-top: 1px; }
    }

    .wb-right {
      display: flex;
      align-items: baseline;
      gap: 0.15rem;

      .wb-price { font-family: $font-display; font-size: 0.95rem; font-weight: 700; color: var(--gold-primary); }
      .wb-unit { font-size: 0.68rem; color: var(--text-muted); }
    }

    &.active, &:hover {
      border-color: var(--gold-primary);
      background: var(--badge-bg);
    }
  }

  .holiday-note-desc {
    font-size: 0.68rem;
    color: var(--text-muted);
    margin: 0.45rem 0 0;
    text-align: center;
  }
}
</style>
