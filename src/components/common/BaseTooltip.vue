<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  content: { type: String, default: '' },
  title: { type: String, default: '' },
  placement: {
    type: String,
    default: 'top',
    validator: (val) => ['top', 'bottom', 'left', 'right'].includes(val)
  },
  trigger: {
    type: String,
    default: 'hover',
    validator: (val) => ['hover', 'click', 'manual'].includes(val)
  },
  disabled: { type: Boolean, default: false },
  delay: { type: Number, default: 80 },
  hideDelay: { type: Number, default: 120 },
  theme: {
    type: String,
    default: 'luxury',
    validator: (val) => ['luxury', 'dark', 'light'].includes(val)
  },
  maxWidth: { type: String, default: '280px' },
  showArrow: { type: Boolean, default: true },
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'show', 'hide'])

const triggerRef = ref(null)
const tooltipRef = ref(null)
const isVisible = ref(false)
const actualPlacement = ref(props.placement)
const tooltipStyle = ref({})
const arrowStyle = ref({})

let showTimer = null
let hideTimer = null

const getTriggerEl = () => {
  if (!triggerRef.value) return null
  return triggerRef.value.firstElementChild || triggerRef.value
}

const clearTimers = () => {
  if (showTimer) clearTimeout(showTimer)
  if (hideTimer) clearTimeout(hideTimer)
  showTimer = null
  hideTimer = null
}

const calculatePosition = () => {
  const triggerEl = getTriggerEl()
  if (!triggerEl || !tooltipRef.value) return

  const triggerRect = triggerEl.getBoundingClientRect()
  const tooltipRect = tooltipRef.value.getBoundingClientRect()
  const scrollX = window.scrollX || window.pageXOffset
  const scrollY = window.scrollY || window.pageYOffset
  const gap = props.showArrow ? 10 : 6

  let effectivePlacement = props.placement
  if (effectivePlacement === 'top' && triggerRect.top - tooltipRect.height - gap < 8) {
    effectivePlacement = 'bottom'
  } else if (effectivePlacement === 'bottom' && triggerRect.bottom + tooltipRect.height + gap > window.innerHeight - 8) {
    effectivePlacement = 'top'
  }

  let top = 0
  let left = 0

  if (effectivePlacement === 'top') {
    top = triggerRect.top + scrollY - tooltipRect.height - gap
    left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2
  } else if (effectivePlacement === 'bottom') {
    top = triggerRect.bottom + scrollY + gap
    left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2
  } else if (effectivePlacement === 'left') {
    top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2
    left = triggerRect.left + scrollX - tooltipRect.width - gap
  } else if (effectivePlacement === 'right') {
    top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2
    left = triggerRect.right + scrollX + gap
  }

  const padding = 10
  const minLeft = scrollX + padding
  const maxLeft = scrollX + window.innerWidth - tooltipRect.width - padding
  const clampedLeft = Math.max(minLeft, Math.min(left, maxLeft))

  const triggerCenterX = triggerRect.left + scrollX + triggerRect.width / 2
  const arrowLeft = Math.max(12, Math.min(triggerCenterX - clampedLeft, tooltipRect.width - 12))

  actualPlacement.value = effectivePlacement
  tooltipStyle.value = {
    top: `${Math.round(top)}px`,
    left: `${Math.round(clampedLeft)}px`,
    maxWidth: props.maxWidth
  }
  arrowStyle.value = {
    left: `${Math.round(arrowLeft)}px`
  }
}

const show = () => {
  if (props.disabled) return
  clearTimers()
  showTimer = setTimeout(async () => {
    isVisible.value = true
    emit('update:modelValue', true)
    emit('show')
    await nextTick()
    calculatePosition()
  }, props.delay)
}

const hide = () => {
  clearTimers()
  hideTimer = setTimeout(() => {
    isVisible.value = false
    emit('update:modelValue', false)
    emit('hide')
  }, props.hideDelay)
}

const toggle = () => {
  if (props.disabled) return
  if (isVisible.value) hide()
  else show()
}

const handleMouseEnter = () => {
  if (props.trigger === 'hover') show()
}

const handleMouseLeave = () => {
  if (props.trigger === 'hover') hide()
}

const handleClick = (e) => {
  if (props.trigger === 'click') {
    e.stopPropagation()
    toggle()
  }
}

