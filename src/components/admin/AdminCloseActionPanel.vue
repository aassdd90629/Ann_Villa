<script setup>
import { CalendarX, Lock, RotateCcw } from 'lucide-vue-next'

const props = defineProps({
  checkInDate: {
    type: String,
    default: null
  },
  checkOutDate: {
    type: String,
    default: null
  },
  selectedNights: {
    type: Number,
    default: 0
  },
  modelValue: {
    type: String,
    default: ''
  },
  isSubmitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'clear'])
</script>

<template>
  <div class="action-card">
    <div class="card-head">
      <CalendarX :size="18" class="text-gold" />
      <h3 class="card-title">關閉月曆設定</h3>
    </div>

    <!-- 選取的日期區間摘要 -->
    <div class="selected-range-box">
      <div class="range-field">
        <span class="field-label">開始關閉日 (Check-in)</span>
        <span class="field-value font-mono" :class="{ 'is-empty': !checkInDate }">
          {{ checkInDate || '請在左側月曆點選' }}
        </span>
      </div>
      <div class="range-field">
        <span class="field-label">結束關閉日 (Check-out)</span>
        <span class="field-value font-mono" :class="{ 'is-empty': !checkOutDate }">
          {{ checkOutDate || '請在左側月曆點選' }}
        </span>
      </div>
      <div v-if="checkInDate && checkOutDate" class="range-nights">
        共關閉 <strong>{{ selectedNights }}</strong> 晚檔期
      </div>
    </div>

    <!-- 關閉理由為選填 -->
    <div class="form-group">
      <label class="form-label" for="custom-reason">
        關閉理由說明 (選填)
      </label>
      <textarea
        id="custom-reason"
        :value="modelValue"
        @input="emit('update:modelValue', $event.target.value)"
        class="form-textarea"
        rows="3"
        placeholder="請輸入本次關閉月曆的理由（選填，若未填寫預設為『自主保留 / 閉館維護』）"
      ></textarea>
    </div>

    <div class="card-buttons">
      <button
        type="button"
        class="btn-confirm-close"
        :disabled="!checkInDate || !checkOutDate || isSubmitting"
        @click="emit('confirm')"
      >
        <Lock :size="15" />
        <span>{{ isSubmitting ? '正在關閉中...' : '確認關閉此檔期月曆' }}</span>
      </button>

      <button
        v-if="checkInDate || checkOutDate || modelValue"
        type="button"
        class="btn-clear"
        @click="emit('clear')"
      >
        <RotateCcw :size="14" />
        <span>重選 / 清除</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.action-card {
  background: var(--admin-bg-card, #FFFFFF);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.28));
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  .card-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--admin-text-main, #1A1E1F);
    margin: 0;
  }
}

.selected-range-box {
  background: var(--admin-bg-base, #F5F3EC);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.28));
  border-radius: 6px;
  padding: 1rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;

  .range-field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;

    .field-label {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--admin-text-sub, #475569);
    }

    .field-value {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--gold-dark, #91754F);
      
      &.is-empty {
        color: var(--admin-text-muted, #64748b);
        font-weight: 400;
        font-size: 0.85rem;
        opacity: 0.85;
      }
    }
  }

  .range-nights {
    padding-top: 0.6rem;
    border-top: 1px dashed var(--admin-border, rgba(197, 168, 128, 0.3));
    font-size: 0.85rem;
    color: var(--admin-text-main, #1A1E1F);
    strong { color: var(--gold-dark, #91754F); font-size: 1rem; }
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;

  .form-label {
    font-size: 0.85rem;
    color: var(--admin-text-main, #1A1E1F);
    font-weight: 600;
  }

  .form-textarea {
    width: 100%;
    padding: 0.75rem 0.85rem;
    background: var(--admin-input-bg, #FFFFFF);
    border: 1px solid var(--admin-input-border, rgba(197, 168, 128, 0.4));
    border-radius: 6px;
    color: var(--admin-text-main, #1A1E1F);
    font-size: 0.88rem;
    line-height: 1.5;
    resize: vertical;
    box-sizing: border-box;
    transition: all 0.2s ease;

    &::placeholder {
      color: var(--admin-text-muted, #8C857B);
      opacity: 0.8;
    }

    &:focus {
      outline: none;
      border-color: var(--gold-primary, #C5A880);
      box-shadow: 0 0 0 2px rgba(197, 168, 128, 0.2);
    }
  }
}

.card-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  .btn-confirm-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--gold-primary, #C5A880);
    border: 1px solid transparent;
    color: #121415;
    font-weight: 600;
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: var(--gold-dark, #91754F);
      color: #FFFFFF;
    }

    &:disabled {
      background: var(--admin-btn-secondary-bg, #EAE6DC);
      border-color: var(--admin-border, rgba(197, 168, 128, 0.3));
      color: var(--admin-text-muted, #8C857B);
      opacity: 0.8;
      cursor: not-allowed;
    }
  }

  .btn-clear {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.55rem;
    background: var(--admin-bg-base, #F5F3EC);
    border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3));
    color: var(--admin-text-sub, #475569);
    border-radius: 6px;
    font-size: 0.82rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      color: var(--admin-text-main, #1A1E1F);
      border-color: var(--gold-primary, #C5A880);
    }
  }
}

.text-gold { color: var(--gold-dark, #91754F); }
.font-mono { font-family: monospace; }
</style>
