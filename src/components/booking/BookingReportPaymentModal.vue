<script setup>
import { ref, watch } from 'vue'
import { X, CreditCard, Send, AlertCircle, CheckCircle2 } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  booking: {
    type: Object,
    default: null
  },
  defaultPhone: {
    type: String,
    default: ''
  },
  defaultEmail: {
    type: String,
    default: ''
  },
  isSubmitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'submit-payment'])

const bankLast5 = ref('')
const paymentNote = ref('')
const formError = ref('')

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      bankLast5.value = props.booking?.bank_last_5 || ''
      paymentNote.value = props.booking?.payment_note || ''
      formError.value = ''
    }
  }
)

const handleClose = () => {
  if (!props.isSubmitting) {
    emit('update:modelValue', false)
  }
}

const handleSubmit = () => {
  const cleanLast5 = bankLast5.value.trim().toUpperCase()
  if (!cleanLast5 || cleanLast5.length !== 5) {
    formError.value = '請填寫正確的 5 碼匯款帳號後五碼（英數）。'
    return
  }

  formError.value = ''
  emit('submit-payment', {
    bookingId: props.booking?.id,
    phone: props.defaultPhone || props.booking?.guest_phone,
    email: props.defaultEmail || props.booking?.guest_email,
    bankLast5: cleanLast5,
    paymentNote: paymentNote.value.trim()
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="report-modal-overlay" @click.self="handleClose">
      <div class="report-modal-card card-luxury" role="dialog" aria-modal="true">
        <button class="modal-close-btn" @click="handleClose" aria-label="Close">
          <X :size="20" />
        </button>

        <div class="modal-header">
          <div class="header-icon-wrap">
            <CreditCard :size="24" class="text-gold" />
          </div>
          <h3 class="modal-title">回報定金匯款末五碼</h3>
          <p class="modal-subtitle">
            請輸入您匯款之金融機構帳號後五碼，以便山語 Villa 管家核對帳目並正式鎖定檔期。
          </p>
        </div>

        <div v-if="booking" class="order-summary-box">
          <div class="summary-row">
            <span class="label">訂單編號</span>
            <span class="value font-mono">{{ booking.id }}</span>
          </div>
          <div class="summary-row">
            <span class="label">入住日期</span>
            <span class="value">{{ booking.check_in }} 至 {{ booking.check_out }} ({{ booking.nights }} 晚)</span>
          </div>
          <div class="summary-row highlight">
            <span class="label font-bold">應付定金 (50%)</span>
            <span class="value text-gold font-bold">NT$ {{ Number(booking.deposit_amount).toLocaleString() }}</span>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="report-form">
          <div v-if="formError" class="form-error-alert">
            <AlertCircle :size="16" />
            <span>{{ formError }}</span>
          </div>

          <div class="form-group">
            <label for="bankLast5">
              匯款帳號後五碼 <span class="required">*</span>
            </label>
            <input 
              id="bankLast5"
              v-model="bankLast5"
              type="text"
              maxlength="5"
              class="form-input font-mono uppercase"
              placeholder="例如：88219"
              required
              :disabled="isSubmitting"
            />
            <span class="input-hint">若使用台灣 Pay 或行動網銀轉帳，請填寫扣款帳號之後五碼。</span>
          </div>

          <div class="form-group">
            <label for="paymentNote">
              匯款備註說明 (選填)
            </label>
            <textarea 
              id="paymentNote"
              v-model="paymentNote"
              rows="2"
              class="form-textarea"
              placeholder="例如：預計下午自台銀匯出、匯款人戶名陳OO等"
              :disabled="isSubmitting"
            ></textarea>
          </div>

          <div class="modal-actions">
            <button 
              type="button" 
              class="btn btn-outline" 
              @click="handleClose"
              :disabled="isSubmitting"
            >
              取消返回
            </button>
            <button 
              type="submit" 
              class="btn btn-gold" 
              :disabled="isSubmitting"
            >
              <Send :size="16" />
              <span>{{ isSubmitting ? '正在回報...' : '確認送出末五碼' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.report-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background-color: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.report-modal-card {
  position: relative;
  width: 100%;
  max-width: 520px;
  background-color: var(--bg-card);
  border: 1px solid var(--border-gold-subtle);
  border-radius: 12px;
  padding: 2.25rem 2rem;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.4);
}

.modal-close-btn {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: var(--text-primary);
    border-color: var(--gold-primary);
  }
}

.modal-header {
  text-align: center;
  margin-bottom: 1.5rem;

  .header-icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background-color: rgba(212, 175, 55, 0.12);
    border: 1px solid var(--border-gold-subtle);
    margin-bottom: 0.85rem;
  }

  .modal-title {
    font-size: 1.35rem;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: 0.05em;
    margin-bottom: 0.35rem;
  }

  .modal-subtitle {
    font-size: 0.88rem;
    color: var(--text-muted);
    line-height: 1.5;
  }
}

.order-summary-box {
  background-color: var(--bg-body);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;

  .summary-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.88rem;
    padding: 0.35rem 0;
    color: var(--text-secondary);

    &.highlight {
      border-top: 1px dashed var(--border-color);
      margin-top: 0.35rem;
      padding-top: 0.6rem;
      font-size: 0.95rem;
    }
  }
}

.report-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-error-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #f87171;
  font-size: 0.85rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;

  label {
    font-size: 0.88rem;
    font-weight: 500;
    color: var(--text-primary);

    .required {
      color: var(--gold-primary);
    }
  }

  .form-input,
  .form-textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    background-color: var(--bg-body);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 0.95rem;
    transition: border-color 0.2s ease;

    &:focus {
      outline: none;
      border-color: var(--gold-primary);
      box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
    }
  }

  .uppercase {
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
  }

  .input-hint {
    font-size: 0.78rem;
    color: var(--text-muted);
  }
}

.modal-actions {
  display: flex;
  gap: 0.85rem;
  margin-top: 0.75rem;

  .btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: 6px;
    font-size: 0.92rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-outline {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-secondary);

    &:hover:not(:disabled) {
      border-color: var(--text-primary);
      color: var(--text-primary);
    }
  }

  .btn-gold {
    background-color: var(--gold-primary);
    border: 1px solid var(--gold-primary);
    color: #121212;

    &:hover:not(:disabled) {
      background-color: var(--gold-hover);
      border-color: var(--gold-hover);
    }
  }
}
</style>
