<script setup>
import { X, Lock, AlertCircle, Check, RotateCcw } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  block: {
    type: Object,
    default: null
  },
  isSubmitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const closeModal = () => {
  if (!props.isSubmitting) {
    emit('update:modelValue', false)
  }
}

const calculateNights = (s, e) => {
  if (!s || !e) return 1
  return Math.max(1, Math.round((new Date(e) - new Date(s)) / (1000 * 60 * 60 * 24)))
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue && block" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <div class="header-info">
            <Lock :size="20" class="text-gold" />
            <h3>確認解除自主關閉檔期</h3>
          </div>
          <button class="btn-close" @click="closeModal" :disabled="isSubmitting" aria-label="Close">
            <X :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <div class="notice-box">
            <AlertCircle :size="18" class="text-info" />
            <div class="notice-text">
              <strong>即將解除此區間的自主關閉鎖定</strong>
              <p>解除後，前台預訂月曆將立即恢復為空房，開放旅客線上預約。</p>
            </div>
          </div>

          <div class="dates-summary-card">
            <div class="summary-row">
              <span class="label">起始日期 (Check-in)：</span>
              <span class="value font-mono">{{ block.startDate || block.start_date }}</span>
            </div>
            <div class="summary-row">
              <span class="label">結束日期 (Check-out)：</span>
              <span class="value font-mono">{{ block.endDate || block.end_date }}</span>
            </div>
            <div class="summary-row">
              <span class="label">鎖定晚數：</span>
              <span class="value font-bold text-gold">
                {{ calculateNights(block.startDate || block.start_date, block.endDate || block.end_date) }} 晚
              </span>
            </div>
            <div class="summary-row reason-row">
              <span class="label">原關閉理由說明：</span>
              <span class="value reason-value">{{ block.summary || '管家自主保留' }}</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn-confirm-unlock"
            :disabled="isSubmitting"
            @click="emit('confirm', block)"
          >
            <Check :size="16" />
            <span>{{ isSubmitting ? '正在解除中...' : '確認解除 (重新開放)' }}</span>
          </button>
          <button
            type="button"
            class="btn-cancel"
            :disabled="isSubmitting"
            @click="closeModal"
          >
            <RotateCcw :size="15" />
            <span>取消返回</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-card {
  width: 100%;
  max-width: 480px;
  background: var(--admin-bg-card, #FFFFFF);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.35));
  border-radius: 10px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.22);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--admin-border, rgba(197, 168, 128, 0.2));
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-info {
    display: flex;
    align-items: center;
    gap: 0.65rem;

    .text-gold {
      color: var(--gold-dark, #91754F);
    }

    h3 {
      font-size: 1.1rem;
      margin: 0;
      font-weight: 600;
      color: var(--admin-text-main, #1A1E1F);
    }
  }

  .btn-close {
    background: transparent;
    border: none;
    color: var(--admin-text-muted, #64748b);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    border-radius: 4px;
    transition: color 0.2s ease, background-color 0.2s ease;

    &:hover:not(:disabled) {
      color: var(--admin-text-main, #1A1E1F);
      background: var(--admin-bg-base, #F5F3EC);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.notice-box {
  display: flex;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.22);
  border-radius: 6px;

  .text-info {
    color: #2563eb;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .notice-text {
    font-size: 0.85rem;
    color: var(--admin-text-main, #1A1E1F);

    strong {
      display: block;
      margin-bottom: 0.2rem;
      color: #1e40af;
    }

    p {
      margin: 0;
      color: var(--admin-text-sub, #475569);
      line-height: 1.4;
    }
  }
}

.dates-summary-card {
  background: var(--admin-bg-base, #F5F3EC);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.25));
  border-radius: 8px;
  padding: 1.1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;

    .label {
      color: var(--admin-text-sub, #475569);
      font-weight: 500;
    }

    .value {
      color: var(--admin-text-main, #1A1E1F);
      font-weight: 600;
    }

    .text-gold {
      color: var(--gold-dark, #91754F);
    }
  }

  .reason-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.35rem;
    border-top: 1px dashed var(--admin-border, rgba(197, 168, 128, 0.3));
    padding-top: 0.65rem;

    .reason-value {
      font-size: 0.88rem;
      color: var(--gold-dark, #91754F);
      background: var(--admin-bg-card, #FFFFFF);
      padding: 0.4rem 0.65rem;
      border-radius: 4px;
      width: 100%;
      box-sizing: border-box;
      border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.2));
    }
  }
}

.modal-footer {
  padding: 1.15rem 1.5rem;
  border-top: 1px solid var(--admin-border, rgba(197, 168, 128, 0.2));
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  background: var(--admin-bg-card, #FFFFFF);

  .btn-confirm-unlock {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.6rem 1.25rem;
    background: #2563eb;
    color: #FFFFFF;
    border: none;
    border-radius: 6px;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease, opacity 0.2s ease;

    &:hover:not(:disabled) {
      background: #1d4ed8;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .btn-cancel {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.6rem 1.1rem;
    background: var(--admin-bg-base, #F5F3EC);
    border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3));
    color: var(--admin-text-sub, #475569);
    border-radius: 6px;
    font-size: 0.88rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease;

    &:hover:not(:disabled) {
      background: var(--admin-bg-card, #FFFFFF);
      color: var(--admin-text-main, #1A1E1F);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}
</style>
