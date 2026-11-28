<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { X, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  icon: { type: [Object, Function], default: null },
  size: { 
    type: String, 
    default: 'md', 
    validator: v => ['sm', 'md', 'lg', 'xl'].includes(v) 
  },
  maxWidth: { type: String, default: '' },
  errorMessage: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  closeOnOverlay: { type: Boolean, default: true },
  closeOnEsc: { type: Boolean, default: true }
})

const emit = defineEmits(['close'])

const computedMaxWidth = computed(() => {
  if (props.maxWidth) return props.maxWidth
  const sizeMap = {
    sm: '460px',
    md: '580px',
    lg: '680px',
    xl: '840px'
  }
  return sizeMap[props.size] || '580px'
})

const handleOverlayClick = () => {
  if (props.closeOnOverlay && !props.loading) {
    emit('close')
  }
}

const handleKeyDown = (e) => {
  if (props.show && props.closeOnEsc && e.key === 'Escape' && !props.loading) {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="admin-modal-fade">
      <div 
        v-if="show" 
        class="admin-base-modal-overlay" 
        @click.self="handleOverlayClick"
      >
        <div 
          class="admin-base-modal-container"
          :style="{ maxWidth: computedMaxWidth }"
          role="dialog"
          aria-modal="true"
        >
          <!-- 頂部 Header -->
          <slot name="header">
            <div class="admin-base-modal-header">
              <div class="header-title-group">
                <component 
                  :is="icon" 
                  v-if="icon" 
                  :size="20" 
                  class="gold-icon" 
                />
                <div class="title-text-box">
                  <h3 v-if="title" class="modal-title">{{ title }}</h3>
                  <p v-if="subtitle" class="modal-subtitle">{{ subtitle }}</p>
                </div>
              </div>

              <button 
                type="button" 
                class="btn-close" 
                @click="emit('close')" 
                :disabled="loading"
                title="關閉"
                aria-label="關閉"
              >
                <X :size="18" />
              </button>
            </div>
          </slot>

          <!-- 頂部錯誤提示 (Alert) -->
          <div v-if="errorMessage" class="admin-base-modal-alert error">
            <AlertCircle :size="16" class="alert-icon" />
            <span class="alert-text">{{ errorMessage }}</span>
          </div>

          <!-- 彈窗主要內容區 -->
          <div class="admin-base-modal-body">
            <slot />
          </div>

          <!-- 底部操作區 Footer (選填) -->
          <div v-if="$slots.footer" class="admin-base-modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '../../../assets/styles/variables' as *;

.admin-base-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--overlay-bg, rgba(18, 20, 21, 0.65));
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.admin-base-modal-container {
  width: 100%;
  background: var(--admin-bg-card, #FFFFFF);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.28));
  border-radius: $radius-lg;
  box-shadow: var(--shadow-lg, 0 16px 40px rgba(0, 0, 0, 0.15)), 0 0 16px rgba(197, 168, 128, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 90vh;
  transition: background-color $transition-fast, border-color $transition-fast;
}

.admin-base-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: var(--admin-bg-card, #FFFFFF);
  border-bottom: 1px solid var(--admin-border-subtle, rgba(0, 0, 0, 0.06));
  gap: 1rem;

  .header-title-group {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    flex: 1;

    .gold-icon {
      color: var(--gold-primary, #C5A880);
      margin-top: 3px;
      flex-shrink: 0;
    }

    .title-text-box {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;

      .modal-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--admin-text-main, #1A1E1F);
        line-height: 1.4;
      }

      .modal-subtitle {
        font-size: 0.8rem;
        color: var(--admin-text-muted, #64748b);
        line-height: 1.4;
      }
    }
  }

  .btn-close {
    background: transparent;
    border: none;
    color: var(--admin-text-muted, #64748b);
    cursor: pointer;
    padding: 0.35rem;
    border-radius: $radius-xs;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: color $transition-fast, background-color $transition-fast;

    &:hover:not(:disabled) {
      color: var(--admin-text-main, #1A1E1F);
      background: var(--admin-tr-hover, rgba(197, 168, 128, 0.12));
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}

.admin-base-modal-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  margin: 1rem 1.5rem 0;
  border-radius: $radius-sm;
  font-size: 0.85rem;

  &.error {
    background: var(--color-danger-bg, rgba(239, 68, 68, 0.12));
    border: 1px solid var(--color-danger-border, rgba(239, 68, 68, 0.3));
    color: var(--color-danger, #EF4444);
  }

  .alert-icon {
    flex-shrink: 0;
  }

  .alert-text {
    line-height: 1.4;
  }
}

.admin-base-modal-body {
  overflow-y: auto;
  max-height: calc(90vh - 75px);
  display: flex;
  flex-direction: column;
}

.admin-base-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: var(--admin-bg-card, #FFFFFF);
  border-top: 1px solid var(--admin-border-subtle, rgba(0, 0, 0, 0.06));
}

// 動畫淡入淡出
.admin-modal-fade-enter-active,
.admin-modal-fade-leave-active {
  transition: opacity $transition-fast;

  .admin-base-modal-container {
    transition: opacity $transition-fast;
  }
}

.admin-modal-fade-enter-from,
.admin-modal-fade-leave-to {
  opacity: 0;
}
</style>
