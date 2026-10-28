<script setup>
import { useI18n } from '../../composables/useI18n'
import siteData from '../../data/site.json'
import BookingButton from '../common/BookingButton.vue'
import { Phone, MessageSquare, MapPin } from 'lucide-vue-next'

const { t } = useI18n()
</script>

<template>
  <aside class="mobile-action-bar" aria-label="Mobile quick actions">
    <a :href="`tel:${siteData.phone}`" class="action-item" aria-label="Call Villa">
      <Phone :size="19" class="icon" />
      <span class="label">{{ t('action.call') }}</span>
    </a>

    <BookingButton 
      variant="none"
      customClass="action-item primary-action"
      :showIcon="false"
      aria-label="LINE Consultation"
    >
      <MessageSquare :size="20" class="icon" />
      <span class="label">{{ t('action.line') }}</span>
    </BookingButton>

    <a 
      :href="siteData.googleMapUrl" 
      target="_blank" 
      rel="noopener noreferrer" 
      class="action-item"
      aria-label="Map Navigation"
    >
      <MapPin :size="19" class="icon" />
      <span class="label">{{ t('action.map') }}</span>
    </a>
  </aside>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.mobile-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: space-around;
  background-color: var(--bg-card-glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid var(--border-color);
  padding: 0.55rem 0.75rem calc(0.55rem + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);

  @media (min-width: $bp-md) {
    display: none; // 僅在手機端顯示
  }
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 0.2rem;
  color: var(--text-primary);
  padding: 0.35rem 0.5rem;
  border-radius: 4px;
  transition: $transition-base;

  .icon {
    color: var(--text-sub);
    transition: color 0.3s ease;
  }

  .label {
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  &.primary-action {
    background: linear-gradient(135deg, var(--gold-primary) 0%, var(--gold-dark) 100%);
    color: #FFFFFF;
    border-radius: 6px;
    margin: 0 0.4rem;
    padding: 0.45rem 0.5rem;
    box-shadow: 0 3px 12px rgba(197, 168, 128, 0.35);

    .icon {
      color: #FFFFFF;
    }
  }

  &:active {
    transform: scale(0.96);
  }
}
</style>
