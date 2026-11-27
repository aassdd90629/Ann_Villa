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

const { isEn } = useI18n()
const { maxCapacity } = useBookingPricing()

const isHoliday = computed(() => Boolean(props.holiday))

const displayTitle = computed(() => {
  if (props.holiday) {
    return isEn.value ? (props.holiday.nameEn || props.holiday.nameZh) : (props.holiday.nameZh || props.holiday.name)
  }
  return isEn.value ? 'Friday - Sunday Weekend Buyout' : '週五至週日・全區尊榮包棟'
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
          <span>{{ isHoliday ? (isEn ? 'Consecutive Holiday Package' : '國定連續假期專案特惠') : (isEn ? 'Weekend Buyout Privilege' : '一般假日包棟方案') }}</span>
        </div>
        <h4 class="holiday-title">{{ displayTitle }}</h4>
        <p class="header-desc">
          {{ isHoliday ? (isEn ? `Exclusive buyout package for up to ${maxCapacity} guests.` : `全區私密包棟尊榮特惠，獨享 180 坪莊園公設與 5 間獨立景觀套房（最多 ${maxCapacity} 位）：`) : (isEn ? `Exclusive buyout with breakfast for up to ${maxCapacity} guests.` : `享整座私密山林莊園、5 間景觀套房與所有娛樂公設（含精緻手作早餐）：`) }}
        </p>
      </div>

      <div class="header-date-tag">
        <CalendarDays :size="14" class="text-gold" />
        <span class="tag-label">{{ isEn ? 'Check-in:' : '預選入住：' }}</span>
        <strong class="tag-val">{{ formattedDateText }}</strong>
      </div>
    </div>

    <div class="special-rate-card" :class="isHoliday ? 'holiday-card' : 'weekend-card'">
      <div class="rate-card-top">
        <div class="rate-badge">
          {{ isHoliday ? (isEn ? 'Holiday Buyout Rate' : '連續假期全棟包棟') : (isEn ? 'Weekend Rate' : '一般假日包棟價') }}
        </div>
        <div class="breakfast-badge" :class="{ 'no-breakfast': isHoliday && !holiday.breakfast }">
          {{ isHoliday ? (holiday.breakfast ? (isEn ? 'Handmade Breakfast Included' : '含精緻手作早餐') : (isEn ? 'No breakfast during CNY' : '春節期間不提供早餐')) : (isEn ? 'Handmade Breakfast Included' : '含精緻手作早餐') }}
        </div>
      </div>

      <div class="rate-price-row">
        <div class="tier-price-wrap">
          <span class="currency">NT$</span>
          <span class="price-amount">{{ displayPrice }}</span>
          <span class="price-unit">{{ isEn ? `/ night (Up to ${maxCapacity} guests)` : `/ 晚（最多 ${maxCapacity} 人全包棟）` }}</span>
        </div>
      </div>

      <p class="rate-perks">
        {{ isHoliday ? (holiday.noteZh || (isEn ? 'Includes all 5 suites, KTV, automatic mahjong, outdoor BBQ grill, and pool.' : '包含 5 間雙人/四人景觀套房、獨立隔音 KTV、電動四口麻將、戶外庭園大型美式烤肉區與戲水池。')) : (isEn ? 'Enjoy 180-ping private estate with 5 ensuite bedrooms, KTV lounge, auto-mahjong table, BBQ grill, and private outdoor pool.' : '獨享 180 坪私密山林莊園，5 間獨立景觀套房、戶外景觀戲水池、歡唱隔音 KTV、電動四口麻將與美式烤肉公設。') }}
      </p>

      <div class="rate-step-prompt">
        <template v-if="checkOutDate && calculation && calculation.nights > 0">
          <span class="prompt-text highlight-gold">
            ✅ {{ isEn ? `Selected ${selectedDate} to ${checkOutDate} (${calculation.nights} night(s), Total: NT$ ${calculation.grandTotal.toLocaleString()})` : `已選擇入住區間：${selectedDate} 至 ${checkOutDate}（共 ${calculation.nights} 晚，預估總額 NT$ ${calculation.grandTotal.toLocaleString()}）` }}
          </span>
        </template>
        <template v-else>
          <span class="prompt-text">
            👉 {{ isEn ? 'Please click your Check-out date on the calendar to finalize pricing & reservation' : '請接續在上方月曆點選【退房日期】，系統將即時試算總額並開放線上直訂' }}
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
