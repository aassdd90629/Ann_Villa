<script setup>
import { CalendarX, Lock, RotateCcw, MousePointerClick, CalendarRange } from 'lucide-vue-next'

const props = defineProps({
  selectedDates: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: String,
    default: ''
  },
  selectionMode: {
    type: String,
    default: 'individual'
  },
  rangeStart: {
    type: String,
    default: null
  },
  isSubmitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:modelValue',
  'update:selectionMode',
  'confirm',
  'clear',
  'remove-date'
])
</script>

<template>
  <div class="action-card">
    <div class="card-head">
      <CalendarX :size="18" class="text-gold" />
      <h3 class="card-title">自主關閉月曆設定</h3>
    </div>

    <!-- 選取模式切換 (個別點選 vs 連續區間) -->
    <div class="mode-select-section">
      <div class="mode-header">
        <span class="mode-label">選取模式</span>
      </div>
      <div class="mode-pills">
        <button
          type="button"
          class="mode-pill-btn"
          :class="{ active: selectionMode === 'individual' }"
          @click="emit('update:selectionMode', 'individual')"
        >
          <MousePointerClick :size="13" />
          <span>個別點選 (單/多日)</span>
        </button>
        <button
          type="button"
          class="mode-pill-btn"
          :class="{ active: selectionMode === 'range' }"
          @click="emit('update:selectionMode', 'range')"
        >
          <CalendarRange :size="13" />
          <span>連續區間 (包日)</span>
        </button>
      </div>

      <div class="mode-tip-box">
        <template v-if="selectionMode === 'range'">
          <span v-if="!rangeStart">
            💡 <strong>連續區間：</strong>請先點選月曆第一天為【起始日】，再點選【結束日】即可一鍵包下整段區間。
          </span>
          <span v-else class="text-gold-highlight">
            🎯 <strong>已選起始日：{{ rangeStart }}</strong>，請點選【結束日】完成區間全選。
          </span>
        </template>
        <template v-else>
          <span>💡 <strong>個別點選：</strong>點擊任何日期加入或取消；亦可按住 <kbd class="kbd-hint">Shift</kbd> 鍵點選快速連選區間。</span>
        </template>
      </div>
    </div>

    <!-- 選取的日期摘要 (支援單選與多選) -->
    <div class="selected-date-box">
      <div class="date-field">
        <div class="field-header">
          <span class="field-label">欲關閉日期清單</span>
          <span v-if="selectedDates.length > 0" class="badge-count">
            已選 {{ selectedDates.length }} 天
          </span>
        </div>

        <div v-if="selectedDates.length === 0" class="empty-hint">
          請在左側月曆點選欲關閉的日期（支援單選一天、多選多天或連續區間）
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
        <span>
          {{ isSubmitting ? '正在關閉中...' : (selectedDates.length > 1 ? `確認批次關閉所選 ${selectedDates.length} 個日期` : (selectedDates.length === 1 ? '確認關閉此日期月曆 (共 1 天)' : '請在月曆選取欲關閉日期')) }}
        </span>
      </button>

      <button
        v-if="selectedDates.length > 0 || modelValue || rangeStart"
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
  gap: 1.15rem;
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

.mode-select-section {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  background: var(--admin-bg-base, #F5F3EC);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.2));
  border-radius: 6px;
  padding: 0.75rem 0.9rem;

  .mode-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .mode-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--admin-text-sub, #475569);
    }
  }

  .mode-pills {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem;

    .mode-pill-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      padding: 0.42rem 0.5rem;
      border-radius: 5px;
      font-size: 0.78rem;
      font-weight: 500;
      cursor: pointer;
      background: var(--admin-bg-card, #FFFFFF);
      border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3));
      color: var(--admin-text-sub, #475569);
      transition: all 0.2s;

      &:hover {
        border-color: var(--gold-primary, #C5A880);
        color: var(--gold-dark, #91754F);
      }

      &.active {
        background: var(--gold-primary, #C5A880);
        border-color: var(--gold-primary, #C5A880);
        color: #121415;
        font-weight: 700;
      }
    }
  }

  .mode-tip-box {
    font-size: 0.74rem;
    line-height: 1.4;
    color: var(--admin-text-sub, #64748b);
    padding-top: 0.2rem;

    .text-gold-highlight {
      color: var(--gold-dark, #91754F);
    }
    .kbd-hint {
      display: inline-block;
      padding: 1px 4px;
      font-size: 0.7rem;
      font-family: inherit;
      background: rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(0, 0, 0, 0.15);
      border-radius: 3px;
    }
  }
}

.selected-date-box {
  background: var(--admin-bg-base, #F5F3EC);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.28));
  border-radius: 6px;
  padding: 0.85rem 1rem;
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
      .field-label { font-size: 0.82rem; font-weight: 600; color: var(--admin-text-main, #1A1E1F); }
      .badge-count { font-size: 0.75rem; font-weight: 600; padding: 0.15rem 0.5rem; background: rgba(197, 168, 128, 0.2); color: var(--gold-dark, #91754F); border-radius: 4px; }
    }

    .empty-hint { color: var(--admin-text-muted, #64748b); font-size: 0.8rem; line-height: 1.4; padding: 0.25rem 0; }

    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      max-height: 140px;
      overflow-y: auto;
      padding-right: 2px;

      .date-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.2rem 0.5rem;
        background: var(--admin-bg-card, #FFFFFF);
        border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.35));
        border-radius: 4px;
        font-size: 0.8rem;
        color: var(--admin-text-main, #1A1E1F);
        font-family: monospace;

        .chip-remove {
          background: none;
          border: none;
          color: var(--admin-text-muted, #94a3b8);
          font-size: 0.75rem;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          &:hover { color: #dc2626; }
        }
      }
    }
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  .form-label { font-size: 0.82rem; font-weight: 600; color: var(--admin-text-main, #1A1E1F); }
  .form-textarea {
    width: 100%;
    padding: 0.6rem 0.75rem;
    border-radius: 6px;
    background: var(--admin-bg-card, #FFFFFF);
    border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3));
    color: var(--admin-text-main, #1A1E1F);
    font-size: 0.85rem;
    resize: vertical;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
    &:focus { border-color: var(--gold-primary, #C5A880); }
    &::placeholder { color: var(--admin-text-muted, #94a3b8); font-size: 0.8rem; }
  }
}

.card-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  .btn-confirm-close {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.75rem 1rem;
    background: #dc2626;
    color: #FFFFFF;
    border: none;
    border-radius: 6px;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease, opacity 0.2s ease;
    &:hover:not(:disabled) { background: #b91c1c; }
    &:disabled { background: #cbd5e1; color: #94a3b8; cursor: not-allowed; }
  }

  .btn-clear {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.5rem 0.75rem;
    background: transparent;
    color: var(--admin-text-sub, #64748b);
    border: 1px dashed var(--admin-border, rgba(197, 168, 128, 0.4));
    border-radius: 6px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
    &:hover { background: var(--admin-bg-base, #F5F3EC); color: var(--admin-text-main, #1A1E1F); border-color: var(--gold-primary, #C5A880); }
  }
}
</style>
