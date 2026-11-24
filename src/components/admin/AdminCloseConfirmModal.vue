<script setup>
import { X, CalendarX, AlertTriangle, Check, RotateCcw } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: String,
    default: ''
  },
  endDate: {
    type: String,
    default: ''
  },
  nights: {
    type: Number,
    default: 0
  },
  reason: {
    type: String,
    default: ''
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
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <div class="header-info">
            <CalendarX :size="20" class="text-gold" />
            <h3>確認關閉月曆檔期</h3>
          </div>
          <button class="btn-close" @click="closeModal" :disabled="isSubmitting" aria-label="Close">
            <X :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <div class="notice-box">
            <AlertTriangle :size="18" class="text-warning" />
            <div class="notice-text">
              <strong>即將手動關閉以下檔期</strong>
              <p>關閉送出後，前台預訂月曆將即刻反灰，訪客將無法預約此時段。</p>
            </div>
          </div>

          <div class="dates-summary-card">
            <div class="summary-row">
              <span class="label">關閉起始日 (Check-in)：</span>
              <span class="value font-mono">{{ startDate }}</span>
            </div>
            <div class="summary-row">
              <span class="label">關閉結束日 (Check-out)：</span>
              <span class="value font-mono">{{ endDate }}</span>
            </div>
            <div class="summary-row">
              <span class="label">關閉總晚數：</span>
              <span class="value font-bold text-gold">{{ nights }} 晚</span>
            </div>
            <div class="summary-row reason-row">
              <span class="label">關閉理由說明：</span>
              <span class="value reason-value">
                {{ reason ? reason : '自主保留 / 閉館維護 (預設)' }}
              </span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn-confirm-close"
            :disabled="isSubmitting"
            @click="emit('confirm')"
          >
            <Check :size="16" />
            <span>{{ isSubmitting ? '正在鎖定關閉中...' : '確認關閉此檔期' }}</span>
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
  background: rgba(234, 179, 8, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.25);
  border-radius: 6px;

  .text-warning {
    color: #b45309;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .notice-text {
    font-size: 0.85rem;
    color: var(--admin-text-main, #1A1E1F);

    strong {
      display: block;
      margin-bottom: 0.2rem;
      color: #92400e;
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

  .btn-confirm-close {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.6rem 1.25rem;
    background: var(--gold-dark, #91754F);
    color: #FFFFFF;
    border: none;
    border-radius: 6px;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease, opacity 0.2s ease;

    &:hover:not(:disabled) {
      background: var(--gold-primary, #C5A880);
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
