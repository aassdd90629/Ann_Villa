<script setup>
import { CalendarX, Lock, RotateCcw } from 'lucide-vue-next'

const props = defineProps({
  selectedDates: {
    type: Array,
    default: () => []
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

const emit = defineEmits(['update:modelValue', 'confirm', 'clear', 'remove-date'])
</script>

<template>
  <div class="action-card">
    <div class="card-head">
      <CalendarX :size="18" class="text-gold" />
      <h3 class="card-title">自主關閉月曆設定</h3>
    </div>

    <!-- 選取的日期摘要 (支援單選與多選) -->
    <div class="selected-date-box">
      <div class="date-field">
        <div class="field-header">
          <span class="field-label">欲關閉日期</span>
          <span v-if="selectedDates.length > 0" class="badge-count">
            已選 {{ selectedDates.length }} 天
          </span>
        </div>

        <div v-if="selectedDates.length === 0" class="empty-hint">
          請在左側月曆點選欲關閉的日期（可多選）
        </div>

        <div v-else class="chips-container">
          <span v-for="d in selectedDates" :key="d" class="date-chip">
            <span class="chip-text">{{ d }}</span>
            <button
              type="button"
              class="chip-remove"
              @click.stop="emit('remove-date', d)"
              title="移除此日期"
            >
              ✕
            </button>
          </span>
        </div>
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
        :disabled="selectedDates.length === 0 || isSubmitting"
        @click="emit('confirm')"
      >
        <Lock :size="15" />
        <span>{{ isSubmitting ? '正在關閉中...' : (selectedDates.length > 1 ? `確認關閉所選 ${selectedDates.length} 個日期` : '確認關閉此日期月曆') }}</span>
      </button>

      <button
        v-if="selectedDates.length > 0 || modelValue"
        type="button"
        class="btn-clear"
        @click="emit('clear')"
      >
        <RotateCcw :size="14" />
        <span>全部清除 / 重選</span>
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

.selected-date-box {
  background: var(--admin-bg-base, #F5F3EC);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.28));
  border-radius: 6px;
  padding: 0.9rem 1.1rem;
  display: flex;
  flex-direction: column;

  .date-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    .field-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .field-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--admin-text-main, #1A1E1F);
      }

      .badge-count {
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.15rem 0.5rem;
        background: rgba(197, 168, 128, 0.2);
        color: var(--gold-dark, #91754F);
        border-radius: 4px;
      }
    }

    .empty-hint {
      color: var(--admin-text-muted, #64748b);
      font-size: 0.85rem;
      padding: 0.35rem 0;
    }

    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      max-height: 120px;
      overflow-y: auto;
      padding-top: 0.25rem;
    }

    .date-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.55rem;
      background: var(--admin-bg-card, #FFFFFF);
      border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.35));
      border-radius: 4px;
      font-size: 0.8rem;
      font-family: monospace;
      color: var(--admin-text-main, #1A1E1F);

      .chip-remove {
        background: transparent;
        border: none;
        color: var(--admin-text-muted, #64748b);
        cursor: pointer;
        font-size: 0.75rem;
        padding: 0 0.15rem;
        line-height: 1;
        &:hover { color: #dc2626; }
      }
    }
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
