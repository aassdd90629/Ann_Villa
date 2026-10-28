<script setup>
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n'

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  allowMultiple: {
    type: Boolean,
    default: true
  },
  initialOpen: {
    type: Array,
    default: () => [0]
  }
})

const { isEn } = useI18n()
const activeIndexes = ref([...props.initialOpen])

const toggle = (index) => {
  const pos = activeIndexes.value.indexOf(index)
  if (pos > -1) {
    activeIndexes.value.splice(pos, 1)
  } else {
    if (props.allowMultiple) {
      activeIndexes.value.push(index)
    } else {
      activeIndexes.value = [index]
    }
  }
}

const getQuestion = (item) => {
  if (item.question) return item.question
  if (isEn.value && item.qEn) return item.qEn
  return item.qZh || item.title || ''
}

const getAnswer = (item) => {
  if (item.answer) return item.answer
  if (isEn.value && item.aEn) return item.aEn
  return item.aZh || item.content || ''
}
</script>

<template>
  <div class="accordion-group">
    <div 
      v-for="(item, index) in items" 
      :key="item.id || index"
      class="accordion-item card-luxury"
      :class="{ 'open': activeIndexes.includes(index) }"
    >
      <button 
        type="button" 
        class="accordion-question" 
        @click="toggle(index)"
        :aria-expanded="activeIndexes.includes(index)"
      >
        <slot name="question" :item="item" :index="index" :isOpen="activeIndexes.includes(index)">
          <span class="q-badge">Q</span>
          <span class="q-text">{{ getQuestion(item) }}</span>
          <ChevronDown :size="18" class="arrow-icon" />
        </slot>
      </button>

      <transition name="accordion-slide">
        <div v-if="activeIndexes.includes(index)" class="accordion-answer">
          <slot name="answer" :item="item" :index="index">
            <span class="a-badge">A</span>
            <p class="a-text">{{ getAnswer(item) }}</p>
          </slot>
        </div>
      </transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.accordion-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.accordion-item {
  border-radius: 4px;

  .accordion-question {
    width: 100%;
    padding: 1.25rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    text-align: left;
    color: var(--text-primary);
    font-size: 1.05rem;
    font-weight: 500;
    cursor: pointer;

    .q-badge {
      font-family: $font-display;
      color: var(--gold-primary);
      font-weight: 700;
      font-size: 1.2rem;
    }

    .q-text {
      flex: 1;
    }

    .arrow-icon {
      color: var(--text-muted);
      transition: transform 0.3s ease;
    }
  }

  &.open {
    border-color: var(--gold-primary);

    .arrow-icon {
      transform: rotate(180deg);
      color: var(--gold-primary);
    }
  }

  .accordion-answer {
    padding: 0 1.5rem 1.5rem 3.5rem;
    display: flex;
    gap: 0.75rem;

    .a-badge {
      font-family: $font-display;
      font-weight: 700;
      color: var(--text-muted);
      font-size: 1.1rem;
    }

    .a-text {
      font-size: 0.93rem;
      line-height: 1.8;
      color: var(--text-sub);
      margin: 0;
    }
  }
}

.accordion-slide-enter-active,
.accordion-slide-leave-active {
  transition: opacity 0.3s ease;
}

.accordion-slide-enter-from,
.accordion-slide-leave-to {
  opacity: 0;
}
</style>
