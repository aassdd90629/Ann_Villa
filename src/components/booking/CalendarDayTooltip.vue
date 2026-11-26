<script setup>
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'

const props = defineProps({
  day: { type: Object, required: true },
  checkInDate: { type: String, default: null },
  checkOutDate: { type: String, default: null }
})

const { isEn } = useI18n()

const tooltipData = computed(() => {
  const d = props.day
  if (d.isBooked) {
    return {
      title: isEn.value ? 'Reserved' : '已預訂保留',
      badge: isEn.value ? 'Booked' : '已有預約',
      type: 'booked',
      price: null,
      note: isEn.value ? 'This date is already reserved.' : '此檔期已有其他貴賓預訂保留。'
    }
  }
  if (d.holiday) {
    return {
      title: isEn.value ? (d.holiday.nameEn || d.holiday.nameZh) : (d.holiday.nameZh || d.holiday.name),
      badge: isEn.value ? 'Consecutive Holiday' : '國定連續假期',
      type: 'holiday',
      price: `NT$ ${(Number(d.holiday.price) || 47000).toLocaleString()} / 晚`,
      note: d.holiday.breakfast ? (isEn.value ? 'Handmade breakfast included' : '含精緻手作早餐・全棟包棟') : (isEn.value ? 'No breakfast during CNY' : '春節期間不提供早餐・全棟包棟')
    }
  }
  if (d.isWeekday) {
    return {
      title: isEn.value ? 'Weekday Privilege' : '平日專屬包棟特惠',
      badge: isEn.value ? 'Mon - Thu' : '週一至週四',
      type: 'weekday',
      price: isEn.value ? 'From NT$ 20,000 / night' : 'NT$ 20,000 起 / 晚',
      note: isEn.value ? '10 guests 20k / 14 guests 25k / 18 guests 30k' : '10人 2萬 / 11-14人 2.5萬 / 15-18人 3萬（含早餐）'
    }
  }
  return {
    title: isEn.value ? 'Weekend Package' : '一般假日包棟方案',
    badge: isEn.value ? 'Fri - Sun' : '週五至週日',
    type: 'weekend',
    price: isEn.value ? 'NT$ 35,000 / night' : 'NT$ 35,000 / 晚',
    note: isEn.value ? 'Full buyout up to 18 guests with breakfast' : '全區 180 坪包棟・含手作早餐（最多 18 人）'
  }
})

const statusText = computed(() => {
  if (props.day.dateStr === props.checkInDate) {
    return isEn.value ? '【Selected Check-in Date】' : '【目前選為入住日】'
  }
  if (props.day.dateStr === props.checkOutDate) {
    return isEn.value ? '【Selected Check-out Date】' : '【目前選為退房日】'
  }
  return null
})
</script>

<template>
  <div class="calendar-cell-tooltip">
    <div class="tt-top">
      <span class="tt-date">{{ day.dateStr }}</span>
      <span class="tt-badge" :class="`badge-${tooltipData.type}`">{{ tooltipData.badge }}</span>
    </div>
    <div class="tt-title">{{ tooltipData.title }}</div>
    <div v-if="tooltipData.price" class="tt-price">{{ tooltipData.price }}</div>
    <div class="tt-note">{{ tooltipData.note }}</div>
    <div v-if="statusText" class="tt-status">{{ statusText }}</div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.calendar-cell-tooltip {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 175px;
  max-width: 250px;

  .tt-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.72rem;
    margin-bottom: 0.15rem;

    .tt-date {
      color: var(--text-muted);
      font-family: monospace;
      font-weight: 600;
    }

    .tt-badge {
      font-size: 0.68rem;
      padding: 0.1rem 0.35rem;
      border-radius: 3px;
      font-weight: 600;

      &.badge-holiday {
        background: var(--gold-primary);
        color: var(--bg-card);
      }
      &.badge-weekend {
        background: var(--badge-bg);
        color: var(--gold-primary);
        border: 1px solid var(--gold-primary);
      }
      &.badge-weekday {
        background: rgba(200, 169, 110, 0.18);
        color: var(--gold-primary);
      }
      &.badge-booked {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
      }
    }
  }

  .tt-title {
    font-weight: 700;
    color: var(--text-primary);
    font-size: 0.84rem;
  }

  .tt-price {
    font-family: $font-display;
    font-weight: 700;
    color: var(--gold-primary);
    font-size: 0.95rem;
  }

  .tt-note {
    font-size: 0.74rem;
    color: var(--text-sub);
    line-height: 1.35;
  }

  .tt-status {
    margin-top: 0.25rem;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--gold-primary);
    border-top: 1px dashed var(--border-color);
    padding-top: 0.25rem;
  }
}
</style>