const handleClickOutside = (e) => {
  if (!isVisible.value) return
  const triggerEl = getTriggerEl()
  if (triggerEl && triggerEl.contains(e.target)) return
  if (tooltipRef.value && tooltipRef.value.contains(e.target)) return
  hide()
}

const handleScrollOrResize = () => {
  if (isVisible.value) calculatePosition()
}

watch(() => props.modelValue, (val) => {
  if (props.trigger === 'manual') {
    if (val) show()
    else hide()
  }
})

watch(() => props.disabled, (val) => {
  if (val && isVisible.value) hide()
})

onMounted(() => {
  window.addEventListener('scroll', handleScrollOrResize, { passive: true })
  window.addEventListener('resize', handleScrollOrResize, { passive: true })
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  clearTimers()
  window.removeEventListener('scroll', handleScrollOrResize)
  window.removeEventListener('resize', handleScrollOrResize)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div
    ref="triggerRef"
    class="base-tooltip-trigger"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focusin="handleMouseEnter"
    @focusout="handleMouseLeave"
    @click="handleClick"
  >
    <slot />

    <Teleport to="body">
      <Transition name="tooltip-fade">
        <div
          v-if="isVisible"
          ref="tooltipRef"
          class="base-tooltip-popper"
          :class="[`theme-${theme}`, `placement-${actualPlacement}`]"
          :style="tooltipStyle"
          role="tooltip"
          :aria-hidden="!isVisible"
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
        >
          <div v-if="showArrow" class="tooltip-arrow" :style="arrowStyle" />
          <div class="tooltip-inner">
            <div v-if="title || $slots.title" class="tooltip-title">
              <slot name="title">{{ title }}</slot>
            </div>
            <div class="tooltip-body">
              <slot name="content">{{ content }}</slot>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.base-tooltip-trigger {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
}
</style>

<style lang="scss">
@use '../../assets/styles/variables' as *;

.base-tooltip-popper {
  position: absolute;
  z-index: 10050;
  pointer-events: auto;
  box-sizing: border-box;

  .tooltip-inner {
    padding: 0.65rem 0.85rem;
    border-radius: 6px;
    font-size: 0.8rem;
    line-height: 1.45;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
    word-break: break-word;
  }

  .tooltip-title {
    font-weight: 700;
    font-size: 0.86rem;
    margin-bottom: 0.3rem;
    padding-bottom: 0.25rem;
    letter-spacing: 0.02em;
  }

  // 箭頭造型
  .tooltip-arrow {
    position: absolute;
    width: 0;
    height: 0;
    border-style: solid;
  }

  &.placement-top {
    .tooltip-arrow {
      bottom: -6px;
      transform: translateX(-50%);
      border-width: 6px 6px 0 6px;
      border-color: var(--border-color) transparent transparent transparent;
    }
  }

  &.placement-bottom {
    .tooltip-arrow {
      top: -6px;
      transform: translateX(-50%);
      border-width: 0 6px 6px 6px;
      border-color: transparent transparent var(--border-color) transparent;
    }
  }

  // 尊榮山語奢華主題 (Luxury / 預設)
  &.theme-luxury {
    .tooltip-inner {
      background: var(--bg-card);
      border: 1px solid var(--gold-primary);
      color: var(--text-primary);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 12px rgba(197, 168, 128, 0.15);
    }
    .tooltip-title {
      color: var(--gold-primary);
      border-bottom: 1px dashed var(--border-color);
    }
    &.placement-top .tooltip-arrow {
      border-color: var(--gold-primary) transparent transparent transparent;
    }
    &.placement-bottom .tooltip-arrow {
      border-color: transparent transparent var(--gold-primary) transparent;
    }
  }

  // 深色主題
  &.theme-dark {
    .tooltip-inner {
      background: #141715;
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #F3F4F6;
    }
    .tooltip-title {
      color: #FFFFFF;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    &.placement-top .tooltip-arrow {
      border-color: rgba(255, 255, 255, 0.12) transparent transparent transparent;
    }
    &.placement-bottom .tooltip-arrow {
      border-color: transparent transparent rgba(255, 255, 255, 0.12) transparent;
    }
  }
}

// 浮動提示框過渡動畫
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
