<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from '../../composables/useI18n'
import BookingButton from '../common/BookingButton.vue'
import { MessageCircle } from 'lucide-vue-next'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  navLinks: {
    type: Array,
    required: true
  },
  basicInfo: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close'])

const route = useRoute()
const { t } = useI18n()

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <transition name="drawer">
    <div v-if="isOpen" class="mobile-drawer">
      <div class="drawer-header">
        <div class="drawer-brand">
          <img 
            src="/img/logo-dark.png" 
            :alt="basicInfo.brandNameZh || '山語 Villa'" 
            class="drawer-logo-img logo-dark-version" 
          />
          <img 
            src="/img/logo-white.png" 
            :alt="basicInfo.brandNameZh || '山語 Villa'" 
            class="drawer-logo-img logo-white-version" 
          />
        </div>
      </div>

      <nav class="mobile-nav-list">
        <RouterLink 
          v-for="link in navLinks" 
          :key="link.path" 
          :to="link.path"
          class="mobile-nav-item"
          :class="{ 'active': route.path === link.path }"
          @click="handleClose"
        >
          <span>{{ t(link.labelKey) }}</span>
          <span class="nav-arrow">→</span>
        </RouterLink>
      </nav>

      <div class="drawer-footer">
        <BookingButton 
          variant="gold" 
          customClass="drawer-cta"
          @click="handleClose"
        >
          <template #icon>
            <MessageCircle :size="18" />
          </template>
          <span>{{ t('action.line') }}</span>
        </BookingButton>
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.mobile-drawer {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  height: calc(100vh - 60px);
  height: calc(100dvh - 60px);
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.5rem 1.25rem calc(5.5rem + env(safe-area-inset-bottom, 0px));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  border-top: 1px solid var(--border-color);

  @media (min-width: $bp-sm) {
    top: 72px;
    height: calc(100vh - 72px);
    height: calc(100dvh - 72px);
    padding: 2rem 1.75rem calc(6rem + env(safe-area-inset-bottom, 0px));
  }

  @media (min-width: $bp-lg) {
    display: none;
  }
}

.drawer-header {
  margin-bottom: 0.5rem;

  .drawer-brand {
    .drawer-logo-img {
      height: 38px;
      width: auto;
      object-fit: contain;

      @media (min-width: $bp-sm) {
        height: 44px;
      }
    }

    .logo-white-version {
      display: none;
    }
    .logo-dark-version {
      display: block;
    }
  }
}

:root[data-theme="dark"] .drawer-brand {
  .logo-white-version {
    display: block !important;
  }
  .logo-dark-version {
    display: none !important;
  }
}

.mobile-nav-list {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  margin: 1.25rem 0;

  .mobile-nav-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: $font-serif;
    font-size: 1.18rem;
    color: var(--text-primary);
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border-color);

    .nav-arrow {
      font-family: $font-sans;
      color: var(--text-muted);
      transition: transform 0.3s ease;
    }

    &.active, &:hover {
      color: var(--gold-primary);
      .nav-arrow {
        transform: translateX(4px);
        color: var(--gold-primary);
      }
    }
  }
}

.drawer-footer {
  .drawer-cta {
    width: 100%;
    padding: 0.85rem;
    font-size: 0.95rem;
  }
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
