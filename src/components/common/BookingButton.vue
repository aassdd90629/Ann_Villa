<script setup>
import { computed } from 'vue'
import { Sparkles } from 'lucide-vue-next'
import { handleBookingAction } from '../../services/bookingService'
import { useI18n } from '../../composables/useI18n'

const props = defineProps({
  roomTitle: {
    type: String,
    default: ''
  },
  roomId: {
    type: String,
    default: ''
  },
  checkIn: {
    type: String,
    default: ''
  },
  checkOut: {
    type: String,
    default: ''
  },
  guests: {
    type: [Number, String],
    default: null
  },
  variant: {
    type: String,
    default: 'gold' // 'gold' | 'outline' | 'white' | 'none'
  },
  size: {
    type: String,
    default: 'md' // 'sm' | 'md' | 'lg'
  },
  showIcon: {
    type: Boolean,
    default: true
  },
  text: {
    type: String,
    default: ''
  },
  customClass: {
    type: String,
    default: ''
  }
})

const { isEn } = useI18n()

const iconSize = computed(() => {
  if (props.size === 'lg') return 18
  if (props.size === 'sm') return 14
  return 16
})

const buttonClasses = computed(() => {
  const list = []
  if (props.variant !== 'none') {
    list.push('btn')
    list.push(`btn-${props.variant}`)
  }
  if (props.size === 'lg') {
    list.push('btn-large')
  } else if (props.size === 'sm') {
    list.push('btn-sm')
  }
  if (props.customClass) {
    list.push(props.customClass)
  }
  return list.join(' ')
})

const emit = defineEmits(['click'])

const onClick = (e) => {
  handleBookingAction({
    roomId: props.roomId,
    roomTitle: props.roomTitle,
    checkIn: props.checkIn,
    checkOut: props.checkOut,
    guests: props.guests
  })
  emit('click', e)
}
</script>

<template>
  <button 
    type="button" 
    :class="buttonClasses" 
    @click="onClick"
  >
    <slot name="icon">
      <Sparkles v-if="showIcon" :size="iconSize" />
    </slot>
    <slot>
      <span>{{ text || (isEn ? 'Reserve Now' : '立即預約') }}</span>
    </slot>
  </button>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.btn-large {
  padding: 1rem 2.5rem;
  font-size: 1.05rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}
</style>
