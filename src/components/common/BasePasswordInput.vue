<script setup>
import { ref } from 'vue'
import { Lock, Eye, EyeOff } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '請輸入密碼'
  },
  required: {
    type: Boolean,
    default: false
  },
  autocomplete: {
    type: String,
    default: 'current-password'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  hasIcon: {
    type: Boolean,
    default: true
  },
  id: {
    type: String,
    default: undefined
  },
  name: {
    type: String,
    default: undefined
  }
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'enter'])

const showPassword = ref(false)

const handleInput = (event) => {
  emit('update:modelValue', event.target.value)
}

const toggleVisibility = () => {
  if (props.disabled) return
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div class="base-password-input-wrapper">
    <Lock v-if="hasIcon" :size="18" class="input-icon" aria-hidden="true" />
    <input 
      :id="id"
      :name="name"
      :value="modelValue"
      :type="showPassword ? 'text' : 'password'"
      class="form-input"
      :class="{ 'no-icon': !hasIcon }"
      :placeholder="placeholder"
      :required="required"
      :autocomplete="autocomplete"
      :disabled="disabled"
      @input="handleInput"
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
      @keydown.enter="emit('enter', $event)"
    />
    <button 
      type="button" 
      class="password-toggle-btn" 
      :disabled="disabled"
      @click="toggleVisibility" 
      :title="showPassword ? '隱藏密碼' : '顯示密碼'"
      :aria-label="showPassword ? '隱藏密碼' : '顯示密碼'"
    >
      <EyeOff v-if="showPassword" :size="18" />
      <Eye v-else :size="18" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.base-password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;

  .input-icon {
    position: absolute;
    left: 1rem;
    color: var(--admin-text-muted, #64748b);
    pointer-events: none;
    z-index: 1;
  }

  .form-input {
    width: 100%;
    padding: 0.85rem 2.75rem 0.85rem 2.75rem;
    background: var(--admin-input-bg, rgba(13, 19, 31, 0.8));
    border: 1px solid var(--admin-input-border, rgba(212, 175, 55, 0.25));
    border-radius: 6px;
    color: var(--admin-text-main, #fff);
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.25s ease, box-shadow 0.25s ease;

    &.no-icon {
      padding-left: 1rem;
    }

    &:focus {
      border-color: var(--gold-primary, #d4af37);
      box-shadow: 0 0 10px rgba(212, 175, 55, 0.25);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .password-toggle-btn {
    position: absolute;
    right: 0.75rem;
    background: transparent;
    border: none;
    padding: 0.35rem;
    color: var(--admin-text-muted, #64748b);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: color 0.2s ease, background-color 0.2s ease;
    z-index: 1;

    &:hover:not(:disabled) {
      color: var(--gold-primary, #d4af37);
      background: rgba(212, 175, 55, 0.1);
    }

    &:focus-visible {
      outline: 1px solid var(--gold-primary, #d4af37);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }
}
</style>
