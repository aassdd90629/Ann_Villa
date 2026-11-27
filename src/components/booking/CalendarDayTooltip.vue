<script setup>
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'

const props = defineProps({
  day: { type: Object, required: true },
  checkInDate: { type: String, default: null },
  checkOutDate: { type: String, default: null }
})

const { isEn, t } = useI18n()

const tooltipData = computed(() => {
  const d = props.day
  if (d.isBooked) {
    return {
      title: t('calendar.tooltip.reserved'),
      badge: t('calendar.tooltip.bookedBadge'),
      type: 'booked',
      price: null,
      note: t('calendar.tooltip.bookedNote')
    }
  }
  if (d.holiday) {
    return {
      title: isEn.value ? (d.holiday.nameEn || d.holiday.nameZh) : (d.holiday.nameZh || d.holiday.name),
      badge: t('calendar.tooltip.holidayBadge'),
      type: 'holiday',
      price: `NT$ ${(Number(d.holiday.price) || 47000).toLocaleString()} / ${t('calendar.nights')}`,
      note: d.holiday.breakfast ? t('calendar.tooltip.holidayWithBreakfast') : t('calendar.tooltip.cnyNoBreakfast')
    }
  }
  if (d.isWeekday) {
    return {
      title: t('calendar.tooltip.weekdayTitle'),
      badge: t('calendar.tooltip.weekdayBadge'),
      type: 'weekday',
      price: t('calendar.tooltip.weekdayPrice'),
      note: t('calendar.tooltip.weekdayNote')
    }
  }
  return {
    title: t('calendar.tooltip.weekendTitle'),
    badge: t('calendar.tooltip.weekendBadge'),
    type: 'weekend',
    price: t('calendar.tooltip.weekendPrice'),
    note: t('calendar.tooltip.weekendNote')
  }
})

const statusText = computed(() => {
  if (props.day.dateStr === props.checkInDate) {
    return t('calendar.tooltip.statusCheckIn')
  }
  if (props.day.dateStr === props.checkOutDate) {
    return t('calendar.tooltip.statusCheckOut')
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
      color: var(--text-sub);
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
