<script setup>
import { ref, watch } from 'vue'
import { X, AlertTriangle, Trash2, CalendarX, ShieldAlert, Clock } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  booking: { type: Object, default: null },
  isSubmitting: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'confirm-cancel'])

const selectedCategory = ref('FORCE_MAJEURE')
const cancelNote = ref('')

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      selectedCategory.value = 'FORCE_MAJEURE'
      cancelNote.value = ''
    }
  }
)

const handleClose = () => {
  if (!props.isSubmitting) {
    emit('update:modelValue', false)
  }
}

const handleConfirm = () => {
  emit('confirm-cancel', {
    bookingId: props.booking.id,
    cancelReasonCategory: selectedCategory.value,
    cancelReasonNote: cancelNote.value.trim()
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue && booking" class="modal-overlay" @click.self="handleClose">
      <div class="modal-card">
        <div class="modal-header">
          <div class="header-info">
            <AlertTriangle :size="20" class="text-danger" />
            <h3>取消訂單與檔期釋放確認</h3>
          </div>
          <button class="btn-close" :disabled="isSubmitting" @click="handleClose" aria-label="Close">
            <X :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <div class="target-summary">
            <div class="summary-line">
              <span class="lbl">訂單編號：</span>
              <span class="val font-mono font-bold">{{ booking.id }}</span>
            </div>
            <div class="summary-line">
              <span class="lbl">預訂貴賓：</span>
              <span class="val font-bold">{{ booking.guest_name }} 貴賓 ({{ booking.guest_phone }})</span>
            </div>
            <div class="summary-line">
              <span class="lbl">原訂檔期：</span>
              <span class="val text-gold font-bold">{{ booking.check_in }} 至 {{ booking.check_out }} ({{ booking.nights }} 晚)</span>
            </div>
          </div>

          <div class="category-selection-section">
            <label class="section-label">請選擇取消原因分類（P3 營運管理）：</label>
            <div class="radio-cards">
              <label class="radio-card" :class="{ active: selectedCategory === 'FORCE_MAJEURE' }">
                <input v-model="selectedCategory" type="radio" value="FORCE_MAJEURE" />
                <div class="card-content">
                  <div class="card-title">
                    <ShieldAlert :size="16" class="icon" />
                    <strong>天災不可抗力（颱風停班停課）</strong>
                  </div>
                  <p class="card-desc">依規定免扣手續費全額退還定金；檔期立即釋放為空房。</p>
                </div>
              </label>

              <label class="radio-card" :class="{ active: selectedCategory === 'RESCHEDULE_HOLD' }">
                <input v-model="selectedCategory" type="radio" value="RESCHEDULE_HOLD" />
                <div class="card-content">
                  <div class="card-title">
                    <Clock :size="16" class="icon" />
                    <strong>協商延期保留（保留定金權益）</strong>
                  </div>
                  <p class="card-desc">原檔期立即釋放供其他客人預約，原定金保留延期權益不予沒入。</p>
                </div>
              </label>

              <label class="radio-card" :class="{ active: selectedCategory === 'GUEST_PERSONAL' }">
                <input v-model="selectedCategory" type="radio" value="GUEST_PERSONAL" />
                <div class="card-content">
                  <div class="card-title">
                    <CalendarX :size="16" class="icon" />
                    <strong>旅客個人因素取消</strong>
                  </div>
                  <p class="card-desc">依觀光局定型化契約扣款比例核算退費；檔期立即釋放。</p>
                </div>
              </label>
            </div>
          </div>

          <div class="note-section">
            <label class="section-label">取消說明與協商備註（選填）：</label>
            <textarea
              v-model="cancelNote"
              rows="3"
              class="form-textarea"
              placeholder="例：凱米颱風南投縣政府公告停班停課，已電聯旅客並於後台全額匯退定金。"
            ></textarea>
          </div>

          <div class="warning-callout">
            <AlertTriangle :size="16" />
            <span>確認取消後，該檔期每日庫存將立即釋放，官網日曆將恢復為可預訂狀態！</span>
          </div>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn-confirm-cancel"
            :disabled="isSubmitting"
            @click="handleConfirm"
          >
            <Trash2 :size="15" />
            <span>{{ isSubmitting ? '正在取消並釋放房態...' : '確認取消訂單並釋放檔期' }}</span>
          </button>
          <button type="button" class="btn-cancel" :disabled="isSubmitting" @click="handleClose">
            放棄取消
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
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-card {
  width: 100%;
  max-width: 540px;
  background: var(--admin-bg-card, #FFFFFF);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.35));
  border-radius: 10px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 1.15rem 1.5rem;
  border-bottom: 1px solid var(--admin-border, rgba(197, 168, 128, 0.2));
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-info {
    display: flex;
    align-items: center;
    gap: 0.6rem;

    .text-danger {
      color: #ef4444;
    }

    h3 {
      font-size: 1.05rem;
      margin: 0;
      color: var(--admin-text-main, #1A1E1F);
    }
  }

  .btn-close {
    background: transparent;
    border: none;
    color: var(--admin-text-muted, #64748b);
    cursor: pointer;
    padding: 0.25rem;

    &:hover {
      color: var(--admin-text-main, #1A1E1F);
    }
  }
}

.modal-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.target-summary {
  background: var(--admin-bg-base, #F5F3EC);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3));
  border-radius: 8px;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  .summary-line {
    font-size: 0.88rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .lbl {
      color: var(--admin-text-sub, #475569);
      width: 72px;
    }

    .val {
      color: var(--admin-text-main, #1A1E1F);
    }

    .text-gold {
      color: var(--gold-dark, #91754F);
    }
  }
}

.section-label {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--admin-text-main, #1A1E1F);
  margin-bottom: 0.5rem;
  display: block;
}

.radio-cards {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.radio-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3));
  border-radius: 8px;
  background: var(--admin-bg-card, #FFFFFF);
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;

  input[type="radio"] {
    margin-top: 0.25rem;
    accent-color: var(--gold-primary, #C5A880);
  }

  &.active {
    border-color: var(--gold-primary, #C5A880);
    background: rgba(197, 168, 128, 0.08);
  }

  &:hover {
    border-color: var(--gold-primary, #C5A880);
  }

  .card-content {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;

    .card-title {
      font-size: 0.88rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--admin-text-main, #1A1E1F);

      .icon {
        color: var(--gold-dark, #91754F);
      }
    }

    .card-desc {
      margin: 0;
      font-size: 0.8rem;
      color: var(--admin-text-sub, #64748b);
      line-height: 1.4;
    }
  }
}

.form-textarea {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3));
  border-radius: 6px;
  font-size: 0.88rem;
  background: var(--admin-bg-card, #FFFFFF);
  color: var(--admin-text-main, #1A1E1F);
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--gold-primary, #C5A880);
  }
}

.warning-callout {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.85rem;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 6px;
  color: #dc2626;
  font-size: 0.82rem;
  font-weight: 500;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--admin-border, rgba(197, 168, 128, 0.2));
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;

  .btn-confirm-cancel {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.6rem 1.15rem;
    background: #dc2626;
    color: #ffffff;
    border: none;
    border-radius: 6px;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover:not(:disabled) {
      background: #b91c1c;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .btn-cancel {
    padding: 0.6rem 1rem;
    background: transparent;
    border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3));
    border-radius: 6px;
    color: var(--admin-text-sub, #475569);
    font-size: 0.88rem;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;

    &:hover:not(:disabled) {
      background: var(--admin-bg-base, #F5F3EC);
      color: var(--admin-text-main, #1A1E1F);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>
