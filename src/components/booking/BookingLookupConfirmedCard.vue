<script setup>
import { RouterLink } from 'vue-router'
import { CheckCircle2, FileText, MapPin, CalendarX } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n'
import { useSiteContent } from '../../composables/useSiteContent'

defineProps({
  booking: {
    type: Object,
    required: true
  }
})

defineEmits(['open-cancel'])

const { t } = useI18n()
const { basicInfo } = useSiteContent()
</script>

<template>
  <div class="action-section confirmed-section">
    <div class="confirmed-card">
      <CheckCircle2 :size="24" class="text-green" />
      <div class="c-info">
        <h4 class="c-title">{{ t('lookup.confirmed.title') }}</h4>
        <p class="c-desc">
          {{ t('lookup.confirmed.desc') }}
        </p>
      </div>
    </div>

    <div class="confirmed-buttons">
      <RouterLink to="/rules" class="btn btn-outline btn-sm">
        <FileText :size="15" />
        <span>{{ t('lookup.confirmed.guidelines') }}</span>
      </RouterLink>
      <a :href="basicInfo.googleMapUrl" target="_blank" rel="noopener noreferrer" class="btn btn-outline-gold btn-sm">
        <MapPin :size="15" />
        <span>{{ t('lookup.confirmed.maps') }}</span>
      </a>
      <button type="button" class="btn btn-outline-danger btn-sm" @click="$emit('open-cancel', booking)">
        <CalendarX :size="14" />
        <span>{{ t('lookup.confirmed.cancelRefund') }}</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.confirmed-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.confirmed-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background-color: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.25);

  .text-green {
    color: #10b981;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .c-info {
    flex: 1;
  }

  .c-title {
    font-size: 0.98rem;
    font-weight: 600;
    color: #10b981;
    margin-bottom: 0.25rem;
  }

  .c-desc {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.5;
    margin: 0;
  }
}

.confirmed-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.5rem;

    .btn {
      width: 100%;
      justify-content: center;
    }
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.7rem 1.25rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;

  &.btn-sm {
    padding: 0.45rem 0.85rem;
    font-size: 0.82rem;
  }

  &.btn-outline-gold {
    background: transparent;
    border: 1px solid var(--gold-primary);
    color: var(--gold-primary);

    &:hover {
      background-color: rgba(212, 175, 55, 0.1);
    }
  }

  &.btn-outline {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-secondary);

    &:hover {
      border-color: var(--text-primary);
      color: var(--text-primary);
    }
  }

  &.btn-outline-danger {
    background: transparent;
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #ef4444;

    &:hover {
      background-color: rgba(239, 68, 68, 0.1);
      border-color: #ef4444;
    }
  }
}
</style>
